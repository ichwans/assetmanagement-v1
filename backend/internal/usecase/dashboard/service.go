package dashboard

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	Stats(ctx context.Context) (constants.DefaultResponse, error)
	AssetsByCategory(ctx context.Context) (constants.DefaultResponse, error)
	RecentActivity(ctx context.Context, limit int) (constants.DefaultResponse, error)
}
