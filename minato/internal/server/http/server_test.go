package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/color"
	"github.com/stretchr/testify/assert"
	"gitlab.com/riski/internal/infrastructure/container"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/server/handler"
)

type TestServer struct {
	server    *echo.Echo
	container *container.Container
}

func TestCreateUser(t *testing.T) {
	t.Parallel()
	ts := configServer()

	// Creating Body
	input := struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}{
		Name:  "amt",
		Email: "amt@gmail.com",
	}
	body, _ := json.Marshal(input)

	resp, req := getHTTPExchanges(http.MethodPost, "/v1/users", body)

	runServer(ts, resp, req)

	// Assertions
	t.Log(resp.Result().StatusCode)
	assert.Equal(t, 200, resp.Result().StatusCode)
}

func TestFindUsers(t *testing.T) {
	t.Parallel()
	ts := configServer()
	resp, req := getHTTPExchanges(http.MethodGet, "/v1/users")
	runServer(ts, resp, req)
	// Assertions
	t.Log(resp.Result().Body)
	t.Log(resp.Result().StatusCode)
	assert.Equal(t, 200, resp.Result().StatusCode)
}

func configServer() TestServer {
	// Server Config
	e := echo.New()
	container := container.New("../../../.env")
	SetupMiddleware(e, container)
	handler.SetupRouter(e, container)
	e.Server.Addr = fmt.Sprintf("%s:%s", container.Config.Apps.Address, container.Config.Apps.HttpPort)
	return TestServer{
		server:    e,
		container: container,
	}
}

func getHTTPExchanges(method, url string, body ...[]byte) (*httptest.ResponseRecorder, *http.Request) {
	// Request + Response
	header := map[string][]string{
		"Content-Type":  {"application/json"},
		"Authorization": {"Basic djE6djFAdA=="},
	}
	resp := httptest.NewRecorder()
	if len(body) > 0 {
		req := httptest.NewRequest(method, url, bytes.NewBuffer(body[0]))
		req.Header = header
		return resp, req
	}
	req := httptest.NewRequest(method, url, nil)
	req.Header = header
	return resp, req
}

func runServer(svr TestServer, resp *httptest.ResponseRecorder, req *http.Request) {
	color.Println(color.Green(fmt.Sprintf("⇨ h2c server started on port: %s\n", svr.container.Config.Apps.HttpPort)))
	log.Info(context.Background(), "h2c server started on port: "+svr.container.Config.Apps.HttpPort)

	// * HTTP/2 Cleartext Server (HTTP2 over HTTP)
	// gracehttp.Serve(&http.Server{Addr: e.Server.Addr, Handler: h2c.NewHandler(e, &http2.Server{MaxConcurrentStreams: 500, MaxReadFrameSize: 1048576})})
	svr.server.ServeHTTP(resp, req)
}
