package seed

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	SeedCategories(ctx context.Context, docs []Category) (constants.DefaultResponse, error)
	SeedLocations(ctx context.Context, docs []Location) (constants.DefaultResponse, error)
	SeedAssets(ctx context.Context, docs []Asset) (constants.DefaultResponse, error)
	SeedAssetHistory(ctx context.Context, docs []AssetHistoryEvent) (constants.DefaultResponse, error)
	SeedMaintenance(ctx context.Context, docs []MaintenanceRecord) (constants.DefaultResponse, error)
	SeedDocuments(ctx context.Context, docs []DocumentItem) (constants.DefaultResponse, error)
	SeedApprovals(ctx context.Context, docs []ApprovalItem) (constants.DefaultResponse, error)
	SeedNotifications(ctx context.Context, docs []Notification) (constants.DefaultResponse, error)
}
