package ipfs

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"
	"time"
)

type Client interface {
	Cat(arg string) (io.ReadCloser, int, []byte, error)
	Add(filename string, data []byte, pin bool) (string, []byte, error)
	FilesMkdir(path string, parents bool) error
	FilesRm(path string, force bool) error
	FilesCp(src, dest string) error
}

type httpClient struct {
	api string
	hc  *http.Client
}

func NewClient(api string) Client {
	if api == "" {
		api = "http://localhost:5001"
	}
	return &httpClient{api: api, hc: &http.Client{Timeout: 60 * time.Second}}
}

// Cat performs /api/v0/cat and returns body stream. On HTTP error, returns status and body bytes.
func (c *httpClient) Cat(arg string) (io.ReadCloser, int, []byte, error) {
	reqURL := c.api + "/api/v0/cat?arg=" + url.QueryEscape(arg)
	req, err := http.NewRequest("POST", reqURL, nil)
	if err != nil {
		return nil, 0, nil, err
	}
	resp, err := c.hc.Do(req)
	if err != nil {
		return nil, 0, nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, resp.StatusCode, b, io.EOF
	}
	return resp.Body, resp.StatusCode, nil, nil
}

// Add uploads a single file and returns CID. It uses pin via query string.
func (c *httpClient) Add(filename string, data []byte, pin bool) (string, []byte, error) {
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	part, err := mw.CreateFormFile("file", filepath.Base(filename))
	if err != nil {
		return "", nil, err
	}
	if _, err := io.Copy(part, bytes.NewReader(data)); err != nil {
		return "", nil, err
	}
	_ = mw.Close()
	addURL := c.api + "/api/v0/add"
	if pin {
		addURL += "?pin=true"
	}
	req, err := http.NewRequest("POST", addURL, &body)
	if err != nil {
		return "", nil, err
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	resp, err := c.hc.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", b, io.EOF
	}
	// Parse last JSON object for Hash
	idx := bytes.LastIndexByte(b, '{')
	if idx < 0 {
		return "", b, io.EOF
	}
	// minimal parse to find "Hash":"..."
	// naive approach
	hash := parseHash(b[idx:])
	if hash == "" {
		return "", b, io.EOF
	}
	return hash, b, nil
}

func parseHash(j []byte) string {
	// very naive: look for "Hash":" and closing quote
	s := string(j)
	p := strings.Index(s, "\"Hash\":\"")
	if p < 0 {
		return ""
	}
	s2 := s[p+8:]
	q := strings.Index(s2, "\"")
	if q < 0 {
		return ""
	}
	return s2[:q]
}

func (c *httpClient) FilesMkdir(path string, parents bool) error {
	u := c.api + "/api/v0/files/mkdir?arg=" + url.QueryEscape(path)
	if parents {
		u += "&parents=true"
	}
	req, err := http.NewRequest("POST", u, nil)
	if err != nil {
		return err
	}
	resp, err := c.hc.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	return io.EOF
}

func (c *httpClient) FilesRm(path string, force bool) error {
	u := c.api + "/api/v0/files/rm?arg=" + url.QueryEscape(path)
	if force {
		u += "&force=true"
	}
	req, err := http.NewRequest("POST", u, nil)
	if err != nil {
		return err
	}
	resp, err := c.hc.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	return io.EOF
}

func (c *httpClient) FilesCp(src, dest string) error {
	u := c.api + "/api/v0/files/cp?arg=" + url.QueryEscape(src) + "&arg=" + url.QueryEscape(dest)
	req, err := http.NewRequest("POST", u, nil)
	if err != nil {
		return err
	}
	resp, err := c.hc.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	return io.EOF
}

// Helper: TryCatWithFallback tries cat on cid/path first, fallbacks to cid if LookupBySegment on bytes node.
func TryCatWithFallback(c Client, cid, subPath string) (io.ReadCloser, error) {
	arg := cid
	if subPath != "" {
		arg = cid + "/" + strings.TrimPrefix(subPath, "/")
	}
	body, code, berr, err := c.Cat(arg)
	if err == nil {
		return body, nil
	}
	if subPath != "" && berr != nil && strings.Contains(string(berr), "LookupBySegment") {
		// fallback to raw CID
		body2, _, _, err2 := c.Cat(cid)
		if err2 == nil {
			return body2, nil
		}
	}
	if berr != nil {
		return nil, &CatError{Status: code, Body: string(berr)}
	}
	return nil, err
}

type CatError struct {
	Status int
	Body   string
}

func (e *CatError) Error() string { return e.Body }
