package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/notifications"
)

type notificationHandler struct{ svc notifications.Service }

func NewNotificationHandler(s notifications.Service) *notificationHandler {
	return &notificationHandler{svc: s}
}

func (h *notificationHandler) List(c echo.Context) error {
	ctx := util.InjectProfile(c)
	prof := util.GetProfile(ctx)
	q := notifications.ListQuery{
		Type:  c.QueryParam("type"),
		Read:  c.QueryParam("read"),
		Limit: c.QueryParam("limit"),
		Page:  c.QueryParam("page"),
	}
	// Enforce current user
	q.UserID = prof.ID
	log.Info(ctx, "[HANDLER] notifications.List - START", "userId", q.UserID)

	res, err := h.svc.List(ctx, q)
	if err != nil {
		log.Error(ctx, "[HANDLER] notifications.List - Service error", err.Error())
	}
	log.Info(ctx, "[HANDLER] notifications.List - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type markReadReq struct {
	IDs []string `json:"ids" validate:"required"`
}

func (h *notificationHandler) MarkRead(c echo.Context) error {
	ctx := util.InjectProfile(c)
	prof := util.GetProfile(ctx)
	var req markReadReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] notifications.MarkRead - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] notifications.MarkRead - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}
	res, err := h.svc.MarkRead(ctx, prof.ID, req.IDs)
	if err != nil {
		log.Error(ctx, "[HANDLER] notifications.MarkRead - Service error", err.Error())
	}
	return c.JSON(http.StatusOK, res)
}

func (h *notificationHandler) MarkAllRead(c echo.Context) error {
	ctx := util.InjectProfile(c)
	prof := util.GetProfile(ctx)
	res, err := h.svc.MarkAllRead(ctx, prof.ID)
	if err != nil {
		log.Error(ctx, "[HANDLER] notifications.MarkAllRead - Service error", err.Error())
	}
	return c.JSON(http.StatusOK, res)
}

func (h *notificationHandler) Create(c echo.Context) error {
	ctx := util.InjectProfile(c)
	var req notifications.CreateNotificationReq
	if err := c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] notifications.Create - Bind error", err.Error())
		return err
	}
	if err := c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] notifications.Create - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}
	res, err := h.svc.Create(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] notifications.Create - Service error", err.Error())
	}
	return c.JSON(http.StatusOK, res)
}
