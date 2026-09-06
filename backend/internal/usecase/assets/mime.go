package assets

func sniffMime(head []byte) string {
	if len(head) >= 3 {
		if head[0] == 0xFF && head[1] == 0xD8 && head[2] == 0xFF {
			return "image/jpeg"
		}
	}
	if len(head) >= 8 {
		sig := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
		ok := true
		for i := 0; i < 8; i++ {
			if head[i] != sig[i] {
				ok = false
				break
			}
		}
		if ok {
			return "image/png"
		}
	}
	if len(head) >= 5 {
		if head[0] == '%' && head[1] == 'P' && head[2] == 'D' && head[3] == 'F' && head[4] == '-' {
			return "application/pdf"
		}
	}
	return "unknown"
}

func allowedForType(docType, mime string) bool {
	switch toLower(docType) {
	case "handover", "handover_borrow", "handover_return", "image":
		return mime == "image/jpeg" || mime == "image/png"
	case "maintenance_receipt", "invoice":
		return mime == "image/jpeg" || mime == "image/png" || mime == "application/pdf"
	default:
		return mime == "image/jpeg" || mime == "image/png" || mime == "application/pdf"
	}
}

func toLower(s string) string {
	b := []byte(s)
	for i, c := range b {
		if 'A' <= c && c <= 'Z' {
			b[i] = c + 32
		}
	}
	return string(b)
}
