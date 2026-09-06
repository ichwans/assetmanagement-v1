package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"path"

	"gitlab.com/riski/internal/config"
	"gitlab.com/riski/internal/infrastructure/postgresql"
	"gitlab.com/riski/internal/pkg/log"
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
	log.Info(ctx, "Migrator", "Starting")

	// * Transaction
	tx, err := db.Begin()
	if err != nil {
		panic(err)
	}

	mDir := path.Join("internal", "pkg", "migrations")
	migrations, err := ioutil.ReadDir(mDir)
	if err != nil {
		tx.Rollback()
	}
	for _, m := range migrations {
		log.Info(ctx, "Seeder", m.Name)
		file, err := os.Open(path.Join(mDir, m.Name()))
		if err != nil {
			log.Error(ctx, fmt.Sprintf("failed to open %s", m.Name()), err)
			tx.Rollback()
			return
		}
		migrationData, err := ioutil.ReadAll(file)
		if err != nil {
			log.Error(ctx, fmt.Sprintf("failed to read %s", m.Name()), err)
			tx.Rollback()
			return
		}
		_, err = tx.Exec(string(migrationData))
		if err != nil {
			log.Error(ctx, fmt.Sprintf("failed to exec %s", m.Name()), err)
			tx.Rollback()
			return
		}
	}
	tx.Commit()
	log.Info(ctx, "Migrator", "Finished")
}
