package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/dashboard"
)

type dashboardHandler struct{ svc dashboard.Service }

func NewDashboardHandler(svc dashboard.Service) *dashboardHandler { return &dashboardHandler{svc: svc} }

func (h *dashboardHandler) Stats(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] dashboard.Stats - START")

	res, err := h.svc.Stats(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] dashboard.Stats - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] dashboard.Stats - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *dashboardHandler) AssetsByCategory(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] dashboard.AssetsByCategory - START")

	res, err := h.svc.AssetsByCategory(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] dashboard.AssetsByCategory - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] dashboard.AssetsByCategory - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *dashboardHandler) Recent(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] dashboard.Recent - START")

	limit := 10
	if q := c.QueryParam("limit"); q != "" {
		if v, err := strconv.Atoi(q); err == nil {
			limit = v
		}
	}

	log.Info(ctx, "[HANDLER] dashboard.Recent - Fetching", "limit", limit)
	res, err := h.svc.RecentActivity(ctx, limit)
	if err != nil {
		log.Error(ctx, "[HANDLER] dashboard.Recent - Service error", err.Error())
	}
	if res.Status == "" {
		res = constants.DefaultResponse{Status: constants.STATUS_UNKNOWN_ERROR, Message: constants.MESSAGE_UNKNOWN_ERROR, Data: struct{}{}}
	}

	log.Info(ctx, "[HANDLER] dashboard.Recent - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
