package dashboard

import (
	"context"

	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
)

type service struct {
	assetRepo repositories.Asset
	metaRepo  repositories.Meta
}

func NewService(assets repositories.Asset, meta repositories.Meta) Service {
	return &service{assetRepo: assets, metaRepo: meta}
}

func (s *service) Stats(ctx context.Context) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] dashboard.Stats - START")

	items, err := s.assetRepo.List(ctx)
	if err != nil {
		log.Error(ctx, "[USECASE] dashboard.Stats - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] dashboard.Stats - Processing assets", "total_items", len(items))
	st := Stats{}
	for _, a := range items {
		st.TotalAssets++
		switch a.Status {
		case "active":
			st.ActiveAssets++
		case "borrowed":
			st.BorrowedAssets++
		case "maintenance":
			st.MaintenanceAssets++
		case "disposed":
			st.DisposedAssets++
		}
		if a.Status != "disposed" {
			st.TotalValue += a.AcquisitionPrice
		}
	}

	log.Info(ctx, "[USECASE] dashboard.Stats - SUCCESS", "total", st.TotalAssets, "active", st.ActiveAssets, "total_value", st.TotalValue)
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: st}, nil
}

func (s *service) AssetsByCategory(ctx context.Context) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] dashboard.AssetsByCategory - START")

	items, err := s.assetRepo.List(ctx)
	if err != nil {
		log.Error(ctx, "[USECASE] dashboard.AssetsByCategory - Asset repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	cats, err := s.metaRepo.GetCategories(ctx)
	if err != nil {
		log.Error(ctx, "[USECASE] dashboard.AssetsByCategory - Meta repository error", err.Error())
	}

	nameBySlug := map[string]string{}
	for _, c := range cats {
		nameBySlug[c.Slug] = c.Name
	}
	counts := map[string]int{}
	for _, a := range items {
		counts[a.Category]++
	}
	out := make([]CategoryCount, 0, len(counts))
	for slug, cnt := range counts {
		out = append(out, CategoryCount{Slug: slug, Name: nameBySlug[slug], Count: cnt})
	}

	log.Info(ctx, "[USECASE] dashboard.AssetsByCategory - SUCCESS", "category_count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: out}, nil
}

func (s *service) RecentActivity(ctx context.Context, limit int) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] dashboard.RecentActivity - START", "limit", limit)

	if limit <= 0 {
		limit = 10
	}
	rows, err := s.assetRepo.GetRecentHistory(ctx, limit)
	if err != nil {
		log.Error(ctx, "[USECASE] dashboard.RecentActivity - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	log.Info(ctx, "[USECASE] dashboard.RecentActivity - SUCCESS", "count", len(rows))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: rows}, nil
}
