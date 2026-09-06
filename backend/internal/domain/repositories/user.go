package repositories

import (
	"context"
	"time"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/pkg/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type User interface {
	GetAllUser(ctx context.Context, req entities.GetUsersReq) (docs []entities.User, count uint, err error)
	GetUserByID(ctx context.Context, id primitive.ObjectID) (doc *entities.User, err error)
	UpdateUserStatus(ctx context.Context, userId, status, reason, changedBy string) (err error)
	GetUserByEmail(ctx context.Context, email string) (doc *entities.User, err error)
	GetUserCredentialByEmail(ctx context.Context, email string) (cred *entities.UserCredential, err error)
	CreateUser(ctx context.Context, u entities.UserCredential) (err error)
	UpdateUserProfile(ctx context.Context, id, fullName, userType, changedBy string) (err error)
	UpdateUserPasswordByEmail(ctx context.Context, email, newHash string) error

	// password reset token management
	SetResetToken(ctx context.Context, email, token string, expires time.Time) error
	GetEmailByResetToken(ctx context.Context, token string) (string, error)
	ClearResetToken(ctx context.Context, token string) error
}

type user struct {
	collection *mongo.Collection
}

func NewUser(db *mongo.Database) User {
	if db == nil {
		panic("sa db is nil")
	}
	return &user{collection: db.Collection("user")}
}

func (r *user) GetAllUser(ctx context.Context, req entities.GetUsersReq) (docs []entities.User, count uint, err error) {
	filter := make(map[string]interface{})

	// if req.StartDate != "" && req.EndDate != "" {
	// 	filter["created_at"] = map[string]interface{}{
	// 		"$gte": req.StartDate + "T00:00:00Z",
	// 		"$lte": req.EndDate + "T23:59:59Z",
	// 	}
	// }

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		log.Error(ctx, "error find user %v", err)
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var doc entities.User
		if err = cursor.Decode(&doc); err != nil {
			log.Error(ctx, "error decode user %v", err)
			return
		}
		if doc.Status == "" {
			doc.Status = "active"
		}
		docs = append(docs, doc)
	}

	count = uint(len(docs))
	return
}

func (r *user) GetUserByID(ctx context.Context, d primitive.ObjectID) (doc *entities.User, err error) {
	filter := map[string]interface{}{
		"$or": []map[string]interface{}{
			{"_id": d},
		},
	}

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		log.Error(ctx, "error find user by id %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)

	if cursor.Next(ctx) {
		var u entities.User
		if err = cursor.Decode(&u); err != nil {
			log.Error(ctx, "error decode user %v", err)
			return nil, err
		}
		if u.Status == "" {
			u.Status = "active"
		}
		return &u, nil
	}
	return nil, nil
}

func (r *user) UpdateUserStatus(ctx context.Context, userId, status, reason, changedBy string) (err error) {
	// insert to user_state collection as audit trail
	stateColl := r.collection.Database().Collection("user_state")
	state := entities.UserState{
		ID_:       primitive.NewObjectID(),
		UserId:    userId,
		State:     status,
		Reason:    reason,
		ChangedBy: changedBy,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	_, err = stateColl.InsertOne(ctx, state)
	if err != nil {
		log.Error(ctx, "error insert user_state %v", err)
		return err
	}
	// Also update the main user record status for quick retrieval in list
	// Match by various identifiers: user_id, id, uuid, or email
	filter := bson.M{"$or": []bson.M{
		{"user_id": userId},
		{"id": userId},
		{"uuid": userId},
		{"email": userId},
	}}
	_, err = r.collection.UpdateOne(ctx, filter, bson.M{"$set": bson.M{"status": status, "updated_at": time.Now().UTC()}})
	if err != nil {
		log.Error(ctx, "error update user status %v", err)
		// keep audit entry even if status update fails
		return err
	}
	return nil
}

func (r *user) GetUserByEmail(ctx context.Context, email string) (doc *entities.User, err error) {
	filter := map[string]interface{}{"email": email}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		log.Error(ctx, "error find user by email %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)
	if cursor.Next(ctx) {
		var u entities.User
		if err = cursor.Decode(&u); err != nil {
			log.Error(ctx, "error decode user by email %v", err)
			return nil, err
		}
		return &u, nil
	}
	return nil, nil
}

func (r *user) GetUserCredentialByEmail(ctx context.Context, email string) (cred *entities.UserCredential, err error) {
	filter := map[string]interface{}{"email": email}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		log.Error(ctx, "error find user credential by email %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)
	if cursor.Next(ctx) {
		var c entities.UserCredential
		if err = cursor.Decode(&c); err != nil {
			log.Error(ctx, "error decode user credential %v", err)
			return nil, err
		}
		return &c, nil
	}
	return nil, nil
}

func (r *user) CreateUser(ctx context.Context, u entities.UserCredential) (err error) {
	_, err = r.collection.InsertOne(ctx, map[string]interface{}{
		"email":      u.Email,
		"password":   u.PasswordHash,
		"user_type":  u.UserType,
		"full_name":  u.FullName,
		"created_at": time.Now().UTC(),
		"updated_at": time.Now().UTC(),
	})
	if err != nil {
		log.Error(ctx, "error insert user %v", err)
		return err
	}
	return nil
}

func (r *user) UpdateUserProfile(ctx context.Context, id, fullName, userType, changedBy string) (err error) {
	// Build filter to match by various ids or email
	filter := bson.M{"$or": []bson.M{
		{"user_id": id},
		{"id": id},
		{"uuid": id},
		{"email": id},
	}}
	update := bson.M{"$set": bson.M{"updated_at": time.Now().UTC()}}
	if fullName != "" {
		update["$set"].(bson.M)["full_name"] = fullName
	}
	if userType != "" {
		update["$set"].(bson.M)["user_type"] = userType
	}
	if len(update["$set"].(bson.M)) == 1 { // nothing to update besides updated_at
		return nil
	}
	_, err = r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Error(ctx, "error update user profile %v", err)
		return err
	}
	// audit trail
	stateColl := r.collection.Database().Collection("user_state")
	_, err = stateColl.InsertOne(ctx, entities.UserState{
		ID_:       primitive.NewObjectID(),
		UserId:    id,
		State:     "profile_updated",
		Reason:    "name/role updated",
		ChangedBy: changedBy,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		log.Error(ctx, "error insert user_state audit %v", err)
		return err
	}
	return nil
}

func (r *user) UpdateUserPasswordByEmail(ctx context.Context, email, newHash string) error {
	filter := bson.M{"email": email}
	update := bson.M{"$set": bson.M{"password": newHash, "updated_at": time.Now().UTC()}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Error(ctx, "error update user password %v", err)
		return err
	}
	return nil
}

// SetResetToken stores a token and expiry in the user record
func (r *user) SetResetToken(ctx context.Context, email, token string, expires time.Time) error {
	filter := bson.M{"email": email}
	update := bson.M{"$set": bson.M{"reset_token": token, "reset_expires": expires}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Error(ctx, "error set reset token %v", err)
		return err
	}
	return nil
}

// GetEmailByResetToken finds email by token only if not expired
func (r *user) GetEmailByResetToken(ctx context.Context, token string) (string, error) {
	filter := bson.M{"reset_token": token, "reset_expires": bson.M{"$gt": time.Now().UTC()}}
	var u entities.User
	if err := r.collection.FindOne(ctx, filter).Decode(&u); err != nil {
		if err == mongo.ErrNoDocuments {
			return "", nil
		}
		log.Error(ctx, "error query reset token %v", err)
		return "", err
	}
	return u.Email, nil
}

// ClearResetToken removes the token fields so it can't be used again
func (r *user) ClearResetToken(ctx context.Context, token string) error {
	filter := bson.M{"reset_token": token}
	update := bson.M{"$unset": bson.M{"reset_token": "", "reset_expires": ""}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Error(ctx, "error clear reset token %v", err)
		return err
	}
	return nil
}
