package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.com/riski/internal/infrastructure/container"
	"gitlab.com/riski/internal/pkg/log"
	utility "gitlab.com/riski/internal/pkg/utils"
)

// AuthJWT validates Authorization header (Bearer <token>) and injects profile into context/header
func AuthJWT() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// allow public endpoints
			path := c.Path()
			if strings.HasPrefix(path, "/api/v1/auth/") || path == "/" {
				log.Info(c.Request().Context(), "Public endpoint accessed: "+path)
				return next(c)
			}

			auth := c.Request().Header.Get(echo.HeaderAuthorization)
			if !strings.HasPrefix(strings.ToLower(auth), "bearer ") {
				log.Info(c.Request().Context(), "Auth JWT missing bearer token")
				c.Set("unauthorized", true)
				return echo.NewHTTPError(http.StatusUnauthorized, "missing bearer token")
			}
			token := strings.TrimSpace(auth[len("Bearer "):])
			claims, err := utility.JwtVerify(token)
			if err != nil {
				log.Info(c.Request().Context(), "Auth JWT verification failed: "+err.Error())
				c.Set("unauthorized", true)
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}
			// Build profile JSON string for InjectProfile/GetProfile compatibility
			claimsJsonStr, _ := json.Marshal(claims)
			c.Request().Header.Set("X-Authenticated-Data", string(claimsJsonStr))
			// continue
			return next(c)
		}
	}
}

// RoleGuard enforces that the authenticated user has one of the required roles.
func RoleGuard(cnt *container.Container, roles ...string) echo.MiddlewareFunc {
	allowed := map[string]bool{}
	for _, r := range roles {
		allowed[strings.ToLower(r)] = true
	}
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ctx := utility.InjectProfile(c)
			prof := utility.GetProfile(ctx)
			if prof.Email == "" {
				c.Set("unauthorized", true)
				return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
			}
			if len(allowed) == 0 {
				return next(c)
			}
			if cnt == nil || cnt.UserService == nil {
				c.Set("forbidden", true)
				return echo.NewHTTPError(http.StatusForbidden, "forbidden")
			}
			doc, _ := cnt.UserService.GetUserByEmail(ctx, prof.Email)
			role := strings.ToLower(prof.Role)
			if doc != nil && doc.UserType != "" {
				role = strings.ToLower(doc.UserType)
			}
			if !allowed[role] {
				c.Set("forbidden", true)
				return echo.NewHTTPError(http.StatusForbidden, "forbidden")
			}
			return next(c)
		}
	}
}
