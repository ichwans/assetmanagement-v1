package utils

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/labstack/echo/v4"
)

type (
	Profile struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Role  string `json:"role"`
	}
)

func InjectProfile(c echo.Context) (ctx context.Context) {
	ctx = c.Request().Context()
	ctx = context.WithValue(ctx, "profile", c.Request().Header.Get("X-Authenticated-Data"))
	ctx = context.WithValue(ctx, "platform", c.Request().Header.Get("platform"))
	return
}

func GetProfile(ctx context.Context) Profile {
	profileData, ok := ctx.Value("profile").(string)
	if !ok || profileData == "" {
		fmt.Println("Invalid or missing user data in context")
		return Profile{}
	}
	fmt.Println(profileData)
	var wrapper Profile
	err := json.Unmarshal([]byte(profileData), &wrapper)
	if err != nil {
		fmt.Printf("Failed to unmarshal user data: %v\n", err)
		return Profile{}
	}

	return wrapper
}
