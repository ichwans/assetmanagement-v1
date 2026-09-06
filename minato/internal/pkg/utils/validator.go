package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/log"
)

var v *validator.Validate

func init() {
	v = validator.New()
	v.RegisterValidation("ISO8601Date", IsISO8601Date)
}

func Validate(c echo.Context, s interface{}) (err error) {
	ctx := c.Request().Context()

	if err = c.Bind(s); err != nil {
		log.Error(ctx, "error bind", err.Error())
		err = fmt.Errorf("%s", "Something Went Wrong")
		return
	}

	if err = c.Validate(s); err != nil {
		log.Error(ctx, "error validate", err.Error())
		c.Set("invalid-format", true)
		return
	}

	return
}

func ValidateStruct(ctx context.Context, s interface{}) (err error) {
	return v.StructCtx(ctx, s)
}

func IsISO8601Date(fl validator.FieldLevel) bool {
	ISO8601DateRegexString := "^\\d{4}(-\\d\\d(-\\d\\d(T\\d\\d:\\d\\d(:\\d\\d)?(\\.\\d+)?(([+-]\\d\\d:\\d\\d)|Z)?)?)?)?$"
	return regexp.MustCompile(ISO8601DateRegexString).MatchString(fl.Field().String())
}

func ValidateUUID(ctx context.Context, u string) (err error) {
	_, err = uuid.Parse(u)
	if err != nil {
		log.Error(ctx, "failed to parse uuid", err)
		err = fmt.Errorf("invalid uuid")
		return
	}
	return
}

func ValidateMultipartFormValue(ctx context.Context, values map[string][]string, target interface{}) (err error) {
	rawRequest := make(map[string]string, 0)
	for key, vals := range values {
		if len(vals) > 0 {
			rawRequest[key] = vals[0]
		}
	}
	rawByte, err := json.Marshal(rawRequest)
	if err != nil {
		log.Error(ctx, "failed to validate multipart form value", err)
		err = fmt.Errorf("something went wrong")
		return
	}
	err = json.Unmarshal(rawByte, target)
	if err != nil {
		log.Error(ctx, "failed to validate multipart form value", err)
		err = fmt.Errorf("something went wrong")
		return
	}
	err = ValidateStruct(ctx, target)
	if err != nil {
		log.Error(ctx, "failed to validate multipart form value", err)
	}
	return
}
