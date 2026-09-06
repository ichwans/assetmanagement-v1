package assets

import (
	"context"
	"gitlab.com/riski/internal/pkg/constants"
)

type Service interface {
	List(ctx context.Context, q ListQuery) (res constants.DefaultResponse, err error)
	GetByID(ctx context.Context, id string) (res constants.DefaultResponse, err error)
	GetHistory(ctx context.Context, id string) (res constants.DefaultResponse, err error)
	GetMaintenance(ctx context.Context, id string) (res constants.DefaultResponse, err error)
	GetDocuments(ctx context.Context, id string) (res constants.DefaultResponse, err error)
	UploadDocument(ctx context.Context, id string, doc DocumentItem) (res constants.DefaultResponse, err error)
	UploadAndRecordDocument(ctx context.Context, id, docType, fileName, uploadedBy string, data []byte) (res constants.DefaultResponse, err error)
	UpdateStatus(ctx context.Context, id string, status string) (res constants.DefaultResponse, err error)
	Create(ctx context.Context, req CreateAssetReq) (res constants.DefaultResponse, err error)
	AddMaintenance(ctx context.Context, id string, req CreateMaintenanceReq) (res constants.DefaultResponse, err error)
	CompleteMaintenance(ctx context.Context, id string, date string, note string) (res constants.DefaultResponse, err error)
}
