package main

import (
"fmt"
"golang.org/x/crypto/bcrypt"
)

func main() {
// ichwan@ipmi.ac.id logged in successfully with password Rawajati1
// We know it works now. Let's find the hashKey used.
ichwanHash := "$2a$10$WyTSS6DBqJLUbVM9xKsbl.47lX1OmwbD6fgKxQtZjsx9xse191LNK"
ichwanPwd  := "Rawajati1"

adminHash := "$2a$10$FdmjMjFFUwikxKhTp5DLJeVp2OiFvX1wS5xxuQGwapCZtvtVww192"
adminPwd  := "Secret123"

keys := []string{
"",
"your-hash-salt-key-change-this-in-production",
"salt",
"secret",
"assethub",
"asset-hub",
"AssetHub",
"IPMI",
"ipmi",
"ipmi.ac.id",
}

fmt.Println("=== Testing ichwan@ipmi.ac.id with password Rawajati1 ===")
for _, key := range keys {
combined := key + ichwanPwd
err := bcrypt.CompareHashAndPassword([]byte(ichwanHash), []byte(combined))
if err == nil {
fmt.Printf("MATCH! hashKey=%q\n", key)
}
}

fmt.Println("\n=== Testing admin@assethub.com with password Secret123 ===")
for _, key := range keys {
combined := key + adminPwd
err := bcrypt.CompareHashAndPassword([]byte(adminHash), []byte(combined))
if err == nil {
fmt.Printf("MATCH! hashKey=%q\n", key)
}
}
}
