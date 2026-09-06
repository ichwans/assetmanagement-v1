/*
 * @Author: Arifin
 * @Date: 2019-12-27 22:38:26
 * @Last Modified by:   Arifin
 * @Last Modified time: 2019-12-27 22:38:26
 */
package errors

import (
	"errors"
	"testing"
)

func TestWithCodeStatus(t *testing.T) {

	listErrCode := []Status{
		ErrCodeNotFound,
		ErrCodeDatabaseError,
		ErrCodeInvalidRequest,
		ErrCodeInvalidJSON,
		ErrCodeGeneral,
	}

	for _, ErrCode := range listErrCode {
		x := New("test", ErrCode)

		if x.Error() != "test" {
			t.Errorf("Invalid message for statuscode %s", ErrCode)
		}

		e, ok := x.(*AppError)
		if !ok {
			t.Errorf("Invalid AppError")
		}

		if e.StatusCode != string(ErrCode) {
			t.Errorf("Invalid StatusCode for %s", ErrCode)
		}
	}

}

func TestWithMessage(t *testing.T) {
	msgErrFunc := errors.New("error string from object")
	msgErrStr := "error string"
	listErrMsg := []interface{}{
		msgErrStr,
		msgErrFunc,
		[]string{msgErrStr},
		[]error{msgErrFunc},
		123,
	}

	for _, ErrMsg := range listErrMsg {
		x := New(ErrMsg, ErrCodeNotFound)

		if _, ok := ErrMsg.(int); ok && x.Error() != errFailSet {
			t.Errorf("Invalid Err ")
		}

	}

}
