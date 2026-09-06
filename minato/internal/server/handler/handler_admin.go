package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/admin"
)

type adminHandler struct{ svc admin.Service }

func NewAdminHandler(s admin.Service) *adminHandler { return &adminHandler{svc: s} }

type confirmReq struct {
	Confirm string `json:"confirm" validate:"required"`
}

func (h *adminHandler) ResetAssets(c echo.Context) error {
	ctx := util.InjectProfile(c)
	var req confirmReq
	if err := c.Bind(&req); err != nil {
		return err
	}
	if err := c.Validate(&req); err != nil {
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}
	if req.Confirm != "asset-hub" {
		c.Set("invalid-format", true)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid confirm phrase")
	}
	res, err := h.svc.ResetAssets(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] admin.ResetAssets - Service error", err.Error())
	}
	return c.JSON(http.StatusOK, res)
}

func (h *adminHandler) ResetMeta(c echo.Context) error {
	ctx := util.InjectProfile(c)
	var req confirmReq
	if err := c.Bind(&req); err != nil {
		return err
	}
	if err := c.Validate(&req); err != nil {
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}
	if req.Confirm != "asset-hub" {
		c.Set("invalid-format", true)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid confirm phrase")
	}
	res, err := h.svc.ResetMeta(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] admin.ResetMeta - Service error", err.Error())
	}
	return c.JSON(http.StatusOK, res)
}
