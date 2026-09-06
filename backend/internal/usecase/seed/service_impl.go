package seed

import (
	"context"
	"time"

	"fmt"
	uuid "github.com/hashicorp/go-uuid"
	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/fabricgw"
	"gitlab.com/riski/internal/pkg/log"
	"strconv"
	"strings"
)

type service struct {
	assetRepo repositories.Asset
	metaRepo  repositories.Meta
	apprRepo  repositories.Approvals
	notifRepo repositories.Notifications
	usersRepo repositories.User
	gw        fabricgw.Client
}

func NewService(asset repositories.Asset, meta repositories.Meta, appr repositories.Approvals, notif repositories.Notifications, users repositories.User, gw fabricgw.Client) Service {
	return &service{assetRepo: asset, metaRepo: meta, apprRepo: appr, notifRepo: notif, usersRepo: users, gw: gw}
}

func isLedgerMode(ctx context.Context) bool {
	v := ctx.Value("seed_ledger")
	if b, ok := v.(bool); ok {
		return b
	}
	return false
}

func (s *service) SeedCategories(ctx context.Context, docs []Category) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedCategories - START", "count", len(docs))

	arr := make([]entities.Category, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, entities.Category{ID: d.ID, Name: d.Name, Slug: d.Slug, Description: d.Description, Icon: d.Icon})
	}
	if err := s.metaRepo.InsertManyCategories(ctx, arr); err != nil {
		log.Error(ctx, "[USECASE] seed.SeedCategories - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] seed.SeedCategories - SUCCESS")
	// notify admins
	s.notifyAdmins(ctx, "Import Categories", len(arr), "/settings")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) SeedLocations(ctx context.Context, docs []Location) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedLocations - START", "count", len(docs))

	arr := make([]entities.Location, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, entities.Location{ID: d.ID, Name: d.Name, Building: d.Building, Floor: d.Floor, Room: d.Room})
	}
	if err := s.metaRepo.InsertManyLocations(ctx, arr); err != nil {
		log.Error(ctx, "[USECASE] seed.SeedLocations - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] seed.SeedLocations - SUCCESS")
	s.notifyAdmins(ctx, "Import Locations", len(arr), "/settings")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) SeedAssets(ctx context.Context, docs []Asset) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedAssets - START", "count", len(docs))

	arr := make([]entities.Asset, 0, len(docs))
	for _, d := range docs {
		a := entities.Asset{
			AssetID: d.AssetID, Name: d.Name, Category: d.Category, Description: d.Description, SerialNumber: d.SerialNumber,
			Owner: d.Owner, OwnerName: d.OwnerName, Location: d.Location, LocationDetail: d.LocationDetail, Status: d.Status,
			AcquisitionDate: d.AcquisitionDate, AcquisitionPrice: d.AcquisitionPrice, Vendor: d.Vendor, InvoiceNumber: d.InvoiceNumber,
			TxID: d.TxID, BlockNumber: d.BlockNumber,
		}
		if t, err := time.Parse(time.RFC3339, d.CreatedAt); err == nil {
			a.CreatedAt = t
		}
		if t, err := time.Parse(time.RFC3339, d.UpdatedAt); err == nil {
			a.UpdatedAt = t
		}
		arr = append(arr, a)
	}
    // Write to ledger when gateway available (no longer gated by query param)
    if s.gw != nil {
        for i := range arr {
            a := &arr[i]
            if strings.TrimSpace(docs[i].AssetID) == "" {
                continue
            }
            txId, committed, _, err := s.gw.Submit(ctx, "CreateAsset", []string{docs[i].AssetID, a.Category, a.Owner, a.Location})
            if err == nil && committed {
                a.TxID = txId
            }
        }
    }
	if err := s.assetRepo.InsertManyAssets(ctx, arr); err != nil {
		log.Error(ctx, "[USECASE] seed.SeedAssets - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] seed.SeedAssets - SUCCESS")
	s.notifyAdmins(ctx, "Import Assets", len(arr), "/assets")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) SeedAssetHistory(ctx context.Context, docs []AssetHistoryEvent) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedAssetHistory - START", "count", len(docs))

	arr := make([]entities.AssetHistoryEvent, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, entities.AssetHistoryEvent{ID: d.ID, AssetID: d.AssetID, EventType: d.EventType, Date: d.Date, Description: d.Description, Details: d.Details, TxID: d.TxID, BlockNumber: d.BlockNumber})
	}
	if err := s.assetRepo.InsertManyHistory(ctx, arr); err != nil {
		log.Error(ctx, "[USECASE] seed.SeedAssetHistory - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] seed.SeedAssetHistory - SUCCESS")
	s.notifyAdmins(ctx, "Import Asset History", len(arr), "/assets")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) SeedMaintenance(ctx context.Context, docs []MaintenanceRecord) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedMaintenance - START", "count", len(docs))

	arr := make([]entities.MaintenanceRecord, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, entities.MaintenanceRecord{ID: d.ID, AssetID: d.AssetID, Type: d.Type, Date: d.Date, Notes: d.Notes, Cost: d.Cost, Technician: d.Technician, Vendor: d.Vendor, TxID: d.TxID, BlockNumber: d.BlockNumber})
	}
    // Write to ledger when gateway available (no longer gated by query param)
    if s.gw != nil {
        for i := range arr {
            m := &arr[i]
            costStr := strconv.FormatFloat(m.Cost, 'f', -1, 64)
            _, _, _, _ = s.gw.Submit(ctx, "UpdateMaintenance", []string{m.AssetID, m.Date, m.Type, m.Notes, costStr, m.Technician, ""})
        }
    }
	if err := s.assetRepo.InsertManyMaintenance(ctx, arr); err != nil {
		log.Error(ctx, "[USECASE] seed.SeedMaintenance - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] seed.SeedMaintenance - SUCCESS")
	s.notifyAdmins(ctx, "Import Maintenance", len(arr), "/assets")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) SeedDocuments(ctx context.Context, docs []DocumentItem) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedDocuments - START", "count", len(docs))

	arr := make([]entities.DocumentItem, 0, len(docs))
	for _, d := range docs {
		ent := entities.DocumentItem{ID: d.ID, AssetID: d.AssetID, FileName: d.FileName, Type: d.Type, IpfsCID: d.IpfsCID, HashSHA256: d.HashSHA256, UploadedBy: d.UploadedBy}
		if t, err := time.Parse(time.RFC3339, d.CreatedAt); err == nil {
			ent.CreatedAt = t
		}
		arr = append(arr, ent)
	}
	if err := s.assetRepo.InsertManyDocuments(ctx, arr); err != nil {
		log.Error(ctx, "[USECASE] seed.SeedDocuments - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] seed.SeedDocuments - SUCCESS")
	s.notifyAdmins(ctx, "Import Asset Documents", len(arr), "/assets")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) SeedApprovals(ctx context.Context, docs []ApprovalItem) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedApprovals - START", "count", len(docs))

	arr := make([]entities.ApprovalItem, 0, len(docs))
	for _, d := range docs {
		ent := entities.ApprovalItem{ID: d.ID, Type: d.Type, AssetID: d.AssetID, AssetName: d.AssetName, RequesterID: d.RequesterID, RequesterName: d.RequesterName, ToUnit: d.ToUnit, FromUnit: d.FromUnit, Reason: d.Reason, TransferType: d.TransferType, ToOwnerID: d.ToOwnerID, ToLocationID: d.ToLocationID, Status: d.Status, Notes: d.Notes}
		if t, err := time.Parse(time.RFC3339, d.CreatedAt); err == nil {
			ent.CreatedAt = t
		}
		arr = append(arr, ent)
	}
	if err := s.apprRepo.InsertMany(ctx, arr); err != nil {
		log.Error(ctx, "[USECASE] seed.SeedApprovals - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] seed.SeedApprovals - SUCCESS")
	s.notifyAdmins(ctx, "Import Approvals", len(arr), "/approvals")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) SeedNotifications(ctx context.Context, docs []Notification) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] seed.SeedNotifications - START", "count", len(docs))

	for _, d := range docs {
		ent := entities.Notification{ID: d.ID, UserID: d.UserID, Type: d.Type, Title: d.Title, Message: d.Message, Link: d.Link, Read: d.Read}
		if t, err := time.Parse(time.RFC3339, d.CreatedAt); err == nil {
			ent.CreatedAt = t
			ent.UpdatedAt = t
		}
		if err := s.notifRepo.Insert(ctx, ent); err != nil {
			log.Error(ctx, "[USECASE] seed.SeedNotifications - Repository error", err.Error())
			return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
		}
	}

	log.Info(ctx, "[USECASE] seed.SeedNotifications - SUCCESS")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

// notifyAdmins sends a system notification to admin-like roles summarizing import
func (s *service) notifyAdmins(ctx context.Context, what string, count int, link string) {
	if s.usersRepo == nil || s.notifRepo == nil {
		return
	}
	users, _, err := s.usersRepo.GetAllUser(ctx, entities.GetUsersReq{})
	if err != nil {
		return
	}
	title := "Import Selesai"
	message := what + " berhasil diimport (" + itoa(count) + ")"
	now := time.Now().UTC()
	for _, u := range users {
		role := u.UserType
		if role == "admin" || role == "admin_asset" || role == "head_unit" {
			id, _ := uuid.GenerateUUID()
			_ = s.notifRepo.Insert(ctx, entities.Notification{ID: id, UserID: u.ID.Hex(), Type: "system", Title: title, Message: message, Link: link, Read: false, CreatedAt: now, UpdatedAt: now})
		}
	}
}

func itoa(n int) string { return fmt.Sprintf("%d", n) }
