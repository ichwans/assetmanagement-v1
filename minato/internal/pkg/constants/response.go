package constants

const (
	STATUS_SUCCESS                = "AP00000"
	STATUS_INVALID_REQUEST_FORMAT = "AP00400"
	STATUS_UNAUTHORIZED           = "AP00401"
	STATUS_FORBIDDEN              = "AP00403"
	STATUS_CONFLICT               = "AP00409"
	STATUS_SERVER_ERROR           = "AP00500"
	STATUS_UNKNOWN_ERROR          = "AP99999"
	STATUS_TOO_MANY_REQUESTS      = "AP00429"
	STATUS_MSISDN_NOT_FOUND       = "AP10000"
	STATUS_RETRY_TIMEOUT          = "AP10001"
	STATUS_INVALID_PASSWORD       = "AP10002"
	STATUS_INVALID_OTP            = "AP10003"
	STATUS_NO_DATA                = "AP00404"
	STATUS_DATABASE_ERROR         = "AP10004"
)

const (
	TITLE_TOO_MANY_REQUESTS = "Too many requests"
	TITLE_MSISDN_NOT_FOUND  = "Phone Number Not Found"
	TITLE_RETRY_TIMEOUT     = "Retry Timeout"
	TITLE_INVALID_PASSWORD  = "Invalid Password"
	TITLE_INVALID_OTP       = "Invalid OTP"
)

const (
	MESSAGE_SUCCESS                = "Success"
	MESSAGE_INVALID_REQUEST_FORMAT = "Invalid Request Format"
	MESSAGE_UNAUTHORIZED           = "Unauthorized"
	MESSAGE_FORBIDDEN              = "Forbidden"
	MESSAGE_CONFLICT               = "Conflict"
	MESSAGE_SERVER_ERROR           = "Server Error"
	MESSAGE_UNKNOWN_ERROR          = "Something Went Wrong"
	MESSAGE_TOO_MANY_REQUESTS      = "Too many requests. Please try again later"
	MESSAGE_MSISDN_NOT_FOUND       = "Phone Number Not Found. Please check your phone number"
	MESSAGE_RETRY_TIMEOUT          = "Please wait for the retry timeout to finish"
	MESSAGE_INVALID_PASSWORD       = "Please check your password"
	MESSAGE_INVALID_OTP            = "Please check your OTP"
	MESSAGE_DATA_NOT_FOUND         = "Data not found"
	MESSAGE_ROUTE_NOT_FOUND        = "Route not found"
	MESSAGE_DATABASE_ERROR         = "Database Error"
)

type DefaultResponseError struct {
	Code    string `json:"code"`
	Title   string `json:"title"`
	Message string `json:"message"`
}

type DefaultResponse struct {
	Status  string                 `json:"status"`
	Message string                 `json:"message"`
	Data    interface{}            `json:"data"`
	Errors  []DefaultResponseError `json:"errors"`
}

type PaginationData struct {
	Page        uint `json:"page"`
	TotalPages  uint `json:"totalPages"`
	TotalItems  uint `json:"totalItems"`
	Limit       uint `json:"limit"`
	HasNext     bool `json:"hasNext"`
	HasPrevious bool `json:"hasPrevious"`
}

type PaginationResponseData struct {
	Results        interface{} `json:"results"`
	PaginationData `json:"pagination"`
}
