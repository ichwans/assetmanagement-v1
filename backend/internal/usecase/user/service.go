package user

import (
	"context"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	GetAllUser(ctx context.Context, req GetUsersReq) (res constants.DefaultResponse, err error)
	GetUserDetail(ctx context.Context, req GetUserDetailReq) (res constants.DefaultResponse, err error)
	ChangeStatus(ctx context.Context, req ChangeStatusReq) (res constants.DefaultResponse, err error)
	GetUserByEmail(ctx context.Context, email string) (doc *entities.User, err error)
	GetUserCredentialByEmail(ctx context.Context, email string) (cred *entities.UserCredential, err error)
	CreateUser(ctx context.Context, req CreateUserReq) (res constants.DefaultResponse, err error)
	UpdateUser(ctx context.Context, req UpdateUserReq) (res constants.DefaultResponse, err error)
	ChangeMyPassword(ctx context.Context, req ChangePasswordReq) (res constants.DefaultResponse, err error)
}
