package repositories

import (
	"context"
	"time"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/pkg/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Approvals interface {
	List(ctx context.Context, status string) ([]entities.ApprovalItem, error)
	GetByID(ctx context.Context, id string) (*entities.ApprovalItem, error)
	Update(ctx context.Context, id string, fields bson.M) error
	Insert(ctx context.Context, a entities.ApprovalItem) error
	InsertMany(ctx context.Context, docs []entities.ApprovalItem) error
}

type approvals struct{ coll *mongo.Collection }

func NewApprovals(db *mongo.Database) Approvals { return &approvals{coll: db.Collection("approvals")} }

func (r *approvals) List(ctx context.Context, status string) ([]entities.ApprovalItem, error) {
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	cur, err := r.coll.Find(ctx, filter)
	if err != nil {
		log.Error(ctx, "approvals find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	var out []entities.ApprovalItem
	for cur.Next(ctx) {
		var a entities.ApprovalItem
		if cur.Decode(&a) == nil {
			out = append(out, a)
		}
	}
	return out, nil
}

func (r *approvals) GetByID(ctx context.Context, id string) (*entities.ApprovalItem, error) {
	cur, err := r.coll.Find(ctx, bson.M{"id": id})
	if err != nil {
		log.Error(ctx, "approval find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	if cur.Next(ctx) {
		var a entities.ApprovalItem
		if cur.Decode(&a) == nil {
			return &a, nil
		}
	}
	return nil, nil
}

func (r *approvals) Update(ctx context.Context, id string, fields bson.M) error {
    if fields == nil {
        fields = bson.M{}
    }
    // Split operator-style fields (e.g., "$push") from regular set fields
    setFields := bson.M{}
    opDoc := bson.M{}
    for k, v := range fields {
        if len(k) > 0 && k[0] == '$' {
            // Merge operator documents (e.g., $push: {...})
            if sub, ok := v.(bson.M); ok {
                // If same operator appears multiple times, merge
                if existing, ok := opDoc[k]; ok {
                    if m, ok := existing.(bson.M); ok {
                        for sk, sv := range sub {
                            m[sk] = sv
                        }
                        opDoc[k] = m
                    } else {
                        opDoc[k] = sub
                    }
                } else {
                    opDoc[k] = sub
                }
            } else {
                // Non-document operator payload; set as-is
                opDoc[k] = v
            }
        } else {
            setFields[k] = v
        }
    }
    // Always update timestamp
    setFields["updated_at"] = time.Now().UTC()
    update := bson.M{"$set": setFields}
    for op, doc := range opDoc {
        update[op] = doc
    }
    _, err := r.coll.UpdateOne(ctx, bson.M{"id": id}, update)
    if err != nil {
        log.Error(ctx, "approval update %v", err)
    }
    return err
}

func (r *approvals) Insert(ctx context.Context, a entities.ApprovalItem) error {
	if a.CreatedAt.IsZero() {
		a.CreatedAt = time.Now().UTC()
	}
	_, err := r.coll.InsertOne(ctx, a)
	if err != nil {
		log.Error(ctx, "approval insert %v", err)
	}
	return err
}

func (r *approvals) InsertMany(ctx context.Context, docs []entities.ApprovalItem) error {
	if len(docs) == 0 {
		return nil
	}
	arr := make([]interface{}, 0, len(docs))
	now := time.Now().UTC()
	for _, d := range docs {
		if d.CreatedAt.IsZero() {
			d.CreatedAt = now
		}
		arr = append(arr, d)
	}
	_, err := r.coll.InsertMany(ctx, arr)
	if err != nil {
		log.Error(ctx, "approval insert many %v", err)
	}
	return err
}
