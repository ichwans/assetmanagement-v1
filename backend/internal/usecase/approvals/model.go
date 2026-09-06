package approvals

type (
	ApprovalItem struct {
		ID            string   `json:"id"`
		Type          string   `json:"type"` // transfer | dispose
		AssetID       string   `json:"assetId"`
		AssetName     string   `json:"assetName"`
		RequesterID   string   `json:"requesterId"`
		RequesterName string   `json:"requesterName"`
		ToUnit        string   `json:"toUnit"`
		FromUnit      string   `json:"fromUnit"`
		Reason        string   `json:"reason"`
		TransferType  string   `json:"transferType"` // borrow | permanent
		ToOwnerID     string   `json:"toOwnerId"`
		ToLocationID  string   `json:"toLocationId"`
		CreatedAt     string   `json:"createdAt"`
		Status        string   `json:"status"` // PENDING | APPROVED | REJECTED
		Notes         []string `json:"notes"`
	}
)
