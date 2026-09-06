package helper

import "math/rand"

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func RandString(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

func ContainsValue(list []string, target string) bool {
	// Return false if the slice is nil
	if list == nil {
		return false
	}

	// Iterate through the slice to find the target email
	for _, value := range list {
		if value == target {
			return true
		}
	}
	return false
}
