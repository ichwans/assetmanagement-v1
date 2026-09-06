package main

import (
"context"
"fmt"
"golang.org/x/crypto/bcrypt"
"go.mongodb.org/mongo-driver/bson"
"go.mongodb.org/mongo-driver/mongo"
"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
hashKey := "your-hash-salt-key-change-this-in-production"
newPassword := "Secret123"
combined := hashKey + newPassword

hash, err := bcrypt.GenerateFromPassword([]byte(combined), bcrypt.DefaultCost)
if err != nil {
fmt.Println("hash error:", err)
return
}

fmt.Println("New hash for admin@assethub.com:", string(hash))

ctx := context.Background()
client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://admin:adminpw@localhost:27017/assetmgmt?authSource=admin"))
if err != nil {
fmt.Println("connect error:", err)
return
}
defer client.Disconnect(ctx)

coll := client.Database("assetmgmt").Collection("user")
res, err := coll.UpdateOne(ctx,
bson.M{"email": "admin@assethub.com"},
bson.M{"$set": bson.M{"password": string(hash)}},
)
if err != nil {
fmt.Println("update error:", err)
return
}
fmt.Printf("Updated %d document(s) for admin@assethub.com\n", res.ModifiedCount)
}
