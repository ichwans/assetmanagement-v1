package handler

import (
	"net/http"
	"net/url"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/pkg/utils"
	"gitlab.com/riski/internal/usecase/user"
)

type userHandler struct {
	usersvc user.Service
}

func NewUserHandler(
	usersvc user.Service,
) *userHandler {
	return &userHandler{
		usersvc: usersvc,
	}
}

func (h *userHandler) GetAllUser(c echo.Context) (err error) {
	ctx := utils.InjectProfile(c)
	log.Info(ctx, "[HANDLER] user.GetAllUser - START")

	var req user.GetUsersReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.GetAllUser - Bind error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] user.GetAllUser - Fetching users", "page", req.Page, "limit", req.Limit)
	res, err := h.usersvc.GetAllUser(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] user.GetAllUser - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] user.GetAllUser - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *userHandler) GetUserDetail(c echo.Context) (err error) {
	ctx := utils.InjectProfile(c)
	log.Info(ctx, "[HANDLER] user.GetUserDetail - START", "id", c.Param("id"))

	var req user.GetUserDetailReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.GetUserDetail - Bind error", err.Error())
		return
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.GetUserDetail - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	res, err := h.usersvc.GetUserDetail(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] user.GetUserDetail - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] user.GetUserDetail - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *userHandler) ChangeStatus(c echo.Context) (err error) {
	ctx := utils.InjectProfile(c)
	log.Info(ctx, "[HANDLER] user.ChangeStatus - START", "id", c.Param("id"))

	// Bind JSON body first
	var req user.ChangeStatusReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.ChangeStatus - Bind error", err.Error())
		return
	}
	// Override ID from path param
	// Unescape percent-encoded path (emails contain @ encoded as %40)
	if raw := c.Param("id"); raw != "" {
		if decoded, decErr := url.PathUnescape(raw); decErr == nil {
			req.Id = decoded
		} else {
			req.Id = raw
		}
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.ChangeStatus - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] user.ChangeStatus - Processing", "user_id", req.Id, "status", req.Status)
	res, err := h.usersvc.ChangeStatus(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] user.ChangeStatus - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] user.ChangeStatus - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *userHandler) Create(c echo.Context) (err error) {
	ctx := utils.InjectProfile(c)
	log.Info(ctx, "[HANDLER] user.Create - START")

	var req user.CreateUserReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.Create - Bind error", err.Error())
		return
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.Create - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] user.Create - Creating user", "email", req.Email, "user_type", req.UserType)
	res, err := h.usersvc.CreateUser(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] user.Create - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] user.Create - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

func (h *userHandler) Update(c echo.Context) (err error) {
	ctx := utils.InjectProfile(c)
	log.Info(ctx, "[HANDLER] user.Update - START", "id", c.Param("id"))

	var req user.UpdateUserReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.Update - Bind error", err.Error())
		return
	}
	if raw := c.Param("id"); raw != "" {
		if decoded, decErr := url.PathUnescape(raw); decErr == nil {
			req.Id = decoded
		} else {
			req.Id = raw
		}
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.Update - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	log.Info(ctx, "[HANDLER] user.Update - Updating user", "user_id", req.Id)
	res, err := h.usersvc.UpdateUser(ctx, req)
	if err != nil {
		log.Error(ctx, "[HANDLER] user.Update - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] user.Update - SUCCESS")
	return c.JSON(http.StatusOK, res)
}

type changePasswordReq struct {
	CurrentPassword string `json:"currentPassword" validate:"required,min=6"`
	NewPassword     string `json:"newPassword" validate:"required,min=8"`
}

func (h *userHandler) ChangeMyPassword(c echo.Context) (err error) {
	ctx := utils.InjectProfile(c)
	log.Info(ctx, "[HANDLER] user.ChangeMyPassword - START")

	var req changePasswordReq
	if err = c.Bind(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.ChangeMyPassword - Bind error", err.Error())
		return
	}
	if err = c.Validate(&req); err != nil {
		log.Error(ctx, "[HANDLER] user.ChangeMyPassword - Validation error", err.Error())
		c.Set("req", req)
		c.Set("invalid-format", true)
		return err
	}

	res, err := h.usersvc.ChangeMyPassword(ctx, user.ChangePasswordReq{CurrentPassword: req.CurrentPassword, NewPassword: req.NewPassword})
	if err != nil {
		log.Error(ctx, "[HANDLER] user.ChangeMyPassword - Service error", err.Error())
		return
	}

	log.Info(ctx, "[HANDLER] user.ChangeMyPassword - SUCCESS")
	return c.JSON(http.StatusOK, res)
}
