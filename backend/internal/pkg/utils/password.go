package utils

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/hashicorp/go-uuid"
	"gitlab.com/riski/internal/config"
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(fmt.Sprintf("%s%s", config.GetString("hashKey"), password)), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPasswordHash(hashedPassword, rawPassword string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(fmt.Sprintf("%s%s", config.GetString("hashKey"), rawPassword))) == nil
}

func GenerateInitialPasswordFromName(name string) string {
	str, _ := uuid.GenerateUUID()
	initial := ""
	for _, word := range strings.Split(name, " ") {
		initial += string(word[0])
	}
	return fmt.Sprintf("%sb%s", strings.ToUpper(initial), strings.ReplaceAll(str, "-", ""))[:12]
}

func IsValidPassword(password string) bool {
	regex, _ := regexp.Compile(`^[a-zA-Z0-9]{8,}$`)
	regexUppercase, _ := regexp.Compile(`[A-Z]`)
	return regex.MatchString(password) && regexUppercase.MatchString(password)
}
