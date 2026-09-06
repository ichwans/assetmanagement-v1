package fabricgw

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"gitlab.com/riski/internal/pkg/log"
)

func TestMain(m *testing.M) {
	log.New()
	os.Exit(m.Run())
}

func TestEvaluateSuccess(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/evaluate" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":     true,
			"result": map[string]interface{}{"assetId": "A-001"},
		})
	}))
	defer ts.Close()

	client := New(ts.URL)
	result, err := client.Evaluate(context.Background(), "GetAsset", []string{"A-001"})
	if err != nil {
		t.Fatalf("Evaluate returned error: %v", err)
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(result, &payload); err != nil {
		t.Fatalf("unmarshal Evaluate result: %v", err)
	}
	if payload["assetId"] != "A-001" {
		t.Fatalf("expected assetId A-001, got %v", payload["assetId"])
	}
}

func TestSubmitSuccess(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/submit" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":        true,
			"txId":      "tx-123",
			"committed": true,
			"result":    map[string]interface{}{"status": "ok"},
		})
	}))
	defer ts.Close()

	client := New(ts.URL)
	txId, committed, result, err := client.Submit(context.Background(), "CreateAsset", []string{"A-001", "CAT-01", "UNIT-01", "LOC-01"})
	if err != nil {
		t.Fatalf("Submit returned error: %v", err)
	}
	if txId != "tx-123" {
		t.Fatalf("expected txId tx-123, got %s", txId)
	}
	if !committed {
		t.Fatal("expected committed true")
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(result, &payload); err != nil {
		t.Fatalf("unmarshal Submit result: %v", err)
	}
	if payload["status"] != "ok" {
		t.Fatalf("expected status ok, got %v", payload["status"])
	}
}

func TestSubmitHTTPError(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"ok":false,"error":"internal"}`))
	}))
	defer ts.Close()

	client := New(ts.URL)
	_, _, _, err := client.Submit(context.Background(), "CreateAsset", []string{"A-001"})
	if err == nil {
		t.Fatal("expected error")
	}
}
