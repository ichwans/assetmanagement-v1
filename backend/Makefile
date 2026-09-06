.PHONY: help login seed-categories seed-locations seed-assets seed-history seed-maintenance seed-documents seed-approvals seed-all

# Base API URL
API_BASE ?= http://localhost:8080

# Optional for login helper
EMAIL ?=
PASSWORD ?=

# Seed files directory
SEED_DIR ?= scripts/seed

help:
	@echo "Seeding helpers"
	@echo "  make login EMAIL=... PASSWORD=...        # prints JWT token (optional)"
	@echo "  make seed-categories                     # seed categories.json"
	@echo "  make seed-locations                      # seed locations.json"
	@echo "  make seed-assets                         # seed assets.json"
	@echo "  make seed-history                        # seed history.json"
	@echo "  make seed-maintenance                    # seed maintenance.json"
	@echo "  make seed-documents                      # seed documents.json"
	@echo "  make seed-approvals                      # seed approvals.json"
	@echo "  make seed-all                            # run all the above (where files exist)"

login:
	@if [ -z "$(EMAIL)" ] || [ -z "$(PASSWORD)" ]; then \
		echo "Usage: make login EMAIL=admin@assethub.com PASSWORD=Secret123" ; \
		exit 1 ; \
	fi
	@curl -fsS -H 'Content-Type: application/json' \
		-d '{"email":"$(EMAIL)","password":"$(PASSWORD)"}' \
		"$(API_BASE)/api/v1/auth/login" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'

seed-categories:
	@curl -fsS -H "Content-Type: application/json" \
		--data-binary @"$(SEED_DIR)/categories.json" "$(API_BASE)/api/v1/seed/categories" && echo "\n[ok] categories seeded"

seed-locations:
	@curl -fsS -H "Content-Type: application/json" \
		--data-binary @"$(SEED_DIR)/locations.json" "$(API_BASE)/api/v1/seed/locations" && echo "\n[ok] locations seeded"

seed-assets:
	@curl -fsS -H "Content-Type: application/json" \
		--data-binary @"$(SEED_DIR)/assets.json" "$(API_BASE)/api/v1/seed/assets" && echo "\n[ok] assets seeded"

seed-history:
	@curl -fsS -H "Content-Type: application/json" \
		--data-binary @"$(SEED_DIR)/history.json" "$(API_BASE)/api/v1/seed/assets/history" && echo "\n[ok] history seeded"

seed-maintenance:
	@curl -fsS -H "Content-Type: application/json" \
		--data-binary @"$(SEED_DIR)/maintenance.json" "$(API_BASE)/api/v1/seed/assets/maintenance" && echo "\n[ok] maintenance seeded"

seed-documents:
	@curl -fsS -H "Content-Type: application/json" \
		--data-binary @"$(SEED_DIR)/documents.json" "$(API_BASE)/api/v1/seed/assets/documents" && echo "\n[ok] documents seeded"

seed-approvals:
	@curl -fsS -H "Content-Type: application/json" \
		--data-binary @"$(SEED_DIR)/approvals.json" "$(API_BASE)/api/v1/seed/approvals" && echo "\n[ok] approvals seeded"

seed-all: seed-categories seed-locations seed-assets seed-history seed-maintenance seed-approvals
	@echo "[done] all seeds"
