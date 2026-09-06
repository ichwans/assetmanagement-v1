/*
 * @Author: Arifin
 * @Date: 2019-12-27 22:38:30
 * @Last Modified by:   Arifin
 * @Last Modified time: 2019-12-27 22:38:30
 */
package errors

import (
	"errors"
	"net/http"
	"strings"
)

// Status code for error
type Status string

var (
	//ErrCodeNotFound Not Found
	ErrCodeNotFound Status = "12"
	//ErrCodeDatabaseError Database Error
	ErrCodeDatabaseError Status = "26"
	//ErrCodeInvalidRequest Invalid Request
	ErrCodeInvalidRequest Status = "95"
	//ErrCodeInvalidJSON Invalid JSON
	ErrCodeInvalidJSON Status = "98"
	//ErrCodeGeneral Code General
	ErrCodeGeneral Status = "99"
	//ErrCodePasscodeBeenUsed Invalid JSON
	ErrCodePasscodeBeenUsed Status = "98"

	errFailSet = "Failed to set custom error"

	ErrConflict                   = errors.New("Your username or email already exist")
	ErrUnknownUser                = errors.New("Unknown user")
	ErrInvalidPwd                 = errors.New("Your email or password invalid")
	ErrCodeDatabase               = errors.New("Error Database code")
	ErrorNotFoundParams           = errors.New("Some identifier is missing")
	ErrorProductNotExistParams    = errors.New("Product Doesnt Exist")
	ErrorProductNotFeasibleParams = errors.New("Product Doesnt easible to edit")
	ErrorRuleReserveParams        = errors.New("Reserve must be greater than refund")
)

func (s Status) httpErrorCode() int {
	switch s {
	case ErrCodeDatabaseError:
		return http.StatusInternalServerError
	case ErrCodeNotFound:
		return http.StatusNotFound
	case ErrCodeInvalidRequest:
		return http.StatusBadRequest
	case ErrCodeInvalidJSON:
		return http.StatusBadRequest
	case ErrCodeGeneral:
		return http.StatusUnprocessableEntity
	}
	return http.StatusUnprocessableEntity
}

func (s Status) httpMessage() string {
	switch s {
	case ErrCodeDatabaseError:
		return "DB " + http.StatusText(http.StatusInternalServerError)
	case ErrCodeNotFound:
		return http.StatusText(http.StatusNotFound)
	case ErrCodeInvalidRequest:
		return http.StatusText(http.StatusBadRequest)
	case ErrCodeInvalidJSON:
		return http.StatusText(http.StatusBadRequest)
	case ErrCodeGeneral:
		return http.StatusText(http.StatusUnprocessableEntity)
	}
	return http.StatusText(http.StatusUnprocessableEntity)
}

// AppError custom error
type AppError struct {
	Message     string
	Data        interface{}
	StatusCode  string
	HTTPCode    int
	HTTPMessage string
}

func (e *AppError) Error() string {
	return e.Message
}

func (e *AppError) Status() string {
	return e.StatusCode
}

// New create new custom AppError
func New(messg interface{}, i ...interface{}) error {

	err := &AppError{
		Message: mesgFromI(messg),
	}

	if len(i) > 0 {
		for _, v := range i {
			if x, ok := v.(Status); ok {
				err.StatusCode = string(x)
				err.HTTPCode = x.httpErrorCode()
				err.HTTPMessage = x.httpMessage()
			}
		}
	}

	if err.StatusCode == "" {
		err.StatusCode = string(ErrCodeGeneral)
		err.HTTPCode = ErrCodeGeneral.httpErrorCode()
		err.HTTPMessage = ErrCodeGeneral.httpMessage()
	}

	return err
}

func mesgFromI(messg interface{}) (msg string) {
	if e, ok := messg.(error); ok {
		msg = e.Error()
	} else if s, ok := messg.(string); ok {
		msg = s
	} else if sl, ok := messg.([]string); ok {
		msg = strings.Join(sl, ",")
	} else if se, ok := messg.([]error); ok {
		var t []string
		for _, v := range se {
			t = append(t, v.Error())
		}
		msg = strings.Join(t, ",")
	} else {
		msg = errFailSet
	}
	return
}
