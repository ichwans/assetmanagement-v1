package utils

import (
	"strings"
	"time"
)

func GetDateInIndonesia(rawTime time.Time) string {
	t := rawTime.Format("02 01 2006")
	ts := strings.Split(t, " ")
	switch ts[1] {
	case "01":
		ts[1] = "Januari"
	case "02":
		ts[1] = "Februari"
	case "03":
		ts[1] = "Maret"
	case "04":
		ts[1] = "April"
	case "05":
		ts[1] = "Mei"
	case "06":
		ts[1] = "Juni"
	case "07":
		ts[1] = "Juli"
	case "08":
		ts[1] = "Agustus"
	case "09":
		ts[1] = "September"
	case "10":
		ts[1] = "Oktober"
	case "11":
		ts[1] = "November"
	case "12":
		ts[1] = "Desember"
	}
	return strings.Join(ts, " ")
}
