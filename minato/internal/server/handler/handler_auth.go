package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/auth"
)

type authHandler struct {
	svc auth.Service
}

func NewAuthHandler(authService auth.Service) *authHandler {
	return &authHandler{svc: authService}
}

func (h *authHandler) Login(c echo.Context) (err error) {
	ctx := c.Request().Context()
	log.Info(ctx, "[HANDLER] auth.Login - START")

	var req auth.LoginReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] auth.Login - Bind error", err.Error())
		return
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] auth.Login - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] auth.Login - Processing login", "email", req.Email)
	res, err := h.svc.Login(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] auth.Login - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] auth.Login - SUCCESS", "status", res.Status)
	return c.JSON(http.StatusOK, res)
}

func (h *authHandler) Me(c echo.Context) (err error) {
	ctx := utils.InjectProfile(c)
	log.Info(ctx, "[HANDLER] auth.Me - START")

	res, err := h.svc.Me(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] auth.Me - Service error", err.Error())
	}
	if res.Status != constants.STATUS_SUCCESS {
		log.Info(ctx, "[HANDLER] auth.Me - No user found, returning empty")
		res = constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: map[string]interface{}{"email": ""}}
	}

	log.Info(ctx, "[HANDLER] auth.Me - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *authHandler) ForgotPassword(c echo.Context) (err error) {
	ctx := c.Request().Context()
	log.Info(ctx, "[HANDLER] auth.ForgotPassword - START")

	var req auth.ForgotPasswordReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] auth.ForgotPassword - Bind error", err.Error())
		return
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] auth.ForgotPassword - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	res, err := h.svc.ForgotPassword(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] auth.ForgotPassword - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] auth.ForgotPassword - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *authHandler) ResetPassword(c echo.Context) (err error) {
	ctx := c.Request().Context()
	log.Info(ctx, "[HANDLER] auth.ResetPassword - START")

	var req auth.ResetPasswordReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] auth.ResetPassword - Bind error", err.Error())
		return
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] auth.ResetPassword - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	res, err := h.svc.ResetPassword(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] auth.ResetPassword - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] auth.ResetPassword - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
