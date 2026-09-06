package notifications

type Notification struct {
	ID        string `json:"id" bson:"_id,omitempty"`
	UserID    string `json:"userId" bson:"userId"`
	Type      string `json:"type" bson:"type"` // transfer, maintenance, asset, approval, system
	Title     string `json:"title" bson:"title"`
	Message   string `json:"message" bson:"message"`
	Link      string `json:"link,omitempty" bson:"link,omitempty"`
	Read      bool   `json:"read" bson:"read"`
	CreatedAt string `json:"createdAt" bson:"createdAt"`
}

type ListQuery struct {
	UserID string `query:"userId"`
	Type   string `query:"type"`
	Read   string `query:"read"` // "true", "false", or "" for all
	Limit  string `query:"limit"`
	Page   string `query:"page"`
}

type CreateNotificationReq struct {
	UserID  string `json:"userId" validate:"required"`
	Type    string `json:"type" validate:"required,oneof=transfer maintenance asset approval system"`
	Title   string `json:"title" validate:"required"`
	Message string `json:"message" validate:"required"`
	Link    string `json:"link"`
}

type MarkReadReq struct {
	IDs []string `json:"ids" validate:"required"`
}
