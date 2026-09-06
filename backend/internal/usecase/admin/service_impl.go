package admin

import (
	"context"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	notifs "gitlab.com/riski/internal/usecase/notifications"
)

type service struct {
	asset repositories.Asset
	meta  repositories.Meta
	notif notifs.Service
	users repositories.User
}

func NewService(asset repositories.Asset, meta repositories.Meta, notif notifs.Service, users repositories.User) Service {
	return &service{asset: asset, meta: meta, notif: notif, users: users}
}

func (s *service) ResetAssets(ctx context.Context) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] admin.ResetAssets - START")
	if err := s.asset.ClearAllAssetData(ctx); err != nil {
		log.Error(ctx, "[USECASE] admin.ResetAssets - Repo error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	log.Info(ctx, "[USECASE] admin.ResetAssets - SUCCESS")
	// Notify admins about reset action
	prof := util.GetProfile(ctx)
	s.notifyAdmins(ctx, "system", "Reset Assets", "Assets direset oleh "+prof.Email, "/")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) ResetMeta(ctx context.Context) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] admin.ResetMeta - START")
	if err := s.meta.ClearAllMetaData(ctx); err != nil {
		log.Error(ctx, "[USECASE] admin.ResetMeta - Repo error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	log.Info(ctx, "[USECASE] admin.ResetMeta - SUCCESS")
	prof := util.GetProfile(ctx)
	s.notifyAdmins(ctx, "system", "Reset Meta", "Categories & Locations direset oleh "+prof.Email, "/")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) notifyAdmins(ctx context.Context, ntype, title, message, link string) {
	if s.users == nil || s.notif == nil {
		return
	}
	docs, _, err := s.users.GetAllUser(ctx, entities.GetUsersReq{})
	if err != nil {
		return
	}
	for _, u := range docs {
		if u.UserType == "admin" || u.UserType == "admin_asset" || u.UserType == "head_unit" {
			_, _ = s.notif.Create(ctx, notifs.CreateNotificationReq{UserID: u.ID.Hex(), Type: ntype, Title: title, Message: message, Link: link})
		}
	}
}
