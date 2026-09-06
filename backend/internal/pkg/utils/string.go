package utils

import (
	"fmt"
	"regexp"
	"strings"
)

func ExtractEKYCStatus(status string, input string) string {
	rgx := regexp.MustCompile(fmt.Sprintf(`%s::(?:[a-zA-Z0-9_]+:)?(.+)`, status)) // Extracts the section after the last colon
	matches := rgx.FindStringSubmatch(input)
	if len(matches) > 1 {
		return matches[1]
	}
	return input
}

func BuildURL(parts ...string) string {
	cleaned := make([]string, 0, len(parts))
	for i, part := range parts {
		part = strings.TrimSpace(part)

		if i == 0 {
			part = strings.TrimRight(part, "/")
		} else {
			part = strings.Trim(part, "/")
		}

		cleaned = append(cleaned, part)
	}

	return strings.Join(cleaned, "/")
}

// StringInSlice mengecek apakah string target ada di dalam slice string.
func StringInSlice(target string, list []string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}

// StringInSliceInsensitive mengecek apakah string target (case-insensitive) ada di dalam slice string.
func StringInSliceInsensitive(target string, list []string) bool {
	target = strings.ToLower(target)
	for _, item := range list {
		if strings.ToLower(item) == target {
			return true
		}
	}
	return false
}

// StringContainsInSlice mengecek apakah target mengandung salah satu string dari slice.
func StringContainsInSlice(target string, list []string) bool {
	for _, item := range list {
		if strings.Contains(target, item) {
			return true
		}
	}
	return false
}
