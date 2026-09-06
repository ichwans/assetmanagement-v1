package assets

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sort"
	"strconv"
	"strings"
	"time"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	ipfscli "gitlab.com/riski/internal/infrastructure/ipfs"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/fabricgw"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	notifs "gitlab.com/riski/internal/usecase/notifications"
)

type service struct {
	repo  repositories.Asset
	notif notifs.Service
	users repositories.User
	gw    fabricgw.Client
	ipfs  ipfscli.Client
}

func NewService(repo repositories.Asset, notif notifs.Service, users repositories.User, gw fabricgw.Client, ipfs ipfscli.Client) Service {
	return &service{repo: repo, notif: notif, users: users, gw: gw, ipfs: ipfs}
}

func (s *service) List(ctx context.Context, q ListQuery) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.List - START", "search", q.Search, "status", q.Status, "category", q.Category, "page", q.Page, "limit", q.Limit)

	rows, err := s.repo.List(ctx)
	if err != nil {
		log.Error(ctx, "[USECASE] assets.List - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] assets.List - Fetched from repository", "total_rows", len(rows))

	// Filtering
	search := strings.ToLower(strings.TrimSpace(q.Search))
	status := strings.ToLower(strings.TrimSpace(q.Status))
	category := strings.ToLower(strings.TrimSpace(q.Category))
	location := strings.TrimSpace(q.Location)
	owner := strings.TrimSpace(q.Owner)

	filtered := make([]Asset, 0, len(rows))
	for _, r := range rows {
		a := fromEntity(r)
		if search != "" {
			if !strings.Contains(strings.ToLower(a.Name), search) && !strings.Contains(strings.ToLower(a.AssetID), search) && !strings.Contains(strings.ToLower(a.OwnerName), search) {
				continue
			}
		}
		if status != "" && strings.ToLower(a.Status) != status {
			continue
		}
		if category != "" && strings.ToLower(a.Category) != category {
			continue
		}
		if location != "" && a.Location != location {
			continue
		}
		if owner != "" && a.Owner != owner {
			continue
		}
		filtered = append(filtered, a)
	}

	log.Info(ctx, "[USECASE] assets.List - After filtering", "filtered_count", len(filtered))

	// Pagination
	lim := 10
	pg := 1
	if v, err := strconv.Atoi(strings.TrimSpace(q.Limit)); err == nil && v > 0 {
		lim = v
	}
	if v, err := strconv.Atoi(strings.TrimSpace(q.Page)); err == nil && v > 0 {
		pg = v
	}
	start := (pg - 1) * lim
	end := start + lim
	if start > len(filtered) {
		start = len(filtered)
	}
	if end > len(filtered) {
		end = len(filtered)
	}
	pageItems := filtered[start:end]

	log.Info(ctx, "[USECASE] assets.List - SUCCESS", "returned_count", len(pageItems))
	data := util.GetPaginationResponse(pageItems, uint(len(filtered)), util.PaginationParam{Page: uint(pg), Limit: uint(lim)})
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: data}, nil
}

func (s *service) GetByID(ctx context.Context, id string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.GetByID - START", "id", id)

	row, err := s.repo.GetByID(ctx, id)
	if err != nil {
		log.Error(ctx, "[USECASE] assets.GetByID - Repository error", err.Error())
	}
	if row == nil {
		log.Info(ctx, "[USECASE] assets.GetByID - Asset not found", "id", id)
		return constants.DefaultResponse{Status: constants.STATUS_NO_DATA, Message: constants.MESSAGE_DATA_NOT_FOUND, Data: struct{}{}}, nil
	}

	a := fromEntity(*row)
	log.Info(ctx, "[USECASE] assets.GetByID - SUCCESS", "asset_id", a.AssetID, "name", a.Name)
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: a}, nil
}

func (s *service) GetHistory(ctx context.Context, id string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.GetHistory - START", "id", id)

	rows, err := s.repo.GetHistory(ctx, id)
	if err != nil {
		log.Error(ctx, "[USECASE] assets.GetHistory - Repository error", err.Error())
	}
	out := make([]AssetHistoryEvent, 0, len(rows))
	for _, r := range rows {
		out = append(out, AssetHistoryEvent(r))
	}

	// Merge on-chain history if gateway available
	type timelineEvent struct {
		Kind    string          `json:"kind"`
		Key     string          `json:"key"`
		Date    string          `json:"date"`
		Payload json.RawMessage `json:"payload"`
	}
	if s.gw != nil {
		if b, err := s.gw.Evaluate(ctx, "GetAssetHistory", []string{id}); err == nil && len(b) > 0 {
			var evs []timelineEvent
			if err := json.Unmarshal(b, &evs); err == nil {
				for _, ev := range evs {
					// Map chaincode event to generic history entry; keep payload as details
					var details map[string]interface{}
					_ = json.Unmarshal(ev.Payload, &details)
					out = append(out, AssetHistoryEvent{
						ID:          "",
						AssetID:     id,
						EventType:   strings.ToLower(ev.Kind),
						Date:        ev.Date,
						Description: "ledger event",
						Details:     details,
						// TxID not exposed by TimelineEvent; left empty
					})
				}
			}
		} else if err != nil {
			log.Error(ctx, "[USECASE] assets.GetHistory - Fabric evaluate error", err.Error())
		}
	}

	// Sort by date desc if possible (RFC3339)
	sort.SliceStable(out, func(i, j int) bool { return out[i].Date > out[j].Date })

	log.Info(ctx, "[USECASE] assets.GetHistory - SUCCESS", "count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: out}, nil
}

func (s *service) GetMaintenance(ctx context.Context, id string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.GetMaintenance - START", "id", id)

	rows, err := s.repo.GetMaintenance(ctx, id)
	if err != nil {
		log.Error(ctx, "[USECASE] assets.GetMaintenance - Repository error", err.Error())
	}
	out := make([]MaintenanceRecord, 0, len(rows))
	for _, r := range rows {
		out = append(out, MaintenanceRecord(r))
	}

	log.Info(ctx, "[USECASE] assets.GetMaintenance - SUCCESS", "count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: out}, nil
}

func (s *service) GetDocuments(ctx context.Context, id string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.GetDocuments - START", "id", id)

	rows, err := s.repo.GetDocuments(ctx, id)
	if err != nil {
		log.Error(ctx, "[USECASE] assets.GetDocuments - Repository error", err.Error())
	}
	out := make([]DocumentItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, DocumentItem{ID: r.ID, AssetID: r.AssetID, FileName: r.FileName, Type: r.Type, IpfsCID: r.IpfsCID, HashSHA256: r.HashSHA256, UploadedBy: r.UploadedBy, CreatedAt: r.CreatedAt.Format("2006-01-02T15:04:05Z07:00")})
	}

	log.Info(ctx, "[USECASE] assets.GetDocuments - SUCCESS", "count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: out}, nil
}

func (s *service) UploadDocument(ctx context.Context, id string, doc DocumentItem) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.UploadDocument - START", "asset_id", id, "filename", doc.FileName)
	// If IPFS client available, validate CID content type and mirror to MFS
	if s.ipfs != nil && strings.TrimSpace(doc.IpfsCID) != "" {
		rc, _, berr, err := s.ipfs.Cat(doc.IpfsCID)
		if err != nil {
			log.Error(ctx, "[USECASE] assets.UploadDocument - IPFS cat error", string(berr))
			return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: "invalid ipfs cid", Data: struct{}{}}, nil
		}
		defer rc.Close()
		head := make([]byte, 512)
		n, _ := rc.Read(head)
		head = head[:n]
		mime := sniffMime(head)
		if !allowedForType(doc.Type, mime) {
			return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: "ipfs cid content type not allowed", Data: struct{}{}}, nil
		}
		// Mirror to MFS: /assets/<id>/<filename>
		mfsDir := "/assets/" + id
		_ = s.ipfs.FilesMkdir(mfsDir, true)
		dest := mfsDir + "/" + doc.FileName
		_ = s.ipfs.FilesRm(dest, true)
		_ = s.ipfs.FilesCp("/ipfs/"+doc.IpfsCID, dest)
	}
	ent := entities.DocumentItem{ID: doc.ID, AssetID: id, FileName: doc.FileName, Type: doc.Type, IpfsCID: doc.IpfsCID, HashSHA256: doc.HashSHA256, UploadedBy: doc.UploadedBy}
	if err := s.repo.InsertDocument(ctx, ent); err != nil {
		log.Error(ctx, "[USECASE] assets.UploadDocument - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] assets.UploadDocument - SUCCESS")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: doc}, nil
}

func (s *service) UploadAndRecordDocument(ctx context.Context, id, docType, fileName, uploadedBy string, data []byte) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.UploadAndRecordDocument - START", "asset_id", id, "filename", fileName)
	if len(data) == 0 {
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: struct{}{}}, nil
	}
	if len(data) > 5*1024*1024 {
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: "file too large (max 5MB)", Data: struct{}{}}, nil
	}
	head := data
	if len(head) > 512 {
		head = head[:512]
	}
	mime := sniffMime(head)
	if !allowedForType(docType, mime) {
		msg := "only valid PDF/JPG/PNG allowed"
		switch toLower(docType) {
		case "handover", "handover_borrow", "handover_return", "image":
			msg = "only valid JPG/PNG allowed for this document type"
		case "maintenance_receipt", "invoice":
			msg = "only valid PDF/JPG/PNG allowed for this document type"
		}
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: msg, Data: struct{}{}}, nil
	}
	if s.ipfs == nil {
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	cid, _, err := s.ipfs.Add(fileName, data, true)
	if err != nil || strings.TrimSpace(cid) == "" {
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: "ipfs upload failed", Data: struct{}{}}, nil
	}
	// MFS mirror
	mfsDir := "/assets/" + id
	_ = s.ipfs.FilesMkdir(mfsDir, true)
	dest := mfsDir + "/" + fileName
	_ = s.ipfs.FilesRm(dest, true)
	_ = s.ipfs.FilesCp("/ipfs/"+cid, dest)
	// sha256
	hasher := sha256.New()
	hasher.Write(data)
	sum := hex.EncodeToString(hasher.Sum(nil))
	// Save record
	doc := DocumentItem{FileName: fileName, Type: docType, IpfsCID: cid, HashSHA256: sum, UploadedBy: uploadedBy}
	return s.UploadDocument(ctx, id, doc)
}

func (s *service) UpdateStatus(ctx context.Context, id string, status string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.UpdateStatus - START", "id", id, "status", status)

	if err := s.repo.UpdateStatus(ctx, id, status); err != nil {
		log.Error(ctx, "[USECASE] assets.UpdateStatus - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] assets.UpdateStatus - SUCCESS")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func fromEntity(e entities.Asset) Asset {
	return Asset{
		AssetID: e.AssetID, Name: e.Name, Category: e.Category, Description: e.Description, SerialNumber: e.SerialNumber,
		Owner: e.Owner, OwnerName: e.OwnerName, Location: e.Location, LocationDetail: e.LocationDetail, Status: e.Status,
		AcquisitionDate: e.AcquisitionDate, AcquisitionPrice: e.AcquisitionPrice, Vendor: e.Vendor, InvoiceNumber: e.InvoiceNumber,
		TxID: e.TxID, BlockNumber: e.BlockNumber, CreatedAt: e.CreatedAt.Format("2006-01-02T15:04:05Z07:00"), UpdatedAt: e.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func (s *service) Create(ctx context.Context, req CreateAssetReq) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.Create - START", "name", req.Name, "category", req.Category, "location", req.Location)

	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Category) == "" || strings.TrimSpace(req.Location) == "" || strings.TrimSpace(req.Owner) == "" || strings.TrimSpace(req.AcquisitionDate) == "" {
		log.Info(ctx, "[USECASE] assets.Create - Validation failed", "name_empty", strings.TrimSpace(req.Name) == "", "category_empty", strings.TrimSpace(req.Category) == "")
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: struct{}{}}, nil
	}

	assetID := generateAssetID()
	log.Info(ctx, "[USECASE] assets.Create - Generated asset ID", "asset_id", assetID)

	a := entities.Asset{
		AssetID:          assetID,
		Name:             req.Name,
		Category:         strings.ToLower(req.Category),
		Description:      req.Description,
		SerialNumber:     req.SerialNumber,
		Owner:            req.Owner,
		OwnerName:        "",
		Location:         req.Location,
		LocationDetail:   "",
		Status:           "active",
		AcquisitionDate:  req.AcquisitionDate,
		AcquisitionPrice: req.AcquisitionPrice,
		Vendor:           req.Vendor,
		InvoiceNumber:    req.InvoiceNumber,
	}
	a.CreatedAt = time.Now().UTC()
	a.UpdatedAt = time.Now().UTC()

	log.Info(ctx, "[USECASE] assets.Create - Inserting to repository")
	if err := s.repo.InsertAsset(ctx, a); err != nil {
		log.Error(ctx, "[USECASE] assets.Create - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] assets.Create - SUCCESS (DB)", "asset_id", assetID)
	// Submit to ledger: CreateAsset
	var respErrors []constants.DefaultResponseError
	if s.gw != nil {
		txId, committed, _, err := s.gw.Submit(ctx, "CreateAsset", []string{assetID, a.Category, a.Owner, a.Location})
		if err != nil || !committed {
			msg := "Blockchain transaction failed"
			if err != nil {
				msg = msg + ": " + err.Error()
			}
			respErrors = append(respErrors, constants.DefaultResponseError{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: msg})
		} else {
			_ = s.repo.UpdateTx(ctx, assetID, txId)
			_ = s.repo.InsertManyHistory(ctx, []entities.AssetHistoryEvent{{
				ID: generateMaintenanceID(), AssetID: a.AssetID, EventType: "create", Date: time.Now().UTC().Format(time.RFC3339), Description: "Asset created (ledger)", Details: map[string]interface{}{"category": a.Category}, TxID: txId,
			}})
		}
	}
	// Notify admin_asset and owner
	s.notifyByRole(ctx, []string{"admin_asset", "admin"}, "asset", "Asset Baru", "Asset berhasil dibuat", "/assets/"+assetID)
	if a.Owner != "" {
		_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{UserID: a.Owner, Type: "asset", Title: "Asset Ditambahkan", Message: a.Name + " telah didaftarkan", Link: "/assets/" + assetID})
	}
	res := constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: fromEntity(a)}
	if len(respErrors) > 0 {
		res.Errors = respErrors
		res.Message = "Success with warnings"
	}
	return res, nil
}

func (s *service) AddMaintenance(ctx context.Context, id string, req CreateMaintenanceReq) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.AddMaintenance - START", "asset_id", id, "type", req.Type, "date", req.Date)

	if strings.TrimSpace(id) == "" || strings.TrimSpace(req.Type) == "" || strings.TrimSpace(req.Date) == "" || strings.TrimSpace(req.Notes) == "" {
		log.Info(ctx, "[USECASE] assets.AddMaintenance - Validation failed")
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: struct{}{}}, nil
	}

	maintenanceID := generateMaintenanceID()
	log.Info(ctx, "[USECASE] assets.AddMaintenance - Generated maintenance ID", "maintenance_id", maintenanceID)

	m := entities.MaintenanceRecord{ID: maintenanceID, AssetID: id, Type: req.Type, Date: req.Date, Notes: req.Notes, Cost: req.Cost, Technician: req.Technician, Vendor: req.Vendor}

	// Submit to ledger first to get txId
	var respErrors []constants.DefaultResponseError
	if s.gw != nil {
		costStr := strconv.FormatFloat(req.Cost, 'f', -1, 64)
		docCID := ""
		if s.repo != nil { // look for latest maintenance_receipt
			if docs, err := s.repo.GetDocuments(ctx, id); err == nil {
				var latest time.Time
				for _, d := range docs {
					if d.Type == "maintenance_receipt" {
						if d.CreatedAt.After(latest) {
							latest = d.CreatedAt
							docCID = d.IpfsCID
						}
					}
				}
			}
		}
		txId, committed, _, err := s.gw.Submit(ctx, "UpdateMaintenance", []string{id, req.Date, req.Type, req.Notes, costStr, req.Technician, docCID})
		if err != nil || !committed {
			msg := "Blockchain transaction failed"
			if err != nil {
				msg = msg + ": " + err.Error()
			}
			respErrors = append(respErrors, constants.DefaultResponseError{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: msg})
		} else {
			m.TxID = txId
		}
	}

	log.Info(ctx, "[USECASE] assets.AddMaintenance - Inserting to repository")
	if err := s.repo.InsertMaintenance(ctx, m); err != nil {
		log.Error(ctx, "[USECASE] assets.AddMaintenance - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] assets.AddMaintenance - SUCCESS")
	// Notify owner and admins about maintenance log
	if asset, _ := s.repo.GetByID(ctx, id); asset != nil {
		if asset.Owner != "" {
			_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{UserID: asset.Owner, Type: "maintenance", Title: "Log Maintenance Ditambahkan", Message: "Maintenance untuk " + asset.Name, Link: "/assets/" + id + "/maintenance"})
		}
		s.notifyByRole(ctx, []string{"admin_asset", "admin"}, "maintenance", "Maintenance Ditambahkan", "Maintenance untuk "+asset.Name, "/assets/"+id+"/maintenance")
	}
	// Update asset status to maintenance
	if err := s.repo.UpdateStatus(ctx, id, "maintenance"); err != nil {
		log.Error(ctx, "[USECASE] assets.AddMaintenance - Failed to update status", err.Error())
	} else {
		log.Info(ctx, "[USECASE] assets.AddMaintenance - Asset status updated to maintenance")
	}
	// Add history event: maintenance
	_ = s.repo.InsertManyHistory(ctx, []entities.AssetHistoryEvent{{
		ID:          generateMaintenanceID(),
		AssetID:     id,
		EventType:   "maintenance",
		Date:        m.Date,
		Description: m.Notes,
		Details:     map[string]interface{}{"type": m.Type, "cost": m.Cost, "technician": m.Technician, "vendor": m.Vendor},
		TxID:        m.TxID,
	}})
	res := constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: m}
	if len(respErrors) > 0 {
		res.Errors = respErrors
		res.Message = "Success with warnings"
	}
	return res, nil
}

func (s *service) CompleteMaintenance(ctx context.Context, id string, date string, note string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] assets.CompleteMaintenance - START", "asset_id", id, "date", date)
	if strings.TrimSpace(id) == "" {
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: struct{}{}}, nil
	}
	var respErrors []constants.DefaultResponseError
	txId := ""
	if s.gw != nil {
		t := date
		if strings.TrimSpace(t) == "" {
			t = time.Now().UTC().Format(time.RFC3339)
		}
		// Use UpdateMaintenance with type=complete
		tx, committed, _, err := s.gw.Submit(ctx, "UpdateMaintenance", []string{id, t, "complete", note, "0", "", ""})
		if err != nil || !committed {
			msg := "Blockchain transaction failed"
			if err != nil {
				msg = msg + ": " + err.Error()
			}
			respErrors = append(respErrors, constants.DefaultResponseError{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: msg})
		} else {
			txId = tx
		}
	}
	// Update status to active in DB
	if err := s.repo.UpdateStatus(ctx, id, "active"); err != nil {
		log.Error(ctx, "[USECASE] assets.CompleteMaintenance - UpdateStatus error", err.Error())
	}
	// Add history event
	_ = s.repo.InsertManyHistory(ctx, []entities.AssetHistoryEvent{{
		ID: generateMaintenanceID(), AssetID: id, EventType: "maintenance_complete", Date: time.Now().UTC().Format(time.RFC3339), Description: note, Details: map[string]interface{}{}, TxID: txId,
	}})
	res := constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: map[string]string{"txId": txId}}
	if len(respErrors) > 0 {
		res.Errors = respErrors
		res.Message = "Success with warnings"
	}
	log.Info(ctx, "[USECASE] assets.CompleteMaintenance - SUCCESS")
	return res, nil
}

func (s *service) notifyByRole(ctx context.Context, roles []string, ntype, title, message, link string) {
	if s.users == nil || s.notif == nil {
		return
	}
	docs, _, err := s.users.GetAllUser(ctx, entities.GetUsersReq{})
	if err != nil {
		return
	}
	for _, u := range docs {
		for _, r := range roles {
			if strings.EqualFold(u.UserType, r) {
				_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{UserID: u.ID.Hex(), Type: ntype, Title: title, Message: message, Link: link})
				break
			}
		}
	}
}

func generateAssetID() string       { return "AST-" + strconv.FormatInt(time.Now().Unix()%100000, 10) }
func generateMaintenanceID() string { return "MNT-" + strconv.FormatInt(time.Now().Unix()%100000, 10) }
