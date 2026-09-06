package approvals

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	List(ctx context.Context, status string) (res constants.DefaultResponse, err error)
	GetByID(ctx context.Context, id string) (res constants.DefaultResponse, err error)
	Decide(ctx context.Context, id string, decision string, note string) (res constants.DefaultResponse, err error)
	CreateTransfer(ctx context.Context, in ApprovalItem) (res constants.DefaultResponse, err error)
	CreateDispose(ctx context.Context, in ApprovalItem) (res constants.DefaultResponse, err error)
}
