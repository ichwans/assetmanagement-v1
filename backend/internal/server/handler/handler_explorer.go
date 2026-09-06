package handler

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/golang/protobuf/proto"
	common "github.com/hyperledger/fabric-protos-go/common"
	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/fabricgw"
	"gitlab.com/riski/internal/pkg/log"
	util "gitlab.com/riski/internal/pkg/utils"
)

type explorerHandler struct{ gw fabricgw.Client }

func NewExplorerHandler(gw fabricgw.Client) *explorerHandler { return &explorerHandler{gw: gw} }

func (h *explorerHandler) Summary(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] explorer.Summary - START")
	limit := 10
	blocks := 5
	if v := c.QueryParam("limit"); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			limit = i
		}
	}
	if v := c.QueryParam("blocks"); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			blocks = i
		}
	}

	raw, err := h.gw.ExplorerSummary(ctx, limit, blocks)
	if err != nil {
		log.Error(ctx, "[HANDLER] explorer.Summary - Gateway error", err.Error())
		return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}, Errors: []constants.DefaultResponseError{{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: err.Error()}}})
	}
	var data map[string]interface{}
	_ = json.Unmarshal(raw, &data)
	// Fallback: if height or latestBlocks missing, compute via QSCC and decode base64
	needBlocks := false
	heightStr := ""
	if netw, ok := data["network"].(map[string]interface{}); ok {
		if hs, ok2 := netw["height"].(string); ok2 && hs != "" {
			heightStr = hs
		}
	}
	if arr, ok := data["latestBlocks"].([]interface{}); !ok || len(arr) == 0 {
		needBlocks = true
	}
	if heightStr == "" || needBlocks {
		// fetch chaininfo and decode
		ciRaw, err := h.gw.ExplorerChainInfo(ctx)
		if err == nil {
			var ci map[string]interface{}
			if err := json.Unmarshal(ciRaw, &ci); err == nil {
				if b64, ok := ci["base64"].(string); ok && b64 != "" {
					if buf, err := base64.StdEncoding.DecodeString(b64); err == nil {
						var info common.BlockchainInfo
						if err := proto.Unmarshal(buf, &info); err == nil {
							heightStr = strconv.FormatUint(info.Height, 10)
						}
					}
				}
			}
		}
		// latest 5 blocks
		latest := make([]map[string]interface{}, 0)
		if heightStr != "" {
			if hNum, err := strconv.ParseInt(heightStr, 10, 64); err == nil {
				start := hNum - 1
				if start < 0 {
					start = 0
				}
				for n := start; n >= 0 && int64(len(latest)) < 5; n-- {
					if braw, err := h.gw.ExplorerBlock(ctx, strconv.FormatInt(n, 10)); err == nil {
						var blk map[string]interface{}
						if err := json.Unmarshal(braw, &blk); err == nil {
							if b64, ok := blk["base64"].(string); ok && b64 != "" {
								if buf, err := base64.StdEncoding.DecodeString(b64); err == nil {
									var b common.Block
									if err := proto.Unmarshal(buf, &b); err == nil {
										num := strconv.FormatUint(b.Header.Number, 10)
										txCount := 0
										if b.Data != nil {
											txCount = len(b.Data.Data)
										}
										latest = append(latest, map[string]interface{}{"number": num, "txCount": txCount})
									}
								}
							}
						}
					}
				}
			}
		}
		// inject into data
		if data == nil {
			data = map[string]interface{}{}
		}
		if netw, ok := data["network"].(map[string]interface{}); ok {
			if heightStr != "" {
				netw["height"] = heightStr
			}
		} else {
			data["network"] = map[string]interface{}{"height": heightStr}
		}
		if len(latest) > 0 {
			data["latestBlocks"] = latest
		}
	}
	log.Info(ctx, "[HANDLER] explorer.Summary - SUCCESS")
	return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: data})
}

func (h *explorerHandler) ChainInfo(c echo.Context) error {
	ctx := util.InjectProfile(c)
	log.Info(ctx, "[HANDLER] explorer.ChainInfo - START")
	raw, err := h.gw.ExplorerChainInfo(ctx)
	if err != nil {
		log.Error(ctx, "[HANDLER] explorer.ChainInfo - Gateway error", err.Error())
		return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}, Errors: []constants.DefaultResponseError{{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: err.Error()}}})
	}
	var data map[string]interface{}
	_ = json.Unmarshal(raw, &data)
	if b64, ok := data["base64"].(string); ok && b64 != "" {
		if buf, err := base64.StdEncoding.DecodeString(b64); err == nil {
			var info common.BlockchainInfo
			if err := proto.Unmarshal(buf, &info); err == nil {
				data = map[string]interface{}{
					"ok":     true,
					"height": strconv.FormatUint(info.Height, 10),
				}
			}
		}
	}
	log.Info(ctx, "[HANDLER] explorer.ChainInfo - SUCCESS")
	return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: data})
}

func (h *explorerHandler) Block(c echo.Context) error {
	ctx := util.InjectProfile(c)
	num := c.Param("num")
	log.Info(ctx, "[HANDLER] explorer.Block - START", "num", num)
	raw, err := h.gw.ExplorerBlock(ctx, num)
	if err != nil {
		log.Error(ctx, "[HANDLER] explorer.Block - Gateway error", err.Error())
		return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}, Errors: []constants.DefaultResponseError{{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: err.Error()}}})
	}
	var data map[string]interface{}
	_ = json.Unmarshal(raw, &data)
	if b64, ok := data["base64"].(string); ok && b64 != "" {
		if buf, err := base64.StdEncoding.DecodeString(b64); err == nil {
			var b common.Block
			if err := proto.Unmarshal(buf, &b); err == nil {
				num := strconv.FormatUint(b.Header.Number, 10)
				txCount := 0
				if b.Data != nil {
					txCount = len(b.Data.Data)
				}
				data = map[string]interface{}{
					"ok":    true,
					"block": map[string]interface{}{"number": num, "txCount": txCount},
				}
			}
		}
	}
	log.Info(ctx, "[HANDLER] explorer.Block - SUCCESS")
	return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: data})
}

func (h *explorerHandler) Tx(c echo.Context) error {
	ctx := util.InjectProfile(c)
	txId := c.Param("txId")
	log.Info(ctx, "[HANDLER] explorer.Tx - START", "txId", txId)
	raw, err := h.gw.ExplorerTx(ctx, txId)
	if err != nil {
		log.Error(ctx, "[HANDLER] explorer.Tx - Gateway error", err.Error())
		return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}, Errors: []constants.DefaultResponseError{{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: err.Error()}}})
	}
	var data map[string]interface{}
	_ = json.Unmarshal(raw, &data)
	log.Info(ctx, "[HANDLER] explorer.Tx - SUCCESS")
	return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: data})
}

func (h *explorerHandler) BlockByTx(c echo.Context) error {
	ctx := util.InjectProfile(c)
	txId := c.Param("txId")
	log.Info(ctx, "[HANDLER] explorer.BlockByTx - START", "txId", txId)
	raw, err := h.gw.ExplorerBlockByTx(ctx, txId)
	if err != nil {
		log.Error(ctx, "[HANDLER] explorer.BlockByTx - Gateway error", err.Error())
		return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}, Errors: []constants.DefaultResponseError{{Code: constants.STATUS_UNKNOWN_ERROR, Title: "Blockchain", Message: err.Error()}}})
	}
	var data map[string]interface{}
	_ = json.Unmarshal(raw, &data)
	log.Info(ctx, "[HANDLER] explorer.BlockByTx - SUCCESS")
	return c.JSON(http.StatusOK, constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: data})
}
