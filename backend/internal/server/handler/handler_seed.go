package handler

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/seed"
)

type seedHandler struct{ svc seed.Service }

func NewSeedHandler(s seed.Service) *seedHandler { return &seedHandler{svc: s} }

func (h *seedHandler) Categories(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.Categories - START")

	var docs []seed.Category
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.Categories - Bind error", err.Error())
		return err
	}

	log.Info(ctx, "[HANDLER] seed.Categories - Seeding", "count", len(docs))
	res, err := h.svc.SeedCategories(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.Categories - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.Categories - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *seedHandler) Locations(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.Locations - START")

	var docs []seed.Location
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.Locations - Bind error", err.Error())
		return err
	}

	log.Info(ctx, "[HANDLER] seed.Locations - Seeding", "count", len(docs))
	res, err := h.svc.SeedLocations(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.Locations - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.Locations - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *seedHandler) Assets(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.Assets - START")

	var docs []seed.Asset
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.Assets - Bind error", err.Error())
		return err
	}

	if c.QueryParam("ledger") == "true" || c.QueryParam("ledger") == "1" {
		ctx = context.WithValue(ctx, "seed_ledger", true)
	}
	log.Info(ctx, "[HANDLER] seed.Assets - Seeding", "count", len(docs))
	res, err := h.svc.SeedAssets(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.Assets - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.Assets - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *seedHandler) AssetHistory(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.AssetHistory - START")

	var docs []seed.AssetHistoryEvent
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.AssetHistory - Bind error", err.Error())
		return err
	}

	log.Info(ctx, "[HANDLER] seed.AssetHistory - Seeding", "count", len(docs))
	res, err := h.svc.SeedAssetHistory(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.AssetHistory - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.AssetHistory - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *seedHandler) Maintenance(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.Maintenance - START")

	var docs []seed.MaintenanceRecord
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.Maintenance - Bind error", err.Error())
		return err
	}

	if c.QueryParam("ledger") == "true" || c.QueryParam("ledger") == "1" {
		ctx = context.WithValue(ctx, "seed_ledger", true)
	}
	log.Info(ctx, "[HANDLER] seed.Maintenance - Seeding", "count", len(docs))
	res, err := h.svc.SeedMaintenance(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.Maintenance - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.Maintenance - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *seedHandler) Documents(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.Documents - START")

	var docs []seed.DocumentItem
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.Documents - Bind error", err.Error())
		return err
	}

	log.Info(ctx, "[HANDLER] seed.Documents - Seeding", "count", len(docs))
	res, err := h.svc.SeedDocuments(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.Documents - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.Documents - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *seedHandler) Approvals(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.Approvals - START")

	var docs []seed.ApprovalItem
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.Approvals - Bind error", err.Error())
		return err
	}

	log.Info(ctx, "[HANDLER] seed.Approvals - Seeding", "count", len(docs))
	res, err := h.svc.SeedApprovals(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.Approvals - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.Approvals - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *seedHandler) Notifications(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] seed.Notifications - START")

	var docs []seed.Notification
	if err := c.Bind(&docs); err != nil {
		log.Error(ctx, "[HANDLER] seed.Notifications - Bind error", err.Error())
		return err
	}

	log.Info(ctx, "[HANDLER] seed.Notifications - Seeding", "count", len(docs))
	res, err := h.svc.SeedNotifications(ctx, docs)
	if err != nil {
		log.Error(ctx, "[HANDLER] seed.Notifications - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] seed.Notifications - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
