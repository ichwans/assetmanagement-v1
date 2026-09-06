package entities

import "time"

type Asset struct {
	AssetID          string    `json:"assetId" bson:"asset_id"`
	Name             string    `json:"name" bson:"name"`
	Category         string    `json:"category" bson:"category"`
	Description      string    `json:"description" bson:"description"`
	SerialNumber     string    `json:"serialNumber" bson:"serial_number"`
	Owner            string    `json:"owner" bson:"owner"`
	OwnerName        string    `json:"ownerName" bson:"owner_name"`
	Location         string    `json:"location" bson:"location"`
	LocationDetail   string    `json:"locationDetail" bson:"location_detail"`
	Status           string    `json:"status" bson:"status"`
	AcquisitionDate  string    `json:"acquisitionDate" bson:"acquisition_date"`
	AcquisitionPrice float64   `json:"acquisitionPrice" bson:"acquisition_price"`
	Vendor           string    `json:"vendor" bson:"vendor"`
	InvoiceNumber    string    `json:"invoiceNumber" bson:"invoice_number"`
	TxID             string    `json:"txId" bson:"tx_id"`
	BlockNumber      int       `json:"blockNumber" bson:"block_number"`
	CreatedAt        time.Time `json:"createdAt" bson:"created_at"`
	UpdatedAt        time.Time `json:"updatedAt" bson:"updated_at"`
}

type AssetHistoryEvent struct {
	ID          string                 `json:"id" bson:"id"`
	AssetID     string                 `json:"assetId" bson:"asset_id"`
	EventType   string                 `json:"eventType" bson:"event_type"`
	Date        string                 `json:"date" bson:"date"`
	Description string                 `json:"description" bson:"description"`
	Details     map[string]interface{} `json:"details" bson:"details"`
	TxID        string                 `json:"txId" bson:"tx_id"`
	BlockNumber int                    `json:"blockNumber" bson:"block_number"`
}

type MaintenanceRecord struct {
	ID          string  `json:"id" bson:"id"`
	AssetID     string  `json:"assetId" bson:"asset_id"`
	Type        string  `json:"type" bson:"type"`
	Date        string  `json:"date" bson:"date"`
	Notes       string  `json:"notes" bson:"notes"`
	Cost        float64 `json:"cost" bson:"cost"`
	Technician  string  `json:"technician" bson:"technician"`
	Vendor      string  `json:"vendor" bson:"vendor"`
	TxID        string  `json:"txId" bson:"tx_id"`
	BlockNumber int     `json:"blockNumber" bson:"block_number"`
}

type DocumentItem struct {
	ID         string    `json:"id" bson:"id"`
	AssetID    string    `json:"assetId" bson:"asset_id"`
	FileName   string    `json:"fileName" bson:"file_name"`
	Type       string    `json:"type" bson:"type"`
	IpfsCID    string    `json:"ipfsCid" bson:"ipfs_cid"`
	HashSHA256 string    `json:"hashSha256" bson:"hash_sha256"`
	UploadedBy string    `json:"uploadedBy" bson:"uploaded_by"`
	CreatedAt  time.Time `json:"createdAt" bson:"created_at"`
}

type Category struct {
	ID          string `json:"id" bson:"id"`
	Name        string `json:"name" bson:"name"`
	Slug        string `json:"slug" bson:"slug"`
	Description string `json:"description" bson:"description"`
	Icon        string `json:"icon" bson:"icon"`
}

type Location struct {
	ID       string `json:"id" bson:"id"`
	Name     string `json:"name" bson:"name"`
	Building string `json:"building" bson:"building"`
	Floor    string `json:"floor" bson:"floor"`
	Room     string `json:"room" bson:"room"`
}

type ApprovalItem struct {
	ID            string    `json:"id" bson:"id"`
	Type          string    `json:"type" bson:"type"`
	AssetID       string    `json:"assetId" bson:"asset_id"`
	AssetName     string    `json:"assetName" bson:"asset_name"`
	RequesterID   string    `json:"requesterId" bson:"requester_id"`
	RequesterName string    `json:"requesterName" bson:"requester_name"`
	ToUnit        string    `json:"toUnit" bson:"to_unit"`
	FromUnit      string    `json:"fromUnit" bson:"from_unit"`
	Reason        string    `json:"reason" bson:"reason"`
	TransferType  string    `json:"transferType" bson:"transfer_type"`
	ToOwnerID     string    `json:"toOwnerId" bson:"to_owner_id"`
	ToLocationID  string    `json:"toLocationId" bson:"to_location_id"`
	CreatedAt     time.Time `json:"createdAt" bson:"created_at"`
	Status        string    `json:"status" bson:"status"`
	Notes         []string  `json:"notes" bson:"notes"`
}
