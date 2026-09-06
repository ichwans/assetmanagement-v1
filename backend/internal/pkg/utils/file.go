package utils

import (
	"context"
	"fmt"
	"os"

	"gitlab.com/riski/internal/pkg/log"
)

func SaveFileFromBytes(ctx context.Context, fileName string, bytes []byte) (err error) {
	// Open a new file for writing only
	log.Info(ctx, fmt.Sprintf("saving file %s", fileName))
	file, err := os.OpenFile(fileName, os.O_WRONLY|os.O_TRUNC|os.O_CREATE, 0666)
	if err != nil {
		log.Error(ctx, fmt.Sprintf("failed saving file %s", fileName))
		return
	}
	defer file.Close()

	// Write bytes to file
	_, err = file.Write(bytes)
	if err != nil {
		log.Error(ctx, fmt.Sprintf("failed write file %s", fileName))
		return
	}
	log.Info(ctx, fmt.Sprintf("saved file %s", fileName))
	return
}

func RemoveFile(ctx context.Context, fileName string) (err error) {
	log.Info(ctx, fmt.Sprintf("removing file %s", fileName))
	err = os.Remove(fileName)
	if err != nil {
		log.Error(ctx, fmt.Sprintf("failed remove file %s", fileName))
		return
	}
	log.Info(ctx, fmt.Sprintf("removed file %s", fileName))
	return
}
