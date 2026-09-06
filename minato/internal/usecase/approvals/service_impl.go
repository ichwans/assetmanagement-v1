package approvals

import (
	"context"
	"time"

	uuid "github.com/hashicorp/go-uuid"
	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/fabricgw"
	"gitlab.com/riski/internal/pkg/log"
	notifs "gitlab.com/riski/internal/usecase/notifications"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"strings"
)

type service struct {
	repo   repositories.Approvals
	users  repositories.User
	notif  notifs.Service
	assets repositories.Asset
	gw     fabricgw.Client
}

func NewService(repo repositories.Approvals, users repositories.User, notif notifs.Service, assets repositories.Asset, gw fabricgw.Client) Service {
	return &service{repo: repo, users: users, notif: notif, assets: assets, gw: gw}
}

func (s *service) List(ctx context.Context, status string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] approvals.List - START", "status", status)

	rows, err := s.repo.List(ctx, status)
	if err != nil {
		log.Error(ctx, "[USECASE] approvals.List - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	out := make([]ApprovalItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, fromEntity(r))
	}

	log.Info(ctx, "[USECASE] approvals.List - SUCCESS", "count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: out}, nil
}

func (s *service) GetByID(ctx context.Context, id string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] approvals.GetByID - START", "id", id)

	row, err := s.repo.GetByID(ctx, id)
	if err != nil {
		log.Error(ctx, "[USECASE] approvals.GetByID - Repository error", err.Error())
	}
	if row == nil {
		log.Info(ctx, "[USECASE] approvals.GetByID - Not found", "id", id)
		return constants.DefaultResponse{Status: constants.STATUS_NO_DATA, Message: constants.MESSAGE_DATA_NOT_FOUND, Data: struct{}{}}, nil
	}
	a := fromEntity(*row)

	log.Info(ctx, "[USECASE] approvals.GetByID - SUCCESS", "type", a.Type, "status", a.Status)
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: a}, nil
}

func (s *service) Decide(ctx context.Context, id string, decision string, note string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] approvals.Decide - START", "id", id, "decision", decision)

	fields := bson.M{}
	if decision == "APPROVE" {
		fields["status"] = "APPROVED"
	}
	if decision == "REJECT" {
		fields["status"] = "REJECTED"
	}
	if note != "" {
		fields["$push"] = bson.M{"notes": time.Now().UTC().Format(time.RFC3339) + " " + note}
	}
	if len(fields) == 0 {
		log.Info(ctx, "[USECASE] approvals.Decide - No fields to update")
		return s.GetByID(ctx, id)
	}

	log.Info(ctx, "[USECASE] approvals.Decide - Updating in repository")
	if err := s.repo.Update(ctx, id, fields); err != nil {
		log.Error(ctx, "[USECASE] approvals.Decide - Repository error", err.Error())
	}

	log.Info(ctx, "[USECASE] approvals.Decide - SUCCESS (DB)")
	// Post-processing: notify requester and apply asset changes on approval
	var respErrors []constants.DefaultResponseError
	if row, err := s.repo.GetByID(ctx, id); err == nil && row != nil {
		if row.RequesterID != "" {
			_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{UserID: row.RequesterID, Type: "approval", Title: "Keputusan Approval", Message: "Permintaan anda telah diproses", Link: "/approvals/" + id})
		}
			if decision == "APPROVE" && row.Type == "transfer" {
				// Submit to ledger first (attach latest handover doc CID if available)
				var txId string
				if s.gw != nil {
					ownerUnitID := row.ToUnit
					if strings.TrimSpace(ownerUnitID) == "" {
						ownerUnitID = row.ToOwnerID
					}
					docCID := ""
					if s.assets != nil {
						if docs, err := s.assets.GetDocuments(ctx, row.AssetID); err == nil {
							var latest time.Time
							for _, d := range docs {
								if d.Type == "handover" || d.Type == "handover_return" {
									if d.CreatedAt.After(latest) {
										latest = d.CreatedAt
										docCID = d.IpfsCID
									}
								}
							}
						}
					}
					// Fallback when no supporting document available
					if strings.TrimSpace(docCID) == "" {
						docCID = "-"
					}
					tx, committed, _, err := s.gw.Submit(ctx, "TransferAsset", []string{row.AssetID, ownerUnitID, row.ToLocationID, row.TransferType, row.Reason, docCID})
					if err != nil {
						log.Error(ctx, "[USECASE] approvals.Decide - Fabric TransferAsset error", err.Error())
						respErrors = append(respErrors, constants.DefaultResponseError{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: "TransferAsset failed: " + err.Error()})
					}
					if committed {
						txId = tx
					}
				}
			// Update asset owner/location and status
			ownerName := ""
			if oid, err := primitive.ObjectIDFromHex(row.ToOwnerID); err == nil {
				if u, _ := s.users.GetUserByID(ctx, oid); u != nil {
					ownerName = u.FullName
				}
			}
			if s.assets != nil {
				_ = s.assets.UpdateOwnerAndLocation(ctx, row.AssetID, row.ToOwnerID, ownerName, row.ToLocationID)
				status := "active"
				if strings.EqualFold(row.TransferType, "borrow") {
					status = "borrowed"
				}
				_ = s.assets.UpdateStatus(ctx, row.AssetID, status)
				// Add history event
				evt := entities.AssetHistoryEvent{
					ID:          id,
					AssetID:     row.AssetID,
					EventType:   "transfer",
					Date:        time.Now().UTC().Format(time.RFC3339),
					Description: "Transfer approved",
					Details:     map[string]interface{}{"toOwnerId": row.ToOwnerID, "toLocationId": row.ToLocationID, "transferType": row.TransferType},
					TxID:        txId,
				}
				_ = s.assets.InsertManyHistory(ctx, []entities.AssetHistoryEvent{evt})
			}
			// Notify the recipient/new owner
			if row.ToOwnerID != "" {
				_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{
					UserID:  row.ToOwnerID,
					Type:    "asset",
					Title:   "Asset Diteruskan ke Anda",
					Message: "Anda menerima asset " + row.AssetName,
					Link:    "/assets/" + row.AssetID,
				})
			}
		}
        if decision == "APPROVE" && row.Type == "dispose" {
            var txId string
            if s.gw != nil {
                // Attach a docCID if available; fallback to '-' to satisfy schema requirements
                docCID := ""
                if s.assets != nil {
                    if docs, err := s.assets.GetDocuments(ctx, row.AssetID); err == nil {
                        // Prefer latest general image as supporting evidence, if any
                        var latest time.Time
                        for _, d := range docs {
                            if d.Type == "image" || d.Type == "handover" || d.Type == "handover_return" {
                                if d.CreatedAt.After(latest) {
                                    latest = d.CreatedAt
                                    docCID = d.IpfsCID
                                }
                            }
                        }
                    }
                }
                if strings.TrimSpace(docCID) == "" {
                    docCID = "-"
                }
                tx, committed, _, err := s.gw.Submit(ctx, "DisposeAsset", []string{row.AssetID, "", row.Reason, docCID})
                if err != nil {
                    log.Error(ctx, "[USECASE] approvals.Decide - Fabric DisposeAsset error", err.Error())
                    respErrors = append(respErrors, constants.DefaultResponseError{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: "DisposeAsset failed: " + err.Error()})
                }
                if committed {
                    txId = tx
                }
            }
			// Add history event for disposal
			if s.assets != nil {
				evt := entities.AssetHistoryEvent{
					ID:          id,
					AssetID:     row.AssetID,
					EventType:   "dispose",
					Date:        time.Now().UTC().Format(time.RFC3339),
					Description: "Dispose approved",
					Details:     map[string]interface{}{"reason": row.Reason},
					TxID:        txId,
				}
				_ = s.assets.InsertManyHistory(ctx, []entities.AssetHistoryEvent{evt})
				_ = s.assets.UpdateStatus(ctx, row.AssetID, "disposed")
			}
		}
	}
	// Build response with possible errors included
	if res, err := s.GetByID(ctx, id); err == nil {
		if len(respErrors) > 0 {
			res.Errors = respErrors
			res.Message = "Success with warnings"
		}
		return res, nil
	}
	return s.GetByID(ctx, id)
}

func (s *service) CreateTransfer(ctx context.Context, in ApprovalItem) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] approvals.CreateTransfer - START", "asset_id", in.AssetID, "transfer_type", in.TransferType)

	in.Type = "transfer"
	in.Status = "PENDING"
	if in.ID == "" {
		if gid, _ := uuid.GenerateUUID(); gid != "" {
			in.ID = gid
		}
	}

	// If ToOwnerID empty, treat as return-to-admin flow: pick an admin/admin_asset and fallback location to current asset
	if in.ToOwnerID == "" {
		if s.users != nil {
			if users, _, err := s.users.GetAllUser(ctx, entities.GetUsersReq{}); err == nil {
				for _, u := range users {
					r := strings.ToLower(u.UserType)
					if r == "admin" || r == "admin_asset" {
						in.ToOwnerID = u.ID.Hex()
						break
					}
				}
			}
		}
		if in.ToLocationID == "" && s.assets != nil {
			if a, _ := s.assets.GetByID(ctx, in.AssetID); a != nil {
				in.ToLocationID = a.Location
			}
		}
	}
	// Validate recipient user if provided
	if in.ToOwnerID != "" {
		oid, err := primitive.ObjectIDFromHex(in.ToOwnerID)
		if err != nil {
			log.Info(ctx, "[USECASE] approvals.CreateTransfer - Invalid toOwnerId format")
			return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: "Invalid recipient user id", Data: struct{}{}}, nil
		}
		u, err := s.users.GetUserByID(ctx, oid)
		if err != nil || u == nil {
			log.Info(ctx, "[USECASE] approvals.CreateTransfer - Recipient user not found", "toOwnerId", in.ToOwnerID)
			return constants.DefaultResponse{Status: constants.STATUS_NO_DATA, Message: "Recipient user not found", Data: struct{}{}}, nil
		}
	}

	log.Info(ctx, "[USECASE] approvals.CreateTransfer - Inserting to repository")
	if err := s.repo.Insert(ctx, toEntity(in)); err != nil {
		log.Error(ctx, "[USECASE] approvals.CreateTransfer - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] approvals.CreateTransfer - SUCCESS")
	s.notifyApprovers(ctx, "approval", "Approval Diperlukan", "Permintaan transfer/borrow membutuhkan persetujuan", "/approvals")
	if in.ToOwnerID != "" {
		title := "Permintaan Transfer"
		if strings.EqualFold(in.TransferType, "borrow") {
			title = "Permintaan Peminjaman"
		}
		msg := "Anda terpilih sebagai penerima asset " + in.AssetName + " (menunggu persetujuan)"
		_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{UserID: in.ToOwnerID, Type: "asset", Title: title, Message: msg, Link: "/assets/" + in.AssetID})
	}
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: in}, nil
}

func (s *service) CreateDispose(ctx context.Context, in ApprovalItem) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] approvals.CreateDispose - START", "asset_id", in.AssetID, "reason", in.Reason)

	in.Type = "dispose"
	in.Status = "PENDING"
	if in.ID == "" {
		if gid, _ := uuid.GenerateUUID(); gid != "" {
			in.ID = gid
		}
	}

	log.Info(ctx, "[USECASE] approvals.CreateDispose - Inserting to repository")
	if err := s.repo.Insert(ctx, toEntity(in)); err != nil {
		log.Error(ctx, "[USECASE] approvals.CreateDispose - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] approvals.CreateDispose - SUCCESS")
	s.notifyApprovers(ctx, "approval", "Approval Diperlukan", "Permintaan penghapusan asset membutuhkan persetujuan", "/approvals")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: in}, nil
}

func (s *service) notifyApprovers(ctx context.Context, ntype, title, message, link string) {
	if s.users == nil || s.notif == nil {
		return
	}
	docs, _, err := s.users.GetAllUser(ctx, entities.GetUsersReq{})
	if err != nil {
		return
	}
	for _, u := range docs {
		role := u.UserType
		if role == "admin" || role == "head_unit" || role == "admin_asset" {
			_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{UserID: u.ID.Hex(), Type: ntype, Title: title, Message: message, Link: link})
		}
	}
}

func fromEntity(e entities.ApprovalItem) ApprovalItem {
	return ApprovalItem{
		ID:            e.ID,
		Type:          e.Type,
		AssetID:       e.AssetID,
		AssetName:     e.AssetName,
		RequesterID:   e.RequesterID,
		RequesterName: e.RequesterName,
		ToUnit:        e.ToUnit,
		FromUnit:      e.FromUnit,
		Reason:        e.Reason,
		TransferType:  e.TransferType,
		ToOwnerID:     e.ToOwnerID,
		ToLocationID:  e.ToLocationID,
		CreatedAt:     e.CreatedAt.Format(time.RFC3339),
		Status:        e.Status,
		Notes:         e.Notes,
	}
}

func toEntity(a ApprovalItem) entities.ApprovalItem {
	return entities.ApprovalItem{
		ID:            a.ID,
		Type:          a.Type,
		AssetID:       a.AssetID,
		AssetName:     a.AssetName,
		RequesterID:   a.RequesterID,
		RequesterName: a.RequesterName,
		ToUnit:        a.ToUnit,
		FromUnit:      a.FromUnit,
		Reason:        a.Reason,
		TransferType:  a.TransferType,
		ToOwnerID:     a.ToOwnerID,
		ToLocationID:  a.ToLocationID,
		Status:        a.Status,
		Notes:         a.Notes,
		// CreatedAt will be set in repo if zero
	}
}
