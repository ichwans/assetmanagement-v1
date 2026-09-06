package handler

import (
	"bytes"
	"io"
	"net/http"

	"github.com/labstack/echo/v4"

	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/assets"
)

type assetHandler struct{ svc assets.Service }

func NewAssetHandler(s assets.Service) *assetHandler { return &assetHandler{svc: s} }

func (h *assetHandler) List(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] assets.List - START")

	var q assets.ListQuery
	if err := c.Bind(&q); err != nil {
		log.Error(ctx, "[HANDLER] assets.List - Bind error", err.Error())
		return err
	}

	log.Info(ctx, "[HANDLER] assets.List - Fetching assets", "page", q.Page, "limit", q.Limit, "search", q.Search, "category", q.Category)
	res, err := h.svc.List(ctx, q)
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.List - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.List - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *assetHandler) Detail(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.Detail - START", "id", id)

	res, err := h.svc.GetByID(ctx, id)
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.Detail - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.Detail - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *assetHandler) History(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.History - START", "id", id)

	res, err := h.svc.GetHistory(ctx, id)
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.History - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.History - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *assetHandler) Maintenance(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.Maintenance - START", "id", id)

	res, err := h.svc.GetMaintenance(ctx, id)
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.Maintenance - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.Maintenance - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type uploadDocReq struct {
	FileName   string `json:"fileName" validate:"required"`
	Type       string `json:"type" validate:"required"`
	IpfsCID    string `json:"ipfsCid" validate:"required"`
	HashSHA256 string `json:"hashSha256" validate:"required"`
}

func (h *assetHandler) GetDocuments(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.GetDocuments - START", "id", id)

	res, err := h.svc.GetDocuments(ctx, id)
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.GetDocuments - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.GetDocuments - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *assetHandler) UploadDocument(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.UploadDocument - START", "id", id)

	var req uploadDocReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.UploadDocument - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.UploadDocument - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] assets.UploadDocument - Uploading", "filename", req.FileName, "type", req.Type)
	res, err := h.svc.UploadDocument(ctx, id, assets.DocumentItem{FileName: req.FileName, Type: req.Type, IpfsCID: req.IpfsCID, HashSHA256: req.HashSHA256, UploadedBy: "system"})
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.UploadDocument - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.UploadDocument - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

// UploadDocumentFile: multipart upload to local storage + record document
func (h *assetHandler) UploadDocumentFile(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.UploadDocumentFile - START", "id", id)

	fh, err := c.FormFile("file")
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.UploadDocumentFile - Missing file", err)
		return echo.NewHTTPError(http.StatusBadRequest, "file is required")
	}
	docType := c.FormValue("type")
	if docType == "" {
		docType = "image"
	}

	src, err := fh.Open()
	if err != nil {
		log.Error(ctx, "open file", err)
		return err
	}
	defer src.Close()

	// Read file into buffer
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, src); err != nil {
		log.Error(ctx, "read file", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "read error")
	}
	uploader := util.GetProfile(ctx).Email
	if uploader == "" {
		uploader = "system"
	}
	// Delegate to usecase: upload to IPFS, mirror to MFS, and record document
	res, err := h.svc.UploadAndRecordDocument(ctx, id, docType, fh.Filename, uploader, buf.Bytes())
	if err != nil {
		log.Error(ctx, "record doc", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "record error")
	}
	log.Info(ctx, "[HANDLER] assets.UploadDocumentFile - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type changeStatusReq struct {
	Status string `json:"status" validate:"required,oneof=active borrowed maintenance disposed transfer_pending"`
}

func (h *assetHandler) ChangeStatus(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.ChangeStatus - START", "id", id)

	var req changeStatusReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.ChangeStatus - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.ChangeStatus - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	res, err := h.svc.UpdateStatus(ctx, id, req.Status)
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.ChangeStatus - Service error", err.Error())
	}
	log.Info(ctx, "[HANDLER] assets.ChangeStatus - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type createAssetReq struct {
	Name             string  `json:"name" validate:"required"`
	Category         string  `json:"category" validate:"required"`
	Description      string  `json:"description"`
	SerialNumber     string  `json:"serialNumber"`
	AcquisitionDate  string  `json:"acquisitionDate" validate:"required"`
	AcquisitionPrice float64 `json:"acquisitionPrice" validate:"required"`
	Vendor           string  `json:"vendor"`
	InvoiceNumber    string  `json:"invoiceNumber"`
	Location         string  `json:"location" validate:"required"`
	Owner            string  `json:"owner" validate:"required"`
}

func (h *assetHandler) Create(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] assets.Create - START")

	var req createAssetReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.Create - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.Create - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] assets.Create - Creating asset", "name", req.Name, "category", req.Category, "location", req.Location)
	res, err := h.svc.Create(ctx, assets.CreateAssetReq(req))
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.Create - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.Create - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type createMaintReq struct {
	Type       string  `json:"type" validate:"required,oneof=routine repair upgrade calibration"`
	Date       string  `json:"date" validate:"required"`
	Notes      string  `json:"notes" validate:"required"`
	Cost       float64 `json:"cost" validate:"required"`
	Technician string  `json:"technician"`
	Vendor     string  `json:"vendor"`
}

func (h *assetHandler) CreateMaintenance(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.CreateMaintenance - START", "id", id)

	var req createMaintReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.CreateMaintenance - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] assets.CreateMaintenance - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] assets.CreateMaintenance - Creating maintenance", "type", req.Type, "date", req.Date)
	res, err := h.svc.AddMaintenance(ctx, id, assets.CreateMaintenanceReq{Type: req.Type, Date: req.Date, Notes: req.Notes, Cost: req.Cost, Technician: req.Technician, Vendor: req.Vendor})
	if err != nil {
		log.Error(ctx, "[HANDLER] assets.CreateMaintenance - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] assets.CreateMaintenance - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type completeMaintReq struct {
	Date  string `json:"date"`
	Notes string `json:"notes"`
}

func (h *assetHandler) CompleteMaintenance(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] assets.CompleteMaintenance - START", "id", id)
	var req completeMaintReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "bind", err)
		return err
	}
	res, err := h.svc.CompleteMaintenance(ctx, id, req.Date, req.Notes)
	if err != nil {
		log.Error(ctx, "service", err)
	}
	log.Info(ctx, "[HANDLER] assets.CompleteMaintenance - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
