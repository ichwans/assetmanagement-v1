package helper

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/log"
)

func GetBodyFromEchoContext(c echo.Context) (body []byte, err error) {
	if c.Request().Body != nil {
		body, err = io.ReadAll(c.Request().Body)
	}
	c.Request().Body = io.NopCloser(bytes.NewBuffer(body))
	return
}

func ParseInt16FromString(s string) (i int16, err error) {
	int64val, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return
	}
	i = int16(int64val)
	return
}

type FileType struct {
	Type string
	Size int64 // Size in MB
}

func ValidateFileHeader(fileHeader *multipart.FileHeader, fileTypes []FileType) (err error) {
	filenameSplit := strings.Split(fileHeader.Filename, ".")
	fileType := filenameSplit[len(filenameSplit)-1]
	for _, allowedType := range fileTypes {
		if fileType == allowedType.Type {
			if allowedType.Size != 0 && fileHeader.Size > allowedType.Size<<20 {
				err = fmt.Errorf("Error:Field validation for %s. File is too large", fileHeader.Filename)
			}
			return
		}
	}
	err = fmt.Errorf("Error:Field validation for %s. Invalid filetype", fileHeader.Filename)
	return
}

func ParseMultipartForm(c echo.Context, fileTypes []FileType) (files map[string][]*multipart.FileHeader, values map[string][]string, err error) {
	c.Set("skip-body-logging", true)
	ctx := c.Request().Context()
	err = c.Request().ParseMultipartForm(0)
	if err != nil {
		log.Error(ctx, "failed to parsemultipartformfile", "failed to parse c.request.parsemultipartform", err)
		err = fmt.Errorf("Error:Field validation for parse multipart form")
		return
	}
	files = c.Request().MultipartForm.File
	values = c.Request().MultipartForm.Value
	if len(files) < 1 && len(values) < 1 {
		err = fmt.Errorf("Error:Field validation for form file. Empty form")
		log.Error(ctx, "failed to parsemultipartformfile", "empty multipartform file", err)
		return
	}
	if len(fileTypes) > 0 {
		for _, valuess := range files {
			for _, fileHeader := range valuess {
				err = ValidateFileHeader(fileHeader, fileTypes)
				if err != nil {
					log.Error(ctx, "failed to parsemultipartformfile", "validatefileheader", err)
					return
				}
			}
		}
	}
	return
}
