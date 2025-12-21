package database

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

// DB wraps the SQLite database connection
type DB struct {
	*sql.DB
}

// InitDB initializes the database connection and creates tables
func InitDB(path string) (*DB, error) {
	db, err := sql.Open("sqlite3", path+"?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := configurePragmas(db); err != nil {
		db.Close()
		return nil, err
	}

	if err := initializeSchema(db); err != nil {
		db.Close()
		return nil, err
	}

	return &DB{db}, nil
}

// configurePragmas sets up SQLite pragmas for optimal performance
func configurePragmas(db *sql.DB) error {
	pragmas := []string{
		"PRAGMA journal_mode = WAL",
		"PRAGMA synchronous = NORMAL",
		"PRAGMA foreign_keys = ON",
		"PRAGMA temp_store = MEMORY",
		"PRAGMA cache_size = -64000", // 64MB cache
	}

	for _, pragma := range pragmas {
		if _, err := db.Exec(pragma); err != nil {
			return fmt.Errorf("failed to set pragma '%s': %w", pragma, err)
		}
	}

	return nil
}

// initializeSchema creates all tables, indexes, and triggers
func initializeSchema(db *sql.DB) error {
	if _, err := db.Exec(createTablesSQL); err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}
	return nil
}

// Runs ANALYZE to update query planner statistics
func (db *DB) Analyze() error {
	_, err := db.Exec("ANALYZE")
	return err
}

// Runs VACUUM to reclaim space and optimize
func (db *DB) Vacuum() error {
	_, err := db.Exec("VACUUM")
	return err
}

// Checks database integrity
func (db *DB) CheckIntegrity() (bool, error) {
	var result string
	err := db.QueryRow("PRAGMA integrity_check").Scan(&result)
	if err != nil {
		return false, err
	}
	return result == "ok", nil
}

// Stats represents database statistics
type Stats struct {
	MediaCount       int64
	TagCount         int64
	ViewHistoryCount int64
	TotalFileSize    int64
}

// GetStats returns database statistics
func (db *DB) GetStats() (*Stats, error) {
	stats := &Stats{}

	err := db.QueryRow("SELECT COUNT(*) FROM media").Scan(&stats.MediaCount)
	if err != nil {
		return nil, WrapQueryError("media count", err)
	}

	err = db.QueryRow("SELECT COUNT(*) FROM tags").Scan(&stats.TagCount)
	if err != nil {
		return nil, WrapQueryError("tag count", err)
	}

	err = db.QueryRow("SELECT COUNT(*) FROM view_history").Scan(&stats.ViewHistoryCount)
	if err != nil {
		return nil, WrapQueryError("view history count", err)
	}

	err = db.QueryRow("SELECT COALESCE(SUM(file_size), 0) FROM media").Scan(&stats.TotalFileSize)
	if err != nil {
		return nil, WrapQueryError("total file size", err)
	}

	return stats, nil
}
