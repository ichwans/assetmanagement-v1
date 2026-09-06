package main

import (
	"context"
	"fmt"
	"os"

	"gitlab.com/riski/internal/config"
	"gitlab.com/riski/internal/infrastructure/postgresql"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/pkg/seeds"
)

func main() {
	config.Load(os.Getenv("env"), ".env")
	log.New()

	dbConfig := &config.PostgreSQLDB{
		Username:           config.GetString("postgresql.blade.username"),
		Password:           config.GetString("postgresql.blade.password"),
		Name:               config.GetString("postgresql.blade.db"),
		Schema:             config.GetString("postgresql.blade.schema"),
		Host:               config.GetString("postgresql.blade.host"),
		Port:               config.GetInt("postgresql.blade.port"),
		MinIdleConnections: config.GetInt("postgresql.blade.minIdleConnections"),
		MaxOpenConnections: config.GetInt("postgresql.blade.maxOpenConnections"),
		MaxLifetime:        config.GetInt("postgresql.blade.maxLifetime"),
		LogMode:            config.GetBool("postgresql.blade.logMode"),
	}
	db := postgresql.NewDB(*dbConfig)

	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

	ctx := context.Background()
	log.Info(ctx, "Seeder", "Starting")

	// * Transaction
	tx, err := db.Begin()
	if err != nil {
		panic(err)
	}

	for _, seed := range seeds.All() {
		log.Info(ctx, "Seeder", seed.Name)
		if err := seed.Run(tx); err != nil {
			log.Fatal(ctx, fmt.Sprintf("Running seed '%s', failed with error: %s", seed.Name, err))
			tx.Rollback()
			return
		}
	}
	tx.Commit()
	log.Info(ctx, "Seeder", "Finished")
}
