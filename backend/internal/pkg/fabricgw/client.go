package fabricgw

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/pkg/rest"
	util "gitlab.com/riski/internal/pkg/utils"
)

type Client interface {
	Evaluate(ctx context.Context, fn string, args []string, roleHint ...string) (json.RawMessage, error)
	Submit(ctx context.Context, fn string, args []string, roleHint ...string) (txId string, committed bool, payload json.RawMessage, err error)
	ExplorerSummary(ctx context.Context, limit, blocks int, roleHint ...string) (json.RawMessage, error)
	ExplorerChainInfo(ctx context.Context, roleHint ...string) (json.RawMessage, error)
	ExplorerBlock(ctx context.Context, num string, roleHint ...string) (json.RawMessage, error)
	ExplorerTx(ctx context.Context, txId string, roleHint ...string) (json.RawMessage, error)
	ExplorerBlockByTx(ctx context.Context, txId string, roleHint ...string) (json.RawMessage, error)
}

type client struct {
	baseURL string
	http    rest.RestClient
}

func New(baseURL string) Client {
	if baseURL == "" {
		baseURL = os.Getenv("FABRIC_GATEWAY_URL")
	}
	if baseURL == "" {
		baseURL = "http://localhost:3000"
	}
	return &client{baseURL: baseURL, http: rest.New(rest.Options{Address: baseURL, Timeout: 30 * time.Second})}
}

func (c *client) roleToHeaders(ctx context.Context, roleHint ...string) http.Header {
	h := http.Header{}
	role := ""
	if len(roleHint) > 0 {
		role = roleHint[0]
	}
	if role == "" {
		p := util.GetProfile(ctx)
		role = p.Role
	}
	if role != "" {
		h.Set("x-fabric-role", role)
	}
	return h
}

func (c *client) Evaluate(ctx context.Context, fn string, args []string, roleHint ...string) (json.RawMessage, error) {
	body := map[string]interface{}{"function": fn, "args": args}
	header := c.roleToHeaders(ctx, roleHint...)
	b, status, err := c.http.Post(ctx, "/api/evaluate", header, body, false)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("fabric evaluate http %d: %s", status, string(b))
	}
	var resp struct {
		Ok     bool            `json:"ok"`
		Result json.RawMessage `json:"result"`
		Error  string          `json:"error"`
	}
	if err := json.Unmarshal(b, &resp); err != nil {
		return nil, err
	}
	if !resp.Ok {
		return nil, fmt.Errorf("fabric evaluate error: %s", resp.Error)
	}
	return resp.Result, nil
}

func (c *client) Submit(ctx context.Context, fn string, args []string, roleHint ...string) (string, bool, json.RawMessage, error) {
	body := map[string]interface{}{"function": fn, "args": args}
	header := c.roleToHeaders(ctx, roleHint...)
	b, status, err := c.http.Post(ctx, "/api/submit", header, body, false)
	if err != nil {
		return "", false, nil, err
	}
	if status < 200 || status >= 300 {
		return "", false, nil, fmt.Errorf("fabric submit http %d: %s", status, string(b))
	}
	var resp struct {
		Ok        bool            `json:"ok"`
		TxID      string          `json:"txId"`
		Committed bool            `json:"committed"`
		Result    json.RawMessage `json:"result"`
		Error     string          `json:"error"`
	}
	if err := json.Unmarshal(b, &resp); err != nil {
		return "", false, nil, err
	}
	if !resp.Ok {
		return "", false, nil, fmt.Errorf("fabric submit error: %s", resp.Error)
	}
	log.Info(ctx, "[FABRIC] submit", "fn", fn, "txId", resp.TxID, "committed", resp.Committed)
	return resp.TxID, resp.Committed, resp.Result, nil
}

func (c *client) get(ctx context.Context, path string, roleHint ...string) ([]byte, int, error) {
	header := c.roleToHeaders(ctx, roleHint...)
	return c.http.Get(ctx, path, header)
}

func (c *client) ExplorerSummary(ctx context.Context, limit, blocks int, roleHint ...string) (json.RawMessage, error) {
	p := fmt.Sprintf("/api/explorer/summary?limit=%d&blocks=%d", limit, blocks)
	b, status, err := c.get(ctx, p, roleHint...)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("fabric explorer http %d: %s", status, string(b))
	}
	var resp struct {
		Ok    bool   `json:"ok"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal(b, &resp); err == nil && !resp.Ok {
		return nil, fmt.Errorf("fabric explorer error: %s", resp.Error)
	}
	return json.RawMessage(b), nil
}

func (c *client) ExplorerChainInfo(ctx context.Context, roleHint ...string) (json.RawMessage, error) {
	b, status, err := c.get(ctx, "/api/network/chaininfo", roleHint...)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("fabric explorer http %d: %s", status, string(b))
	}
	return json.RawMessage(b), nil
}

func (c *client) ExplorerBlock(ctx context.Context, num string, roleHint ...string) (json.RawMessage, error) {
	b, status, err := c.get(ctx, "/api/network/block/"+num, roleHint...)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("fabric explorer http %d: %s", status, string(b))
	}
	return json.RawMessage(b), nil
}

func (c *client) ExplorerTx(ctx context.Context, txId string, roleHint ...string) (json.RawMessage, error) {
	b, status, err := c.get(ctx, "/api/network/tx/"+txId, roleHint...)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("fabric explorer http %d: %s", status, string(b))
	}
	return json.RawMessage(b), nil
}

func (c *client) ExplorerBlockByTx(ctx context.Context, txId string, roleHint ...string) (json.RawMessage, error) {
	b, status, err := c.get(ctx, "/api/network/blockByTx/"+txId, roleHint...)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("fabric explorer http %d: %s", status, string(b))
	}
	return json.RawMessage(b), nil
}
