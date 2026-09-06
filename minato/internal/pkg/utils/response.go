package utils

import (
	"context"

	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
)

func CreateResponse(ctx context.Context, logmsg string, err error, status string, message string) (res constants.DefaultResponse, errr error) {
	log.Error(ctx, logmsg, err)
	errr = nil
	res = constants.DefaultResponse{
		Status:  status,
		Message: message,
		Data:    nil,
	}
	return
}

// func NotFoundResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusNotFound, constants.MessageNotFound)
// }

// func StatusAccNotResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusAccNotFound, constants.MessageAccNotFound)
// }

// func DuplicateCredResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusDuplicateCred, constants.MessageDuplicateCred)
// }

// func BalanceNotEnoughResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusBalanceNotEnough, constants.MessageBalanceNotEnough)
// }

// func InvalidAmountResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusInvalidAmount, constants.MessageInvalidAmount)
// }

func DbErrorResponse(
	ctx context.Context,
	msg string,
	err error,
) (res constants.DefaultResponse, errr error) {
	return CreateResponse(ctx, msg, err, constants.STATUS_DATABASE_ERROR, constants.MESSAGE_DATABASE_ERROR)
}

// func DataNotFoundResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusDataNotFound, constants.MessageDataNotFound)
// }

// func InvalidReqResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusInvalidReq, constants.MessageInvalidReq)
// }

// func InvalidOTPResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusInvalidOTP, constants.MessageInvalidOTP)
// }

func NoRouteResponse(
	ctx context.Context,
	msg string,
	err error,
) (res constants.DefaultResponse, errr error) {
	return CreateResponse(ctx, msg, err, constants.STATUS_NO_DATA, constants.MESSAGE_DATA_NOT_FOUND)
}

// func InvalidJSONResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusInvalidJSON, constants.MessageInvalidJSON)
// }

// func GeneralResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusGeneral, constants.MessageGeneral)
// }

// func PasscodeResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusPasscodeBeenUsed, constants.MessagePasscode)
// }

// func UnauthorizedResponse(
// 	ctx context.Context,
// 	msg string,
// 	err error,
// ) (res constants.DefaultResponse, errr error) {
// 	return CreateResponse(ctx, msg, err, constants.StatusUnauthorized, constants.MessageUnauthorized)
// }

func UnsentResponse(
	ctx context.Context,
	msg string,
	err error,
) (res constants.DefaultResponse, errr error) {
	return CreateResponse(ctx, msg, err, constants.STATUS_UNKNOWN_ERROR, constants.MESSAGE_UNKNOWN_ERROR)
}

func SuccessResponse(
	ctx context.Context,
	msg string,
) (res constants.DefaultResponse, errr error) {
	res = constants.DefaultResponse{
		Status:  constants.STATUS_SUCCESS,
		Message: constants.MESSAGE_SUCCESS,
		Data:    nil,
	}
	return
}
