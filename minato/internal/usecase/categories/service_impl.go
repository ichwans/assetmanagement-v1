package categories

import (
	"context"

	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
)

type service struct{ repo repositories.Meta }

func NewService(repo repositories.Meta) Service { return &service{repo: repo} }

func (s *service) GetCategories(ctx context.Context) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] categories.GetCategories - START")

	rows, err := s.repo.GetCategories(ctx)
	if err != nil {
		log.Error(ctx, "[USECASE] categories.GetCategories - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	out := make([]Category, 0, len(rows))
	for _, r := range rows {
		out = append(out, Category{ID: r.ID, Name: r.Name, Slug: r.Slug, Description: r.Description, Icon: r.Icon})
	}

	log.Info(ctx, "[USECASE] categories.GetCategories - SUCCESS", "count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: out}, nil
}

func (s *service) GetLocations(ctx context.Context) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] categories.GetLocations - START")

	rows, err := s.repo.GetLocations(ctx)
	if err != nil {
		log.Error(ctx, "[USECASE] categories.GetLocations - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	out := make([]Location, 0, len(rows))
	for _, r := range rows {
		out = append(out, Location{ID: r.ID, Name: r.Name, Building: r.Building, Floor: r.Floor, Room: r.Room})
	}

	log.Info(ctx, "[USECASE] categories.GetLocations - SUCCESS", "count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: out}, nil
}
