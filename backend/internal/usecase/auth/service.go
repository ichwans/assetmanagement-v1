package auth

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	Login(ctx context.Context, req LoginReq) (res constants.DefaultResponse, err error)
	Me(ctx context.Context) (res constants.DefaultResponse, err error)

	// password reset flow
	ForgotPassword(ctx context.Context, req ForgotPasswordReq) (res constants.DefaultResponse, err error)
	ResetPassword(ctx context.Context, req ResetPasswordReq) (res constants.DefaultResponse, err error)
}

// request structs for password recovery

type ForgotPasswordReq struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordReq struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=6"`
}
