package handler

import (
	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/infrastructure/container"
)

func SetupRouter(e *echo.Echo, cnt *container.Container) {
	h := SetupHandler(cnt).Validate()

	v1 := e.Group("/api/v1")
	{
		// Public health endpoint
		v1.GET("/health", h.healthHandler.Health)
		v1.GET("/healthz", h.healthHandler.Health)
		// Public auth endpoints
		auth := v1.Group("/auth")
		{
			auth.POST("/login", h.authHandler.Login)
			auth.POST("/forgot-password", h.authHandler.ForgotPassword)
			auth.POST("/reset-password", h.authHandler.ResetPassword)
		}
        // user can check profile or change own password
        me := v1.Group("/me")
        {
            me.GET("", h.authHandler.Me, AuthJWT())
            me.POST("/password", h.userHandler.ChangeMyPassword, AuthJWT())
        }
        // Users endpoints: protected and admin/admin_asset roles
        user := v1.Group("/users", AuthJWT(), RoleGuard(cnt, "admin", "admin_asset"))
		{
			user.POST("", h.userHandler.Create)
			user.GET("", h.userHandler.GetAllUser)
			user.GET("/:id", h.userHandler.GetUserDetail)
			user.PATCH("/:id", h.userHandler.Update)
			user.POST("/:id/status", h.userHandler.ChangeStatus)
		}

		// Assets endpoints (protected)
		assets := v1.Group("/assets", AuthJWT())
		{
			assets.GET("", h.assetHandler.List)
			assets.GET("/:id", h.assetHandler.Detail)
			assets.GET("/:id/history", h.assetHandler.History)
			assets.GET("/:id/maintenance", h.assetHandler.Maintenance)
			assets.GET("/:id/documents", h.assetHandler.GetDocuments)
			assets.POST("/:id/documents", h.assetHandler.UploadDocument)
			assets.POST("/:id/documents/upload", h.assetHandler.UploadDocumentFile)
			assets.POST("/:id/status", h.assetHandler.ChangeStatus)
			assets.POST("", h.assetHandler.Create, RoleGuard(cnt, "admin", "admin_asset"))
			assets.POST("/:id/maintenance", h.assetHandler.CreateMaintenance, RoleGuard(cnt, "admin", "admin_asset"))
			assets.POST("/:id/maintenance/complete", h.assetHandler.CompleteMaintenance, RoleGuard(cnt, "admin", "admin_asset"))
		}

		// Files – public proxy by CID
		v1.GET("/files/:cid", h.fileHandler.GetByCID)
		// Signed URL generator – protected (to share public links safely)
		v1.GET("/files/signed", h.fileHandler.Signed, AuthJWT())

		// Categories & Locations (protected)
		meta := v1.Group("/meta", AuthJWT())
		{
			meta.GET("/categories", h.categoryHandler.ListCategories)
			meta.GET("/locations", h.categoryHandler.ListLocations)
		}

		// Approvals (protected)
		approvals := v1.Group("/approvals", AuthJWT())
		{
			approvals.GET("", h.approvalHandler.List)
			approvals.GET("/:id", h.approvalHandler.Detail)
			approvals.POST("/:id/decision", h.approvalHandler.Decide)
			approvals.POST("/transfer", h.approvalHandler.CreateTransfer)
			approvals.POST("/dispose", h.approvalHandler.CreateDispose)
		}

		// Notifications (protected)
		notifications := v1.Group("/notifications", AuthJWT())
		{
			notifications.GET("", h.notificationHandler.List)
			notifications.POST("/mark-read", h.notificationHandler.MarkRead)
			notifications.POST("/mark-all-read", h.notificationHandler.MarkAllRead)
			// create notification (admin only)
			notifications.POST("", h.notificationHandler.Create, RoleGuard(cnt, "admin"))
		}

		// Seed endpoints (public, no auth)
		seed := v1.Group("/seed")
		{
			seed.POST("/categories", h.seedHandler.Categories)
			seed.POST("/locations", h.seedHandler.Locations)
			seed.POST("/assets", h.seedHandler.Assets)
			seed.POST("/assets/history", h.seedHandler.AssetHistory)
			seed.POST("/assets/maintenance", h.seedHandler.Maintenance)
			seed.POST("/assets/documents", h.seedHandler.Documents)
			seed.POST("/approvals", h.seedHandler.Approvals)
			seed.POST("/notifications", h.seedHandler.Notifications)
		}

		// Dashboard endpoints (protected)
		dashboard := v1.Group("/dashboard", AuthJWT())
		{
			dashboard.GET("/stats", h.dashboardHandler.Stats)
			dashboard.GET("/assets-by-category", h.dashboardHandler.AssetsByCategory)
			dashboard.GET("/recent-activity", h.dashboardHandler.Recent)
		}

		// Explorer (protected)
		explorer := v1.Group("/explorer", AuthJWT())
		{
			explorer.GET("/summary", h.explorerHandler.Summary)
			explorer.GET("/chaininfo", h.explorerHandler.ChainInfo)
			explorer.GET("/block/:num", h.explorerHandler.Block)
			explorer.GET("/tx/:txId", h.explorerHandler.Tx)
			explorer.GET("/blockByTx/:txId", h.explorerHandler.BlockByTx)
		}

		// Admin reset endpoints (protected, admin-only)
		admin := v1.Group("/admin", AuthJWT(), RoleGuard(cnt, "admin"))
		{
			admin.POST("/reset/assets", h.adminHandler.ResetAssets)
			admin.POST("/reset/meta", h.adminHandler.ResetMeta)
		}
	}

}
