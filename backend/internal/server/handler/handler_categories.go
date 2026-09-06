package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/categories"
)

type categoryHandler struct{ svc categories.Service }

func NewCategoryHandler(s categories.Service) *categoryHandler { return &categoryHandler{svc: s} }

func (h *categoryHandler) ListCategories(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] categories.ListCategories - START")

	res, err := h.svc.GetCategories(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] categories.ListCategories - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] categories.ListCategories - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *categoryHandler) ListLocations(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] categories.ListLocations - START")

	res, err := h.svc.GetLocations(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] categories.ListLocations - Service error", err.Error())
	}

	log.Info(ctx, "[HANDLER] categories.ListLocations - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
