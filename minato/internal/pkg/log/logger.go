package log

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cast"
	"gitlab.com/riski/internal/config"
)

var (
	pkgLogger *logrus.Logger
	sysLogger *logrus.Logger
	tdrLogger *logrus.Logger
)

func New() {
	// Setup system logger
	sysLogger = logrus.New()
	if config.GetBool("logger.sys.stdout") {
		sysLogger.SetOutput(os.Stdout)
	} else {
		file, err := os.OpenFile(config.GetString("logger.sys.fileLocation"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			log.Printf("Failed to open sys log file: %v", err)
			sysLogger.SetOutput(os.Stdout)
		} else {
			sysLogger.SetOutput(file)
		}
	}

	// Setup TDR logger
	tdrLogger = logrus.New()
	if config.GetBool("logger.tdr.stdout") {
		tdrLogger.SetOutput(os.Stdout)
	} else {
		file, err := os.OpenFile(config.GetString("logger.tdr.fileLocation"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			log.Printf("Failed to open tdr log file: %v", err)
			tdrLogger.SetOutput(os.Stdout)
		} else {
			tdrLogger.SetOutput(file)
		}
	}

	// Use system logger as default
	pkgLogger = sysLogger

	// Set formatter
	pkgLogger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	tdrLogger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	sysLogger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
}

func Info(ctx context.Context, title string, messages ...interface{}) {
	fields := formatLogs(messages...)
	pkgLogger.WithFields(fields).Info(title)
}

func Warn(ctx context.Context, title string, messages ...interface{}) {
	fields := formatLogs(messages...)
	pkgLogger.WithFields(fields).Warn(title)
}

func Fatal(ctx context.Context, title string, messages ...interface{}) {
	fields := formatLogs(messages...)
	pkgLogger.WithFields(fields).Fatal(title)
}

func Error(ctx context.Context, title string, messages ...interface{}) {
	fields := formatLogs(messages...)
	pkgLogger.WithFields(fields).Error(title)
}

func TInfo(ctx context.Context, title string, startProcessTime time.Time, messages ...interface{}) {
	stop := time.Now()

	fields := formatLogs(messages...)
	fields["_process_time"] = fmt.Sprintf("%d ms", stop.Sub(startProcessTime).Milliseconds())

	pkgLogger.WithFields(fields).Info(title)
}

func T2(ctx context.Context, title string, messages ...interface{}) {
	fields := formatLogs(messages...)
	pkgLogger.WithFields(fields).Info(title)
}

func T3(ctx context.Context, title string, startProcessTime time.Time, messages ...interface{}) {
	stop := time.Now()

	fields := formatLogs(messages...)
	fields["_process_time"] = fmt.Sprintf("%d ms", stop.Sub(startProcessTime).Nanoseconds()/1000000)

	pkgLogger.WithFields(fields).Info(title)
}

func TDR(ctx context.Context, request, response []byte) {
	rt := time.Now().Sub(GetRequestTimeFromContext(ctx)).Nanoseconds() / 1000000

	tdrLog := logrus.Fields{
		"app_name":  config.GetString("appName"),
		"method":    ctx.Value("method"),
		"src_ip":    GetRequestIPFromContext(ctx),
		"resp_time": rt,
		"path":      ctx.Value("uri"),
		"header":    GetRequestHeaderFromContext(ctx),
		"request":   string(request),
		"response":  string(response),
		"thread_id": ctx.Value("threadId"),
		"error":     GetErrorMessageFromContext(ctx),
	}

	responseMap := make(map[string]interface{})
	if err := json.Unmarshal(response, &responseMap); err != nil {
		tdrLogger.WithFields(tdrLog).Info("TDR")
		return
	}

	if responseMap["status"] != nil {
		tdrLog["response_code"] = cast.ToString(responseMap["status"])
	}

	tdrLogger.WithFields(tdrLog).Info("TDR")
}

func formatLogs(messages ...interface{}) logrus.Fields {
	logRecord := make(logrus.Fields)
	for index, msg := range messages {
		logRecord["_message_"+cast.ToString(index)] = msg
	}

	return logRecord
}
