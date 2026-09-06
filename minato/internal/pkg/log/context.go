package log

import (
	"context"
	"time"

	"github.com/labstack/echo/v4"
)

const (
	CTX_XID            = "ctx-xid"
	CTX_JID            = "ctx-jid"
	CTX_REQUEST_IP     = "ctx-request-ip"
	CTX_REQUEST_URL    = "ctx-request-url"
	CTX_REQUEST_METHOD = "ctx-request-method"
	CTX_REQUEST_TIME   = "ctx-request-time"
	CTX_REQUEST_HEADER = "ctx-request-header"
	CTX_ERROR_MESSAGE  = "ctx-error-message"
)

func SetContextFromEchoRequest(c echo.Context) context.Context {
	ctx := c.Request().Context()

	ctx = context.WithValue(ctx, CTX_REQUEST_IP, c.RealIP())
	ctx = context.WithValue(ctx, CTX_REQUEST_TIME, time.Now())
	ctx = context.WithValue(ctx, CTX_REQUEST_HEADER, c.Request().Header)

	return ctx
}

func SetErrorMessageFromEchoContext(c echo.Context, errMessage string) context.Context {
	ctx := c.Request().Context()
	ctx = context.WithValue(ctx, CTX_ERROR_MESSAGE, errMessage)
	return ctx
}

func SetErrorMessage(ctx context.Context, errMessage string) context.Context {
	ctx = context.WithValue(ctx, CTX_ERROR_MESSAGE, errMessage)
	return ctx
}

func GetRequestIPFromContext(ctx context.Context) string {
	s, ok := ctx.Value(CTX_REQUEST_IP).(string)
	if !ok {
		return ""
	}

	return s
}

func GetRequestTimeFromContext(ctx context.Context) time.Time {
	s, ok := ctx.Value(CTX_REQUEST_TIME).(time.Time)
	if !ok {
		return time.Now()
	}

	return s
}

func GetRequestHeaderFromContext(ctx context.Context) interface{} {
	return ctx.Value(CTX_REQUEST_HEADER)
}

func GetErrorMessageFromContext(ctx context.Context) string {
	s, ok := ctx.Value(CTX_ERROR_MESSAGE).(string)
	if !ok {
		return ""
	}

	return s
}
