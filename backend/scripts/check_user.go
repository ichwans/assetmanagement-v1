package main

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	ctx := context.Background()
	uri := "mongodb://admin:adminpw@localhost:27017/assetmgmt?authSource=admin&tls=false"
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		fmt.Println("Connect error:", err)
		return
	}
	defer client.Disconnect(ctx)

	collection := client.Database("assetmgmt").Collection("users")
	
	// Print all users
	cursor, _ := collection.Find(ctx, bson.M{})
	var results []bson.M
	cursor.All(ctx, &results)
	fmt.Printf("Total users: %d\n", len(results))
	for _, res := range results {
		fmt.Printf("User: %v\n", res)
	}

	// Print specific user
	var c bson.M
	err = collection.FindOne(ctx, bson.M{"email": "admin@assethub.com"}).Decode(&c)
	fmt.Printf("admin@assethub.com -> err: %v, doc: %v\n", err, c)
}
