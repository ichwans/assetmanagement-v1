package constants

type PaginationRequest struct {
	Limit uint `query:"limit" validate:"gte=1,lte=1000"`
	Page  uint `query:"page" validate:"gte=1"`
}
