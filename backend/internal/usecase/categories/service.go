package categories

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	GetCategories(ctx context.Context) (res constants.DefaultResponse, err error)
	GetLocations(ctx context.Context) (res constants.DefaultResponse, err error)
}
