package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	"gitlab.com/riski/internal/config"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
	filesvc "gitlab.com/riski/internal/usecase/files"
)

type fileHandler struct{ svc filesvc.Service }

func NewFileHandler(s filesvc.Service) *fileHandler { return &fileHandler{svc: s} }

// GetByCID streams content from IPFS by CID with best-effort Content-Type detection.
// Query params:
// - filename: hint to set Content-Type by extension
// - download: if "true", sets Content-Disposition attachment
func (h *fileHandler) GetByCID(c echo.Context) error {
	ctx := util.InjectProfile(c)
	cid := c.Param("cid")
	hintName := c.QueryParam("filename")
	subPath := strings.TrimPrefix(c.QueryParam("path"), "/")
	forceDownload := strings.ToLower(c.QueryParam("download")) == "true"
	// Optional: verify signature if provided
	if sig := c.QueryParam("sig"); sig != "" {
		if expStr := c.QueryParam("exp"); expStr != "" {
			if exp, err := strconv.ParseInt(expStr, 10, 64); err == nil {
				if time.Now().Unix() > exp {
					return echo.NewHTTPError(http.StatusUnauthorized, "signed url expired")
				}
				key, _ := getSigningKey()
				if len(key) > 0 {
					// Recompute signature over canonical path+query without sig
					q := c.QueryParams()
					q.Del("sig")
					// Ensure exp remains
					q.Set("exp", expStr)
					unsigned := c.Path()
					// Reconstruct actual path with params: echo's c.Path() has :cid placeholder; use URL path instead
					unsigned = c.Request().URL.Path
					if enc := q.Encode(); enc != "" {
						unsigned = unsigned + "?" + enc
					}
					mac := hmac.New(sha256.New, key)
					mac.Write([]byte(unsigned))
					expect := hex.EncodeToString(mac.Sum(nil))
					if !hmac.Equal([]byte(expect), []byte(sig)) {
						return echo.NewHTTPError(http.StatusUnauthorized, "invalid signature")
					}
				}
			}
		}
	}

	log.Info(ctx, "[HANDLER] files.GetByCID - START", "cid", cid)

	if cid == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cid is required")
	}

	rc, ctypeHint, err := h.svc.Get(cid, subPath, hintName)
	if err != nil {
		log.Error(ctx, "files.GetByCID - service error", err)
		return echo.NewHTTPError(http.StatusBadGateway, "ipfs fetch failed")
	}
	defer rc.Close()

	// Peek first bytes for content type detection
	const sniff = 512
	buf := make([]byte, sniff)
	n, _ := io.ReadFull(rc, buf)
	buf = buf[:n]

	// Decide Content-Type
	ctype := http.DetectContentType(buf)
	if hintName != "" {
		if ext := strings.ToLower(filepath.Ext(hintName)); ext != "" {
			if mt := mime.TypeByExtension(ext); mt != "" {
				ctype = mt
			}
		}
	} else if ctypeHint != "" {
		ctype = ctypeHint
	}

	// Follow response conventions: avoid logging large binary bodies
	c.Set("skip-body-logging", true)
	// Headers
	if forceDownload && hintName != "" {
		c.Response().Header().Set("Content-Disposition", "attachment; filename=\""+filepath.Base(hintName)+"\"")
	}
	c.Response().Header().Set("Content-Type", ctype)
	c.Response().WriteHeader(http.StatusOK)

	// Stream to client: first the peeked bytes, then the rest
	if len(buf) > 0 {
		if _, err := c.Response().Writer.Write(buf); err != nil {
			return err
		}
	}
	if _, err := io.Copy(c.Response().Writer, rc); err != nil {
		return err
	}

	log.Info(ctx, "[HANDLER] files.GetByCID - SUCCESS")
	return nil
}

// Signed returns a signed URL for public file access.
// Query: cid (required), path (optional), filename (optional), expires (seconds, optional, default 300)
func (h *fileHandler) Signed(c echo.Context) error {
	ctx := util.InjectProfile(c)
	cid := c.QueryParam("cid")
	path := c.QueryParam("path")
	filename := c.QueryParam("filename")
	expSec := c.QueryParam("expires")

	if cid == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cid is required")
	}

	// expiry
	ttl := int64(300)
	if expSec != "" {
		if v, err := strconv.ParseInt(expSec, 10, 64); err == nil && v > 0 && v <= 86400 {
			ttl = v
		}
	}
	exp := time.Now().Add(time.Duration(ttl) * time.Second).Unix()

	// secret
	key, err := getSigningKey()
	if err != nil || len(key) == 0 {
		return echo.NewHTTPError(http.StatusInternalServerError, "signing not configured")
	}

	// Build URL path + query (without sig)
	q := url.Values{}
	if path != "" {
		q.Set("path", path)
	}
	if filename != "" {
		q.Set("filename", filename)
	}
	q.Set("exp", strconv.FormatInt(exp, 10))
	unsigned := "/api/v1/files/" + cid
	if enc := q.Encode(); enc != "" {
		unsigned += "?" + enc
	}

	// Sign: HMAC-SHA256 over unsigned URL
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(unsigned))
	sig := hex.EncodeToString(mac.Sum(nil))

	signed := unsigned
	if strings.Contains(signed, "?") {
		signed += "&sig=" + sig
	} else {
		signed += "?sig=" + sig
	}

	log.Info(ctx, "[HANDLER] files.Signed - SUCCESS")
	return c.JSON(http.StatusOK, constants.DefaultResponse{
		Status:  constants.STATUS_SUCCESS,
		Message: constants.MESSAGE_SUCCESS,
		Data: map[string]any{
			"url":       signed,
			"expiresAt": exp,
		},
		Errors: []constants.DefaultResponseError{},
	})
}

// getSigningKey returns signing key bytes from env FILES_SIGNING_SECRET or config jwt.secret (base64).
func getSigningKey() ([]byte, error) {
	if s := os.Getenv("FILES_SIGNING_SECRET"); s != "" {
		return []byte(s), nil
	}
	if k := config.GetString("jwt.key"); k != "" {
		return []byte(k), nil
	}
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return []byte(s), nil
	}
	return nil, nil
}
