package response

import "gitlab.com/riski/internal/pkg/constants"

type DefaultResponse struct {
	Status  string      `valid:"Required" json:"status"`
	Message string      `valid:"Required" json:"message"`
	Data    interface{} `json:"data"`
}

func CreateResponse(status string, message string, data interface{}) (response DefaultResponse) {
	response = DefaultResponse{
		Status:  status,
		Message: message,
		Data:    data,
	}

	return
}

func ErrorResponse(status, message string) (response DefaultResponse) {
	if message == "" {
		message = constants.MESSAGE_UNKNOWN_ERROR
	}
	response = DefaultResponse{
		Status:  status,
		Message: message,
		Data:    nil,
	}
	return
}
