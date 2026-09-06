package repositories

import (
	"context"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/pkg/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Asset interface {
	List(ctx context.Context) ([]entities.Asset, error)
	GetByID(ctx context.Context, id string) (*entities.Asset, error)
	GetHistory(ctx context.Context, id string) ([]entities.AssetHistoryEvent, error)
	GetMaintenance(ctx context.Context, id string) ([]entities.MaintenanceRecord, error)
	GetDocuments(ctx context.Context, id string) ([]entities.DocumentItem, error)
	InsertDocument(ctx context.Context, doc entities.DocumentItem) error
	UpdateStatus(ctx context.Context, id string, status string) error
	InsertManyAssets(ctx context.Context, docs []entities.Asset) error
	InsertManyHistory(ctx context.Context, docs []entities.AssetHistoryEvent) error
	InsertManyMaintenance(ctx context.Context, docs []entities.MaintenanceRecord) error
	InsertManyDocuments(ctx context.Context, docs []entities.DocumentItem) error
	GetRecentHistory(ctx context.Context, limit int) ([]entities.AssetHistoryEvent, error)
	InsertAsset(ctx context.Context, a entities.Asset) error
	InsertMaintenance(ctx context.Context, m entities.MaintenanceRecord) error
	UpdateTx(ctx context.Context, id string, txId string) error
	// Administrative cleanup
	ClearAllAssetData(ctx context.Context) error
	// Update owner and location
	UpdateOwnerAndLocation(ctx context.Context, assetID string, ownerID string, ownerName string, locationID string) error
}

type asset struct{ coll *mongo.Collection }

func NewAsset(db *mongo.Database) Asset { return &asset{coll: db.Collection("assets")} }

func (r *asset) List(ctx context.Context) ([]entities.Asset, error) {
	cur, err := r.coll.Find(ctx, bson.M{})
	if err != nil {
		log.Error(ctx, "asset list find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]entities.Asset, 0)
	for cur.Next(ctx) {
		var a entities.Asset
		if err := cur.Decode(&a); err == nil {
			out = append(out, a)
		}
	}
	return out, nil
}

func (r *asset) GetByID(ctx context.Context, id string) (*entities.Asset, error) {
	cur, err := r.coll.Find(ctx, bson.M{"asset_id": id})
	if err != nil {
		log.Error(ctx, "asset get %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	if cur.Next(ctx) {
		var a entities.Asset
		if err := cur.Decode(&a); err == nil {
			return &a, nil
		}
	}
	return nil, nil
}

func (r *asset) GetHistory(ctx context.Context, id string) ([]entities.AssetHistoryEvent, error) {
	coll := r.coll.Database().Collection("asset_history")
	cur, err := coll.Find(ctx, bson.M{"asset_id": id})
	if err != nil {
		log.Error(ctx, "asset history find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	var out []entities.AssetHistoryEvent
	for cur.Next(ctx) {
		var h entities.AssetHistoryEvent
		if cur.Decode(&h) == nil {
			out = append(out, h)
		}
	}
	return out, nil
}

func (r *asset) GetMaintenance(ctx context.Context, id string) ([]entities.MaintenanceRecord, error) {
	coll := r.coll.Database().Collection("asset_maintenance")
	cur, err := coll.Find(ctx, bson.M{"asset_id": id})
	if err != nil {
		log.Error(ctx, "asset maintenance find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	var out []entities.MaintenanceRecord
	for cur.Next(ctx) {
		var m entities.MaintenanceRecord
		if cur.Decode(&m) == nil {
			out = append(out, m)
		}
	}
	return out, nil
}

func (r *asset) GetDocuments(ctx context.Context, id string) ([]entities.DocumentItem, error) {
	coll := r.coll.Database().Collection("asset_documents")
	cur, err := coll.Find(ctx, bson.M{"asset_id": id})
	if err != nil {
		log.Error(ctx, "asset docs find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	var out []entities.DocumentItem
	for cur.Next(ctx) {
		var d entities.DocumentItem
		if cur.Decode(&d) == nil {
			out = append(out, d)
		}
	}
	return out, nil
}

func (r *asset) InsertDocument(ctx context.Context, doc entities.DocumentItem) error {
	coll := r.coll.Database().Collection("asset_documents")
	_, err := coll.InsertOne(ctx, doc)
	if err != nil {
		log.Error(ctx, "insert asset doc %v", err)
	}
	return err
}

func (r *asset) UpdateStatus(ctx context.Context, id string, status string) error {
	_, err := r.coll.UpdateOne(ctx, bson.M{"asset_id": id}, bson.M{"$set": bson.M{"status": status}})
	if err != nil {
		log.Error(ctx, "asset update status %v", err)
	}
	return err
}

func (r *asset) InsertManyAssets(ctx context.Context, docs []entities.Asset) error {
	if len(docs) == 0 {
		return nil
	}
	arr := make([]interface{}, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, d)
	}
	_, err := r.coll.InsertMany(ctx, arr)
	if err != nil {
		log.Error(ctx, "insert many assets %v", err)
	}
	return err
}

func (r *asset) InsertManyHistory(ctx context.Context, docs []entities.AssetHistoryEvent) error {
	if len(docs) == 0 {
		return nil
	}
	coll := r.coll.Database().Collection("asset_history")
	arr := make([]interface{}, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, d)
	}
	_, err := coll.InsertMany(ctx, arr)
	if err != nil {
		log.Error(ctx, "insert many history %v", err)
	}
	return err
}

func (r *asset) InsertManyMaintenance(ctx context.Context, docs []entities.MaintenanceRecord) error {
	if len(docs) == 0 {
		return nil
	}
	coll := r.coll.Database().Collection("asset_maintenance")
	arr := make([]interface{}, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, d)
	}
	_, err := coll.InsertMany(ctx, arr)
	if err != nil {
		log.Error(ctx, "insert many maintenance %v", err)
	}
	return err
}

func (r *asset) InsertManyDocuments(ctx context.Context, docs []entities.DocumentItem) error {
	if len(docs) == 0 {
		return nil
	}
	coll := r.coll.Database().Collection("asset_documents")
	arr := make([]interface{}, 0, len(docs))
	for _, d := range docs {
		arr = append(arr, d)
	}
	_, err := coll.InsertMany(ctx, arr)
	if err != nil {
		log.Error(ctx, "insert many documents %v", err)
	}
	return err
}

func (r *asset) GetRecentHistory(ctx context.Context, limit int) ([]entities.AssetHistoryEvent, error) {
	coll := r.coll.Database().Collection("asset_history")
	opts := options.Find()
	if limit > 0 {
		opts.SetLimit(int64(limit))
	}
	opts.SetSort(bson.M{"date": -1})
	cur, err := coll.Find(ctx, bson.M{}, opts)
	if err != nil {
		log.Error(ctx, "recent history find %v", err)
		return nil, err
	}
	defer cur.Close(ctx)
	var out []entities.AssetHistoryEvent
	for cur.Next(ctx) {
		var h entities.AssetHistoryEvent
		if cur.Decode(&h) == nil {
			out = append(out, h)
		}
	}
	return out, nil
}

func (r *asset) InsertAsset(ctx context.Context, a entities.Asset) error {
	_, err := r.coll.InsertOne(ctx, a)
	if err != nil {
		log.Error(ctx, "insert asset %v", err)
	}
	return err
}

func (r *asset) InsertMaintenance(ctx context.Context, m entities.MaintenanceRecord) error {
	coll := r.coll.Database().Collection("asset_maintenance")
	_, err := coll.InsertOne(ctx, m)
	if err != nil {
		log.Error(ctx, "insert maintenance %v", err)
	}
	return err
}

func (r *asset) UpdateTx(ctx context.Context, id string, txId string) error {
	_, err := r.coll.UpdateOne(ctx, bson.M{"asset_id": id}, bson.M{"$set": bson.M{"tx_id": txId}})
	if err != nil {
		log.Error(ctx, "asset update tx %v", err)
	}
	return err
}

func (r *asset) ClearAllAssetData(ctx context.Context) error {
	// delete all assets
	if _, err := r.coll.DeleteMany(ctx, bson.M{}); err != nil {
		log.Error(ctx, "clear assets %v", err)
		return err
	}
	// delete histories
	if _, err := r.coll.Database().Collection("asset_history").DeleteMany(ctx, bson.M{}); err != nil {
		log.Error(ctx, "clear asset_history %v", err)
		return err
	}
	// delete maintenance
	if _, err := r.coll.Database().Collection("asset_maintenance").DeleteMany(ctx, bson.M{}); err != nil {
		log.Error(ctx, "clear asset_maintenance %v", err)
		return err
	}
	// delete documents
	if _, err := r.coll.Database().Collection("asset_documents").DeleteMany(ctx, bson.M{}); err != nil {
		log.Error(ctx, "clear asset_documents %v", err)
		return err
	}
	return nil
}

func (r *asset) UpdateOwnerAndLocation(ctx context.Context, assetID string, ownerID string, ownerName string, locationID string) error {
	update := bson.M{"$set": bson.M{"owner": ownerID, "owner_name": ownerName, "location": locationID}}
	_, err := r.coll.UpdateOne(ctx, bson.M{"asset_id": assetID}, update)
	if err != nil {
		log.Error(ctx, "asset update owner/location %v", err)
	}
	return err
}
