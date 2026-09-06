package helper

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"

	"github.com/golang-jwt/jwt"
	"gitlab.com/riski/internal/config"
)

var (
	jwtSecret []byte
)

func init() {
	initializeJWTSecret()
}

func initializeJWTSecret() {
	encodedSecret := config.GetString("jwt.secret")
	var err error
	jwtSecret, err = base64.StdEncoding.DecodeString(encodedSecret)
	if err != nil {
		fmt.Printf("Error decoding JWT secret: %v\n", err)
		return
	}
}

func GenerateJWT(claims map[string]interface{}) (string, error) {
	if jwtSecret == nil {
		initializeJWTSecret()
		if jwtSecret == nil {
			return "", fmt.Errorf("JWT secret is not initialized")
		}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sessionID": claims["sessionID"],
		"exp":       claims["exp"],
		"profile":   claims["profile"],
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT token: %w", err)
	}

	return tokenString, nil
}

func VerifyJWT(ctx context.Context, tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return jwtSecret, nil
	})

	return token, err
}

func GetProfileAndValidateRole(ctx context.Context, requiredRoles []string) (map[string]interface{}, error) {
	profile, ok := ctx.Value("profile").(map[string]interface{})
	if !ok {
		log.Printf("unauthorized access: profile not found in context: %v", ctx)
		return nil, fmt.Errorf("unauthorized access: profile not found")
	}

	// checking role
	role, ok := profile["role"].(string)
	if !ok {
		log.Printf("unauthorized access: invalid role in profile: %v", profile)
		return nil, fmt.Errorf("unauthorized access: invalid role")
	}

	if requiredRoles == nil {
		return profile, nil
	}

	for _, requiredRole := range requiredRoles {
		if role == requiredRole {
			return profile, nil
		}
	}

	log.Printf("unauthorized access: role %s not in required roles %v", role, requiredRoles)
	return nil, fmt.Errorf("unauthorized access: invalid role")
}
