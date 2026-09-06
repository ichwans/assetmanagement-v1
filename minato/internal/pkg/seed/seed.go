package seed

import "database/sql"

type Seed struct {
	Name string
	Run  func(db *sql.Tx) error
}
