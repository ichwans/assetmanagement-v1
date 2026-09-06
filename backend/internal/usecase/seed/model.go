package seed

type (
	Category struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
	}

	Location struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Building string `json:"building"`
		Floor    string `json:"floor"`
		Room     string `json:"room"`
	}

	Asset struct {
		AssetID          string  `json:"assetId"`
		Name             string  `json:"name"`
		Category         string  `json:"category"`
		Description      string  `json:"description"`
		SerialNumber     string  `json:"serialNumber"`
		Owner            string  `json:"owner"`
		OwnerName        string  `json:"ownerName"`
		Location         string  `json:"location"`
		LocationDetail   string  `json:"locationDetail"`
		Status           string  `json:"status"`
		AcquisitionDate  string  `json:"acquisitionDate"`
		AcquisitionPrice float64 `json:"acquisitionPrice"`
		Vendor           string  `json:"vendor"`
		InvoiceNumber    string  `json:"invoiceNumber"`
		TxID             string  `json:"txId"`
		BlockNumber      int     `json:"blockNumber"`
		CreatedAt        string  `json:"createdAt"`
		UpdatedAt        string  `json:"updatedAt"`
	}

	AssetHistoryEvent struct {
		ID          string                 `json:"id"`
		AssetID     string                 `json:"assetId"`
		EventType   string                 `json:"eventType"`
		Date        string                 `json:"date"`
		Description string                 `json:"description"`
		Details     map[string]interface{} `json:"details"`
		TxID        string                 `json:"txId"`
		BlockNumber int                    `json:"blockNumber"`
	}

	MaintenanceRecord struct {
		ID          string  `json:"id"`
		AssetID     string  `json:"assetId"`
		Type        string  `json:"type"`
		Date        string  `json:"date"`
		Notes       string  `json:"notes"`
		Cost        float64 `json:"cost"`
		Technician  string  `json:"technician"`
		Vendor      string  `json:"vendor"`
		TxID        string  `json:"txId"`
		BlockNumber int     `json:"blockNumber"`
	}

	DocumentItem struct {
		ID         string `json:"id"`
		AssetID    string `json:"assetId"`
		FileName   string `json:"fileName"`
		Type       string `json:"type"`
		IpfsCID    string `json:"ipfsCid"`
		HashSHA256 string `json:"hashSha256"`
		UploadedBy string `json:"uploadedBy"`
		CreatedAt  string `json:"createdAt"`
	}

	ApprovalItem struct {
		ID            string   `json:"id"`
		Type          string   `json:"type"`
		AssetID       string   `json:"assetId"`
		AssetName     string   `json:"assetName"`
		RequesterID   string   `json:"requesterId"`
		RequesterName string   `json:"requesterName"`
		ToUnit        string   `json:"toUnit"`
		FromUnit      string   `json:"fromUnit"`
		Reason        string   `json:"reason"`
		TransferType  string   `json:"transferType"`
		ToOwnerID     string   `json:"toOwnerId"`
		ToLocationID  string   `json:"toLocationId"`
		CreatedAt     string   `json:"createdAt"`
		Status        string   `json:"status"`
		Notes         []string `json:"notes"`
	}

	Notification struct {
		ID        string `json:"id"`
		UserID    string `json:"userId"`
		Type      string `json:"type"`
		Title     string `json:"title"`
		Message   string `json:"message"`
		Link      string `json:"link"`
		Read      bool   `json:"read"`
		CreatedAt string `json:"createdAt"`
	}
)
