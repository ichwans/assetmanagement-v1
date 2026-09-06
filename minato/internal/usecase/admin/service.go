package admin

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	ResetAssets(ctx context.Context) (constants.DefaultResponse, error)
	ResetMeta(ctx context.Context) (constants.DefaultResponse, error)
}
