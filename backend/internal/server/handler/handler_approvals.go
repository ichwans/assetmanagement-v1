package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/approvals"
	"time"
)

type approvalHandler struct{ svc approvals.Service }

func NewApprovalHandler(s approvals.Service) *approvalHandler { return &approvalHandler{svc: s} }

func (h *approvalHandler) List(c echo.Context) error {
	ctx := util.InjectProfile(c)
	status := c.QueryParam("status")
	log.Info(ctx, "[HANDLER] approvals.List - START", "status", status)

	res, err := h.svc.List(ctx, status)
	if err != nil {
		log.Error(ctx, "[HANDLER] approvals.List - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] approvals.List - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *approvalHandler) Detail(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] approvals.Detail - START", "id", id)

	res, err := h.svc.GetByID(ctx, id)
	if err != nil {
		log.Error(ctx, "[HANDLER] approvals.Detail - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] approvals.Detail - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type decideReq struct {
	Decision string `json:"decision" validate:"required,oneof=APPROVE REJECT"`
	Note     string `json:"note"`
}

func (h *approvalHandler) Decide(c echo.Context) error {
	ctx := util.InjectProfile(c)
	id := c.Param("id")
	log.Info(ctx, "[HANDLER] approvals.Decide - START", "id", id)

	var req decideReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] approvals.Decide - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] approvals.Decide - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] approvals.Decide - Processing", "decision", req.Decision)
	res, err := h.svc.Decide(ctx, id, req.Decision, req.Note)
	if err != nil {
		log.Error(ctx, "[HANDLER] approvals.Decide - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] approvals.Decide - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type createTransferReq struct {
	AssetID       string `json:"assetId" validate:"required"`
	AssetName     string `json:"assetName" validate:"required"`
	RequesterName string `json:"requesterName" validate:"required"`
	ToOwnerID     string `json:"toOwnerId"`
	ToLocationID  string `json:"toLocationId"`
	TransferType  string `json:"transferType" validate:"required,oneof=borrow permanent"`
	Notes         string `json:"notes"`
}

func (h *approvalHandler) CreateTransfer(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] approvals.CreateTransfer - START")

	var req createTransferReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] approvals.CreateTransfer - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] approvals.CreateTransfer - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] approvals.CreateTransfer - Creating", "asset_id", req.AssetID, "transfer_type", req.TransferType)
	in := approvals.ApprovalItem{AssetID: req.AssetID, AssetName: req.AssetName, RequesterName: req.RequesterName, TransferType: req.TransferType, ToOwnerID: req.ToOwnerID, ToLocationID: req.ToLocationID}
	if req.Notes != "" {
		in.Notes = []string{time.Now().UTC().Format(time.RFC3339) + " " + req.Notes}
	}
	res, err := h.svc.CreateTransfer(ctx, in)
	if err != nil {
		log.Error(ctx, "[HANDLER] approvals.CreateTransfer - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] approvals.CreateTransfer - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type createDisposeReq struct {
	AssetID       string `json:"assetId" validate:"required"`
	AssetName     string `json:"assetName" validate:"required"`
	RequesterName string `json:"requesterName" validate:"required"`
	Reason        string `json:"reason" validate:"required"`
}

func (h *approvalHandler) CreateDispose(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] approvals.CreateDispose - START")

	var req createDisposeReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] approvals.CreateDispose - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] approvals.CreateDispose - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] approvals.CreateDispose - Creating", "asset_id", req.AssetID, "reason", req.Reason)
	in := approvals.ApprovalItem{AssetID: req.AssetID, AssetName: req.AssetName, RequesterName: req.RequesterName, Reason: req.Reason}
	res, err := h.svc.CreateDispose(ctx, in)
	if err != nil {
		log.Error(ctx, "[HANDLER] approvals.CreateDispose - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] approvals.CreateDispose - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
