package container

import (
	"context"
	"os"
	"sync"

	"gitlab.com/riski/internal/config"
	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/infrastructure/ipfs"
	mongodb "gitlab.com/riski/internal/infrastructure/mongo"
	"gitlab.com/riski/internal/pkg/fabricgw"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/usecase/admin"
	"gitlab.com/riski/internal/usecase/approvals"
	"gitlab.com/riski/internal/usecase/assets"
	"gitlab.com/riski/internal/usecase/auth"
	"gitlab.com/riski/internal/usecase/categories"
	"gitlab.com/riski/internal/usecase/dashboard"
	files "gitlab.com/riski/internal/usecase/files"
	"gitlab.com/riski/internal/usecase/notifications"
	"gitlab.com/riski/internal/usecase/seed"
	"gitlab.com/riski/internal/usecase/user"

	"gitlab.com/riski/internal/domain/entities"
	util "gitlab.com/riski/internal/pkg/utils"
)

type Container struct {
	Config              *config.DefaultConfig
	PostgresqlDB        *config.PostgreSQLDB
	FabricClient        fabricgw.Client
	UserService         user.Service
	AuthService         auth.Service
	AssetService        assets.Service
	CategoryService     categories.Service
	ApprovalService     approvals.Service
	NotificationService notifications.Service
	SeedService         seed.Service
	DashboardService    dashboard.Service
	AdminService        admin.Service
	FileService         files.Service
}

func (c *Container) Validate() *Container {
	if c.Config == nil {
		panic("Config is nil")
	}
	if c.UserService == nil {
		panic("UserService is nil")
	}
	return c
}

func New(testingEnv ...string) *Container {
	if len(testingEnv) > 0 {
		config.Load(os.Getenv("env"), testingEnv[0])
	} else {
		config.Load(os.Getenv("env"), ".env")
	}

	defConfig := &config.DefaultConfig{
		Apps: config.Apps{
			Name:     config.GetString("appName"),
			Address:  config.GetString("address"),
			HttpPort: config.GetString("port"),
		},
	}
	mongoCfg := &config.MongoDB{
		URI: config.GetString("sa.mongodb.uri"),
	}

	log.New()

	ctx := context.Background()
	var wg = sync.WaitGroup{}
	mainMongo := mongodb.NewDB(*mongoCfg, ctx, &wg)

	// * Repositories
	userRepo := repositories.NewUser(mainMongo)
	assetRepo := repositories.NewAsset(mainMongo)
	metaRepo := repositories.NewMeta(mainMongo)
	approvalRepo := repositories.NewApprovals(mainMongo)
	notificationRepo := repositories.NewNotifications(mainMongo)

	// if there are no users in database, optionally seed an admin account from env vars
	// this helps with local development/testing so we can exercise auth flows
	if _, cnt, _ := userRepo.GetAllUser(ctx, entities.GetUsersReq{Limit: 1, Page: 1}); cnt == 0 {
		seedEmail := os.Getenv("SEED_ADMIN_EMAIL")
		seedPass := os.Getenv("SEED_ADMIN_PASSWORD")
		seedName := os.Getenv("SEED_ADMIN_NAME")
		if seedEmail != "" && seedPass != "" {
			hash, _ := util.HashPassword(seedPass)
			cred := entities.UserCredential{
				Email:        seedEmail,
				PasswordHash: hash,
				FullName:     seedName,
				UserType:     "admin",
			}
			if err := userRepo.CreateUser(ctx, cred); err != nil {
				log.Error(ctx, "error seeding admin user", err.Error())
			} else {
				log.Info(ctx, "seed admin user created", "email", seedEmail)
			}
		}
	}

	// * Wrapper
	// pantherWrapper := calypso.NewWrapper().SetupRequestHeader().Setup(*pantherConfid)

	// * Services
	userService := user.NewService(
		userRepo,
	)
	authService := auth.NewService(
		userRepo,
	)
	notificationService := notifications.NewService(notificationRepo)
	// Fabric gateway client (optional): FABRIC_GATEWAY_URL env
	fabricClient := fabricgw.New(os.Getenv("FABRIC_GATEWAY_URL"))
	// Files service & IPFS client (shared)
	ipfsAPI := os.Getenv("IPFS_API")
	ipfsClient := ipfs.NewClient(ipfsAPI)
	assetService := assets.NewService(assetRepo, notificationService, userRepo, fabricClient, ipfsClient)
	categoryService := categories.NewService(metaRepo)
	approvalService := approvals.NewService(approvalRepo, userRepo, notificationService, assetRepo, fabricClient)
	seedService := seed.NewService(assetRepo, metaRepo, approvalRepo, notificationRepo, userRepo, fabricClient)
	dashboardService := dashboard.NewService(assetRepo, metaRepo)
	adminService := admin.NewService(assetRepo, metaRepo, notificationService, userRepo)
	fileService := files.NewService(ipfsClient)

	// * Brokers

	// * Workers

	container := &Container{
		Config:              defConfig,
		FabricClient:        fabricClient,
		UserService:         userService,
		AuthService:         authService,
		AssetService:        assetService,
		CategoryService:     categoryService,
		ApprovalService:     approvalService,
		NotificationService: notificationService,
		SeedService:         seedService,
		DashboardService:    dashboardService,
		AdminService:        adminService,
		FileService:         fileService,
	}
	container.Validate()
	return container

}
