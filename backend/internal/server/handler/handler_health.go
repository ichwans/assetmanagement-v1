package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
)

type healthHandler struct{}

func NewHealthHandler() *healthHandler { return &healthHandler{} }

func (h *healthHandler) Health(c echo.Context) error {
	ctx := c.Request().Context()
	log.Info(ctx, "[HANDLER] health.Health - START")
	res := constants.DefaultResponse{
		Status:  constants.STATUS_SUCCESS,
		Message: constants.MESSAGE_SUCCESS,
		Data: map[string]any{
			"status": "ok",
			"time":   time.Now().UTC().Format(time.RFC3339),
		},
		Errors: []constants.DefaultResponseError{},
	}
	log.Info(ctx, "[HANDLER] health.Health - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
