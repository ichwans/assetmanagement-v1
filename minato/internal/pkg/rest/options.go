package rest

import (
	"time"
)

type Options struct {
	TagName string
	Address string
	Timeout time.Duration
	SkipTLS bool
}
