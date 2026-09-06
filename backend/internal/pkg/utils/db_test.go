package utils

import (
	"strings"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type testUser struct {
	ID   int
	Name string
}

func TestCompileCondsBuildsSQL(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	db = db.Session(&gorm.Session{DryRun: true})

	query := CompileConds(db, DBCond{Where: "name = ?", WhereArgs: "Alice"}, DBCond{Order: "id desc"})
	var users []testUser
	if err := query.Find(&users).Error; err != nil {
		t.Fatalf("query failed: %v", err)
	}

	sql := query.Statement.SQL.String()
	if !strings.Contains(sql, "WHERE") {
		t.Fatalf("expected WHERE clause in SQL, got %q", sql)
	}
	if !strings.Contains(strings.ToUpper(sql), "ORDER BY") {
		t.Fatalf("expected ORDER BY clause in SQL, got %q", sql)
	}
}
