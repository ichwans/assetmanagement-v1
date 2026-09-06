package assets

type (
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

	// ListQuery carries filtering and pagination params from HTTP query
	ListQuery struct {
		Page     string `query:"page"`
		Limit    string `query:"limit"`
		Search   string `query:"search"`
		Status   string `query:"status"`
		Category string `query:"category"`
		Location string `query:"location"`
		Owner    string `query:"owner"`
	}

	CreateAssetReq struct {
		Name             string  `json:"name" validate:"required"`
		Category         string  `json:"category" validate:"required"`
		Description      string  `json:"description"`
		SerialNumber     string  `json:"serialNumber"`
		AcquisitionDate  string  `json:"acquisitionDate" validate:"required"`
		AcquisitionPrice float64 `json:"acquisitionPrice" validate:"required"`
		Vendor           string  `json:"vendor"`
		InvoiceNumber    string  `json:"invoiceNumber"`
		Location         string  `json:"location" validate:"required"`
		Owner            string  `json:"owner" validate:"required"`
	}

	CreateMaintenanceReq struct {
		AssetID    string  `json:"-"`
		Type       string  `json:"type" validate:"required,oneof=routine repair upgrade calibration"`
		Date       string  `json:"date" validate:"required"`
		Notes      string  `json:"notes" validate:"required"`
		Cost       float64 `json:"cost" validate:"required"`
		Technician string  `json:"technician"`
		Vendor     string  `json:"vendor"`
	}
)
