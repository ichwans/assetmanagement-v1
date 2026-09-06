package repositories

import (
	"context"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/pkg/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Meta interface {
	GetCategories(ctx context.Context) ([]entities.Category, error)
	GetLocations(ctx context.Context) ([]entities.Location, error)
	InsertManyCategories(ctx context.Context, docs []entities.Category) error
	InsertManyLocations(ctx context.Context, docs []entities.Location) error
	// Administrative cleanup
	ClearAllMetaData(ctx context.Context) error
}

type meta struct{ db *mongo.Database }

func NewMeta(db *mongo.Database) Meta { return &meta{db: db} }

func (r *meta) GetCategories(ctx context.Context) ([]entities.Category, error) {
	coll := r.db.Collection("categories")
	cur, err := coll.Find(ctx, bson.M{})
	if err != nil {
		log.Error(ctx, "categories find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	var out []entities.Category
	for cur.Next(ctx) {
		var c entities.Category
		if cur.Decode(&c) == nil {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *meta) GetLocations(ctx context.Context) ([]entities.Location, error) {
	coll := r.db.Collection("locations")
	cur, err := coll.Find(ctx, bson.M{})
	if err != nil {
		log.Error(ctx, "locations find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	var out []entities.Location
	for cur.Next(ctx) {
		var l entities.Location
		if cur.Decode(&l) == nil {
			out = append(out, l)
		}
	}
	return out, nil
}

func (r *meta) InsertManyCategories(ctx context.Context, docs []entities.Category) error {
	if len(docs) == 0 {
		return nil
	}
	coll := r.db.Collection("categories")
	arr := make([]interface{}, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, d)
	}
	_, err := coll.InsertMany(ctx, arr)
	if err != nil {
		log.Error(ctx, "insert many categories %v", err)
	}
	return err
}

func (r *meta) InsertManyLocations(ctx context.Context, docs []entities.Location) error {
	if len(docs) == 0 {
		return nil
	}
	coll := r.db.Collection("locations")
	arr := make([]interface{}, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, d)
	}
	_, err := coll.InsertMany(ctx, arr)
	if err != nil {
		log.Error(ctx, "insert many locations %v", err)
	}
	return err
}

func (r *meta) ClearAllMetaData(ctx context.Context) error {
	if _, err := r.db.Collection("categories").DeleteMany(ctx, bson.M{}); err != nil {
		log.Error(ctx, "clear categories %v", err)
		return err
	}
	if _, err := r.db.Collection("locations").DeleteMany(ctx, bson.M{}); err != nil {
		log.Error(ctx, "clear locations %v", err)
		return err
	}
	return nil
}
