package mail

import (
	"crypto/tls"
	"fmt"
	"log"
	"strconv"

	"gitlab.com/riski/internal/config"
	"gopkg.in/gomail.v2"
)

// Send sends a plaintext email using settings from config; supports TLS.
func Send(to, subject, body string) error {
	host := config.GetString("smtp.host")
	portStr := config.GetString("smtp.port")
	user := config.GetString("smtp.user")
	pass := config.GetString("smtp.pass")
	from := config.GetString("smtp.from")

	// debug logging to verify values (password length shown, not value)
	logInfo := func(k, v string) {
		if v == "" {
			log.Printf("[mail] %s is empty", k)
		} else {
			log.Printf("[mail] %s=%s", k, v)
		}
	}
	logInfo("smtp.host", host)
	logInfo("smtp.port", portStr)
	logInfo("smtp.user", user)
	logInfo("smtp.from", from)
	log.Printf("[mail] smtp.pass length=%d (len=%d chars)", len(pass), len(pass))

	if host == "" || portStr == "" || user == "" || pass == "" || from == "" {
		return fmt.Errorf("smtp configuration missing")
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return fmt.Errorf("invalid smtp port: %v", err)
	}

	msg := gomail.NewMessage()
	msg.SetHeader("From", from)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/plain", body)

	dialer := gomail.NewDialer(host, port, user, pass)
	// Gmail requires TLS
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: false, ServerName: host}

	if err := dialer.DialAndSend(msg); err != nil {
		log.Printf("[mail] ERROR sending to %s: %v", to, err)
		return err
	}
	log.Printf("[mail] SUCCESS sent to %s", to)
	return nil
}
