package rest

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/opentracing/opentracing-go"
	"gitlab.com/riski/internal/pkg/log"
)

type RestClient interface {
	Post(ctx context.Context, path string, header http.Header, request interface{}, isXML bool) (body []byte, statusCode int, err error)
	Patch(ctx context.Context, path string, header http.Header, request interface{}, isXML bool) (body []byte, statusCode int, err error)
	Get(ctx context.Context, path string, header http.Header) (body []byte, statusCode int, err error)
	Delete(ctx context.Context, path string, header http.Header, request interface{}, isXML bool) (body []byte, statusCode int, err error)
}

type client struct {
	options    Options
	httpClient *http.Client
}

type restLogger struct {
	tag string
}

type Response struct {
	Body       []byte
	StatusCode int
}

func New(options Options) RestClient {
	httpClient := &http.Client{
		Timeout: options.Timeout,
	}

	if options.SkipTLS {
		tr := &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}

		httpClient.Transport = tr
	}

	return &client{
		options:    options,
		httpClient: httpClient,
	}
}

func (c *client) logRequest(ctx context.Context, method, url string, header http.Header, body []byte) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "restLogger.Request")
	defer span.Finish()

	log.T2(ctx, fmt.Sprintf("%s [Request]", method), url, header, body)
}

func (c *client) logResponse(ctx context.Context, method, url string, startTime time.Time, body []byte) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "restLogger.Response")
	defer span.Finish()

	log.T3(ctx, fmt.Sprintf("%s [Response]", method), startTime, url, body)
}

func (c *client) Post(ctx context.Context, path string, header http.Header, request interface{}, isXML bool) (body []byte, statusCode int, err error) {
	url := c.options.Address + path
	startTime := time.Now()

	reqByte, _ := json.Marshal(request)
	if request == nil {
		reqByte = nil
	}
	if isXML {
		reqByte = []byte(fmt.Sprintf("%v", request))
	}

	c.logRequest(ctx, "POST", url, header, reqByte)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(reqByte))
	if err != nil {
		log.Error(ctx, "error creating post request", err.Error())
		return
	}

	// Set headers
	for key, values := range header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	if !isXML {
		req.Header.Set("Content-Type", "application/json")
	} else {
		req.Header.Set("Content-Type", "application/xml")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Error(ctx, "error post request", err.Error())
		return
	}
	defer resp.Body.Close()

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Error(ctx, "error reading response body", err.Error())
		return
	}

	statusCode = resp.StatusCode
	c.logResponse(ctx, "POST", url, startTime, body)

	return
}

func (c *client) Patch(ctx context.Context, path string, header http.Header, request interface{}, isXML bool) (body []byte, statusCode int, err error) {
	url := c.options.Address + path
	startTime := time.Now()

	reqByte, _ := json.Marshal(request)
	if request == nil {
		reqByte = nil
	}
	if isXML {
		reqByte = []byte(fmt.Sprintf("%v", request))
	}

	c.logRequest(ctx, "PATCH", url, header, reqByte)

	req, err := http.NewRequestWithContext(ctx, "PATCH", url, bytes.NewBuffer(reqByte))
	if err != nil {
		log.Error(ctx, "error creating patch request", err.Error())
		return
	}

	// Set headers
	for key, values := range header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	if !isXML {
		req.Header.Set("Content-Type", "application/json")
	} else {
		req.Header.Set("Content-Type", "application/xml")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Error(ctx, "error patch request", err.Error())
		return
	}
	defer resp.Body.Close()

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Error(ctx, "error reading response body", err.Error())
		return
	}

	statusCode = resp.StatusCode
	c.logResponse(ctx, "PATCH", url, startTime, body)

	return
}

func (c *client) Get(ctx context.Context, path string, header http.Header) (body []byte, statusCode int, err error) {
	url := c.options.Address + path
	startTime := time.Now()

	c.logRequest(ctx, "GET", url, header, nil)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		log.Error(ctx, "error creating get request", err.Error())
		return
	}

	// Set headers
	for key, values := range header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Error(ctx, "error get request", err.Error())
		return
	}
	defer resp.Body.Close()

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Error(ctx, "error reading response body", err.Error())
		return
	}

	statusCode = resp.StatusCode
	c.logResponse(ctx, "GET", url, startTime, body)

	return
}

func (c *client) Delete(ctx context.Context, path string, header http.Header, request interface{}, isXML bool) (body []byte, statusCode int, err error) {
	url := c.options.Address + path
	startTime := time.Now()

	reqByte, _ := json.Marshal(request)
	if request == nil {
		reqByte = nil
	}
	if isXML {
		reqByte = []byte(fmt.Sprintf("%v", request))
	}

	c.logRequest(ctx, "DELETE", url, header, reqByte)

	req, err := http.NewRequestWithContext(ctx, "DELETE", url, bytes.NewBuffer(reqByte))
	if err != nil {
		log.Error(ctx, "error creating delete request", err.Error())
		return
	}

	// Set headers
	for key, values := range header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	if reqByte != nil {
		if !isXML {
			req.Header.Set("Content-Type", "application/json")
		} else {
			req.Header.Set("Content-Type", "application/xml")
		}
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Error(ctx, "error delete request", err.Error())
		return
	}
	defer resp.Body.Close()

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Error(ctx, "error reading response body", err.Error())
		return
	}

	statusCode = resp.StatusCode
	c.logResponse(ctx, "DELETE", url, startTime, body)

	return
}
