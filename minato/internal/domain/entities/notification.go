package entities

import "time"

type Notification struct {
	ID        string    `json:"id" bson:"id"`
	UserID    string    `json:"userId" bson:"user_id"`
	Type      string    `json:"type" bson:"type"`
	Title     string    `json:"title" bson:"title"`
	Message   string    `json:"message" bson:"message"`
	Link      string    `json:"link,omitempty" bson:"link,omitempty"`
	Read      bool      `json:"read" bson:"read"`
	CreatedAt time.Time `json:"createdAt" bson:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" bson:"updated_at"`
}
