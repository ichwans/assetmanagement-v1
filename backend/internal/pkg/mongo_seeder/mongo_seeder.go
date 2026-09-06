package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"

	"gitlab.com/riski/internal/config"
	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	mongodb "gitlab.com/riski/internal/infrastructure/mongo"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/pkg/utils"
)

func main() {
	// Load env and logger
	config.Load(os.Getenv("env"), ".env")
	log.New()

	// Read seed admin from env
	adminEmail := strings.TrimSpace(os.Getenv("SEED_ADMIN_EMAIL"))
	adminPass := strings.TrimSpace(os.Getenv("SEED_ADMIN_PASSWORD"))
	adminName := strings.TrimSpace(os.Getenv("SEED_ADMIN_NAME"))
	adminRole := strings.TrimSpace(os.Getenv("SEED_ADMIN_ROLE"))
	if adminEmail == "" || adminPass == "" {
		fmt.Println("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required")
		return
	}
	if adminName == "" {
		adminName = "Administrator"
	}
	if adminRole == "" {
		adminRole = "admin"
	}

	// Connect Mongo
	cfg := config.MongoDB{URI: config.GetString("sa.mongodb.uri")}
	ctx := context.Background()
	var wg sync.WaitGroup
	db := mongodb.NewDB(cfg, ctx, &wg)

	// Setup user repository
	userRepo := repositories.NewUser(db)

	// Check exists
	if exists, _ := userRepo.GetUserCredentialByEmail(ctx, adminEmail); exists != nil {
		fmt.Println("Admin user already exists:", adminEmail)
		return
	}

	// Hash password and create user
	hashed, err := utils.HashPassword(adminPass)
	if err != nil {
		fmt.Println("Failed to hash password:", err)
		return
	}
	err = userRepo.CreateUser(ctx, entities.UserCredential{
		Email:        adminEmail,
		PasswordHash: hashed,
		UserType:     strings.ToLower(adminRole),
		FullName:     adminName,
	})
	if err != nil {
		fmt.Println("Failed to insert admin user:", err)
		return
	}
	fmt.Println("Seeded admin user:", adminEmail)
}
