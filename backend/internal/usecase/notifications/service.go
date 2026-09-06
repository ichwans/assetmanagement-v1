package notifications

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	List(ctx context.Context, q ListQuery) (res constants.DefaultResponse, err error)
	Create(ctx context.Context, in CreateNotificationReq) (res constants.DefaultResponse, err error)
	MarkRead(ctx context.Context, userID string, ids []string) (res constants.DefaultResponse, err error)
	MarkAllRead(ctx context.Context, userID string) (res constants.DefaultResponse, err error)
}
