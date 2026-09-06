package files

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"mime"
	"net/url"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"gitlab.com/riski/internal/infrastructure/ipfs"
)

type Service interface {
	Get(cid, subPath, filename string) (io.ReadCloser, string, error)
	Signed(basePath string, cid, subPath, filename string, exp time.Time, secret string) (string, time.Time, error)
}

type service struct{ client ipfs.Client }

func NewService(client ipfs.Client) Service { return &service{client: client} }

func (s *service) Get(cid, subPath, filename string) (io.ReadCloser, string, error) {
	rc, err := ipfs.TryCatWithFallback(s.client, cid, subPath)
	if err != nil {
		return nil, "", err
	}
	// Peek content type is done in handler when streaming; here infer from filename if given
	ctype := "application/octet-stream"
	if filename != "" {
		if mt := mime.TypeByExtension(strings.ToLower(filepath.Ext(filename))); mt != "" {
			ctype = mt
		}
	}
	return rc, ctype, nil
}

func (s *service) Signed(basePath string, cid, subPath, filename string, exp time.Time, secret string) (string, time.Time, error) {
	q := url.Values{}
	if subPath != "" {
		q.Set("path", subPath)
	}
	if filename != "" {
		q.Set("filename", filename)
	}
	q.Set("exp", formatUnix(exp))
	unsigned := basePath + "/" + cid
	if enc := q.Encode(); enc != "" {
		unsigned += "?" + enc
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(unsigned))
	sig := hex.EncodeToString(mac.Sum(nil))
	if strings.Contains(unsigned, "?") {
		unsigned += "&sig=" + sig
	} else {
		unsigned += "?sig=" + sig
	}
	return unsigned, exp, nil
}

func formatUnix(t time.Time) string { return strconv.FormatInt(t.Unix(), 10) }
