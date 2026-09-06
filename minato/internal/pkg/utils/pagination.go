package utils

import (
	"math"

	"gitlab.com/riski/internal/pkg/constants"
)

type PaginationParam struct {
	Page  uint
	Limit uint
}

func GetPaginationResponse[T interface{}](data []T, totalItems uint, paginationParam PaginationParam) (res constants.PaginationResponseData) {
	totalPages := uint(math.Ceil(float64(totalItems) / float64(paginationParam.Limit)))
	pd := constants.PaginationData{
		Page:        paginationParam.Page,
		TotalPages:  totalPages,
		TotalItems:  totalItems,
		Limit:       paginationParam.Limit,
		HasNext:     paginationParam.Page < totalPages,
		HasPrevious: paginationParam.Page > 1,
	}
	res.Results = data
	res.PaginationData = pd
	return
}
