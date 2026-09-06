package repositories

import (
	"context"
	"time"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/pkg/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Notifications interface {
	List(ctx context.Context, userID string, notifType string, read *bool, page, limit int64) ([]entities.Notification, int64, error)
	Insert(ctx context.Context, n entities.Notification) error
	MarkRead(ctx context.Context, userID string, ids []string) error
	MarkAllRead(ctx context.Context, userID string) error
}

type notifications struct{ coll *mongo.Collection }

func NewNotifications(db *mongo.Database) Notifications {
	return &notifications{coll: db.Collection("notifications")}
}

func (r *notifications) List(ctx context.Context, userID string, notifType string, read *bool, page, limit int64) ([]entities.Notification, int64, error) {
	filter := bson.M{}
	if userID != "" {
		filter["user_id"] = userID
	}
	if notifType != "" {
		filter["type"] = notifType
	}
	if read != nil {
		filter["read"] = *read
	}

	// count
	total, err := r.coll.CountDocuments(ctx, filter)
	if err != nil {
		log.Error(ctx, "notif count %v", err)
		return nil, 0, err
	}

	// find with pagination and sort by created_at desc
	opts := options.Find().SetSort(bson.M{"created_at": -1})
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	opts.SetLimit(limit)
	opts.SetSkip((page - 1) * limit)

	cur, err := r.coll.Find(ctx, filter, opts)
	if err != nil {
		log.Error(ctx, "notif find %v", err)
		return nil, 0, err
	}
	defer cur.Close(ctx)
	var out []entities.Notification
	for cur.Next(ctx) {
		var n entities.Notification
		if err := cur.Decode(&n); err == nil {
			out = append(out, n)
		}
	}
	return out, total, nil
}

func (r *notifications) Insert(ctx context.Context, n entities.Notification) error {
	now := time.Now().UTC()
	if n.CreatedAt.IsZero() {
		n.CreatedAt = now
	}
	n.UpdatedAt = now
	_, err := r.coll.InsertOne(ctx, n)
	if err != nil {
		log.Error(ctx, "notif insert %v", err)
	}
	return err
}

func (r *notifications) MarkRead(ctx context.Context, userID string, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	_, err := r.coll.UpdateMany(ctx, bson.M{"user_id": userID, "id": bson.M{"$in": ids}}, bson.M{"$set": bson.M{"read": true, "updated_at": time.Now().UTC()}})
	if err != nil {
		log.Error(ctx, "notif mark read %v", err)
	}
	return err
}

func (r *notifications) MarkAllRead(ctx context.Context, userID string) error {
	_, err := r.coll.UpdateMany(ctx, bson.M{"user_id": userID, "read": false}, bson.M{"$set": bson.M{"read": true, "updated_at": time.Now().UTC()}})
	if err != nil {
		log.Error(ctx, "notif mark all read %v", err)
	}
	return err
}
