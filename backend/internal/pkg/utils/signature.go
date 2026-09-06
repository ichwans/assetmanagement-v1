package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

func GenerateHexSHA256Signature(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}
