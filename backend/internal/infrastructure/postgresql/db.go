package postgresql

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/labstack/gommon/color"
	_ "github.com/lib/pq"
	"gitlab.com/riski/internal/config"
)

func NewDB(cfg config.PostgreSQLDB) (db *sql.DB) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Name)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		panic(fmt.Sprintf("failed to connect to postgres: %v", err))
	}

	db.SetMaxIdleConns(cfg.MinIdleConnections)
	db.SetMaxOpenConns(cfg.MaxOpenConnections)
	db.SetConnMaxLifetime(time.Duration(cfg.MaxLifetime) * time.Second)

	if err := db.Ping(); err != nil {
		panic(fmt.Sprintf("failed to ping postgres: %v", err))
	}

	color.Println(color.Green(fmt.Sprintf("⇨ connected to postgres db on %s\n", cfg.Name)))
	return
}

func NewDBUltron(cfg config.PostgreSQLDB) (db *sql.DB) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Name)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		panic(fmt.Sprintf("failed to connect to postgres: %v", err))
	}

	db.SetMaxIdleConns(cfg.MinIdleConnections)
	db.SetMaxOpenConns(cfg.MaxOpenConnections)
	db.SetConnMaxLifetime(time.Duration(cfg.MaxLifetime) * time.Second)

	if err := db.Ping(); err != nil {
		panic(fmt.Sprintf("failed to ping postgres: %v", err))
	}

	color.Println(color.Green(fmt.Sprintf("⇨ connected to postgres db on %s\n", cfg.Name)))
	return
}

func NewDBOmni(cfg config.PostgreSQLDB) (db *sql.DB) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Name)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		panic(fmt.Sprintf("failed to connect to postgres: %v", err))
	}

	db.SetMaxIdleConns(cfg.MinIdleConnections)
	db.SetMaxOpenConns(cfg.MaxOpenConnections)
	db.SetConnMaxLifetime(time.Duration(cfg.MaxLifetime) * time.Second)

	if err := db.Ping(); err != nil {
		panic(fmt.Sprintf("failed to ping postgres: %v", err))
	}

	color.Println(color.Green(fmt.Sprintf("⇨ connected to postgres db on %s\n", cfg.Name)))
	return
}
