package handler

import (
	"gitlab.com/riski/internal/infrastructure/container"
)

type Handler struct {
	userHandler         *userHandler
	authHandler         *authHandler
	assetHandler        *assetHandler
	fileHandler         *fileHandler
	healthHandler       *healthHandler
	categoryHandler     *categoryHandler
	approvalHandler     *approvalHandler
	notificationHandler *notificationHandler
	seedHandler         *seedHandler
	dashboardHandler    *dashboardHandler
	adminHandler        *adminHandler
	explorerHandler     *explorerHandler
}

func SetupHandler(container *container.Container) *Handler {
	return &Handler{
		userHandler:         NewUserHandler(container.UserService),
		authHandler:         NewAuthHandler(container.AuthService),
		assetHandler:        NewAssetHandler(container.AssetService),
		fileHandler:         NewFileHandler(container.FileService),
		healthHandler:       NewHealthHandler(),
		categoryHandler:     NewCategoryHandler(container.CategoryService),
		approvalHandler:     NewApprovalHandler(container.ApprovalService),
		notificationHandler: NewNotificationHandler(container.NotificationService),
		seedHandler:         NewSeedHandler(container.SeedService),
		dashboardHandler:    NewDashboardHandler(container.DashboardService),
		adminHandler:        NewAdminHandler(container.AdminService),
		explorerHandler:     NewExplorerHandler(container.FabricClient),
	}
}

func (h *Handler) Validate() *Handler {
	if h.userHandler == nil {
		panic("userHandler is nil")
	}
	if h.authHandler == nil {
		panic("authHandler is nil")
	}
	if h.assetHandler == nil {
		panic("assetHandler is nil")
	}
	if h.fileHandler == nil {
		panic("fileHandler is nil")
	}
	if h.healthHandler == nil {
		panic("healthHandler is nil")
	}
	if h.categoryHandler == nil {
		panic("categoryHandler is nil")
	}
	if h.approvalHandler == nil {
		panic("approvalHandler is nil")
	}
	if h.notificationHandler == nil {
		panic("notificationHandler is nil")
	}
	if h.seedHandler == nil {
		panic("seedHandler is nil")
	}
	if h.dashboardHandler == nil {
		panic("dashboardHandler is nil")
	}
	if h.adminHandler == nil {
		panic("adminHandler is nil")
	}
	if h.explorerHandler == nil {
		panic("explorerHandler is nil")
	}
	return h
}
