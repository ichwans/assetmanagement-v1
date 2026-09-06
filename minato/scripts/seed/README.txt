Seed via API (admin only)

1) Start server and login to get JWT as admin.
2) POST JSON files to endpoints:

- Categories:  POST /api/v1/seed/categories      body: array of Category
- Locations:   POST /api/v1/seed/locations       body: array of Location
- Assets:      POST /api/v1/seed/assets          body: array of Asset
- History:     POST /api/v1/seed/assets/history  body: array of AssetHistoryEvent
- Maintenance: POST /api/v1/seed/assets/maintenance body: array of MaintenanceRecord
- Documents:   POST /api/v1/seed/assets/documents body: array of DocumentItem
- Approvals:   POST /api/v1/seed/approvals       body: array of ApprovalItem

Headers:
- Authorization: Bearer <JWT>
- Content-Type: application/json

Example:
curl -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data-binary @categories.json http://localhost:8080/api/v1/seed/categories

Provided JSON templates mirror src/lib/mock data:
- categories.json
- locations.json
- approvals.json
  (Extend with assets.json, maintenance.json, history.json, documents.json as needed.)

