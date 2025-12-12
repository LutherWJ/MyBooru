package database

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"mybooru/internal/models"
)

var (
	ErrNotFound            = errors.New("not found")
	ErrConstraintViolation = errors.New("constraint violation")
)

// GetMediaByID retrieves a single media item by ID
func (db *DB) GetMediaByID(id int64) (*models.Media, error) {
	query := "SELECT * FROM media WHERE id = ?"

	media := &models.Media{}
	err := db.QueryRow(query, id).Scan(
		&media.ID, &media.FilePath, &media.MD5, &media.MediaType, &media.MimeType, &media.FileSize,
		&media.Width, &media.Height, &media.Duration, &media.Codec, &media.Rating, &media.IsFavorite,
		&media.TagCount, &media.TagCountGeneral, &media.TagCountMetadata, &media.TagCountArtist,
		&media.ParentID, &media.HasChildren, &media.SourceURL, &media.CreatedAt, &media.UpdatedAt, &media.LastViewedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get media by ID: %w", err)
	}

	return media, nil
}

// GetAllMedia retrieves all media
func (db *DB) GetAllMedia() ([]*models.Media, error) {
	query := "SELECT * FROM media ORDER BY id"

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query media: %w", err)
	}
	defer rows.Close()

	var mediaList []*models.Media
	for rows.Next() {
		media := &models.Media{}
		err := rows.Scan(
			&media.ID, &media.FilePath, &media.MD5, &media.MediaType, &media.MimeType, &media.FileSize,
			&media.Width, &media.Height, &media.Duration, &media.Codec, &media.Rating, &media.IsFavorite,
			&media.TagCount, &media.TagCountGeneral, &media.TagCountMetadata, &media.TagCountArtist,
			&media.ParentID, &media.HasChildren, &media.SourceURL, &media.CreatedAt, &media.UpdatedAt, &media.LastViewedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan media row: %w", err)
		}
		mediaList = append(mediaList, media)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating media rows: %w", err)
	}

	return mediaList, nil
}

// CreateMedia inserts a new media record
func (db *DB) CreateMedia(input *models.CreateMediaInput) (int64, error) {
	now := time.Now().Unix()

	query := `
		INSERT INTO media (
			file_path, md5, media_type, mime_type, file_size,
			width, height, duration, codec, rating,
			parent_id, source_url, created_at, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		input.FilePath, input.MD5, input.MediaType, input.MimeType, input.FileSize,
		input.Width, input.Height, input.Duration, input.Codec, input.Rating,
		input.ParentID, input.SourceURL, now, now,
	)

	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return 0, fmt.Errorf("%w: media with MD5 %s already exists", ErrConstraintViolation, input.MD5)
		}
		return 0, fmt.Errorf("failed to create media: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert ID: %w", err)
	}

	return id, nil
}

// UpdateMedia updates an existing media record
func (db *DB) UpdateMedia(id int64, input *models.UpdateMediaInput) error {
	setParts := []string{}
	args := []interface{}{}

	if input.Rating != nil {
		setParts = append(setParts, "rating = ?")
		args = append(args, *input.Rating)
	}
	if input.IsFavorite != nil {
		var fav int
		if *input.IsFavorite {
			fav = 1
		}
		setParts = append(setParts, "is_favorite = ?")
		args = append(args, fav)
	}
	if input.ParentID != nil {
		setParts = append(setParts, "parent_id = ?")
		args = append(args, *input.ParentID)
	}
	if input.SourceURL != nil {
		setParts = append(setParts, "source_url = ?")
		args = append(args, *input.SourceURL)
	}

	if len(setParts) == 0 {
		return nil
	}

	setParts = append(setParts, "updated_at = ?")
	args = append(args, time.Now().Unix())

	args = append(args, id)

	query := fmt.Sprintf("UPDATE media SET %s WHERE id = ?", strings.Join(setParts, ", "))

	result, err := db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update media: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

// DeleteMedia deletes a media record by ID
func (db *DB) DeleteMedia(id int64) error {
	result, err := db.Exec("DELETE FROM media WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete media: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

// ToggleFavorite toggles the is_favorite status of a media item
func (db *DB) ToggleFavorite(id int64) (*models.Media, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	var isFavorite bool
	err = tx.QueryRow("SELECT is_favorite FROM media WHERE id = ?", id).Scan(&isFavorite)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get current favorite status: %w", err)
	}

	newFavorite := !isFavorite
	var newFavoriteInt int
	if newFavorite {
		newFavoriteInt = 1
	}

	_, err = tx.Exec("UPDATE media SET is_favorite = ?, updated_at = ? WHERE id = ?",
		newFavoriteInt, time.Now().Unix(), id)
	if err != nil {
		return nil, fmt.Errorf("failed to toggle favorite: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return db.GetMediaByID(id)
}
