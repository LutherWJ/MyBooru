package database

import (
	"database/sql"
	"fmt"
	"testing"
)

func SetupTestDB(t *testing.T) *DB {
	t.Helper()

	db, err := sql.Open("sqlite3", ":memory:?_foreign_keys=on")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	if err := configurePragmas(db); err != nil {
		t.Fatalf("Failed to configure pragmas: %v", err)
	}

	if err := initializeSchema(db); err != nil {
		t.Fatalf("Failed to initialize schema: %v", err)
	}

	dbInstance := &DB{DB: db}

	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Errorf("Failed to close test database: %v", err)
		}
	})

	return dbInstance
}

func AssertNoError(t *testing.T, err error, msg string) {
	t.Helper()
	if err != nil {
		t.Fatalf("%s: %v", msg, err)
	}
}

func AssertError(t *testing.T, err error, msg string) {
	t.Helper()
	if err == nil {
		t.Fatalf("%s: expected error but got nil", msg)
	}
}

func AssertEqual(t *testing.T, got, want interface{}, msg string) {
	t.Helper()
	if fmt.Sprintf("%v", got) != fmt.Sprintf("%v", want) {
		t.Errorf("%s:\ngot:  %v\nwant: %v", msg, got, want)
	}
}
