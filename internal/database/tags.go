package database

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"mybooru/internal/models"
)

// GetTagByID retrieves a single tag by ID
func (db *DB) GetTagByID(id int64) (*models.Tag, error) {
	query := `SELECT id, name, category, usage_count, created_at FROM tags WHERE id = ?`

	tag := &models.Tag{}
	err := db.QueryRow(query, id).Scan(&tag.ID, &tag.Name, &tag.Category, &tag.UsageCount, &tag.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tag by ID: %w", err)
	}

	return tag, nil
}

// GetTagByName retrieves a single tag by name (case-insensitive)
func (db *DB) GetTagByName(name string) (*models.Tag, error) {
	query := `SELECT id, name, category, usage_count, created_at FROM tags WHERE name = ? COLLATE NOCASE`

	tag := &models.Tag{}
	err := db.QueryRow(query, name).Scan(&tag.ID, &tag.Name, &tag.Category, &tag.UsageCount, &tag.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tag by name: %w", err)
	}

	return tag, nil
}

// GetAllTags retrieves all tags with pagination
func (db *DB) GetAllTags(limit, offset int) ([]*models.Tag, error) {
	query := `
		SELECT id, name, category, usage_count, created_at
		FROM tags
		ORDER BY usage_count DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query tags: %w", err)
	}
	defer rows.Close()

	var tags []*models.Tag
	for rows.Next() {
		tag := &models.Tag{}
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Category, &tag.UsageCount, &tag.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tag row: %w", err)
		}
		tags = append(tags, tag)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tag rows: %w", err)
	}

	return tags, nil
}

// SearchTags searches for tags by pattern
func (db *DB) SearchTags(pattern string, limit int) ([]*models.Tag, error) {
	query := `
		SELECT id, name, category, usage_count, created_at
		FROM tags
		WHERE name LIKE ? COLLATE NOCASE
		ORDER BY usage_count DESC
		LIMIT ?
	`

	searchPattern := "%" + pattern + "%"
	rows, err := db.Query(query, searchPattern, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search tags: %w", err)
	}
	defer rows.Close()

	var tags []*models.Tag
	for rows.Next() {
		tag := &models.Tag{}
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Category, &tag.UsageCount, &tag.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tag row: %w", err)
		}
		tags = append(tags, tag)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tag rows: %w", err)
	}

	return tags, nil
}

// CreateTag creates a new tag
func (db *DB) CreateTag(input *models.CreateTagInput) (int64, error) {
	now := time.Now().Unix()

	query := `INSERT INTO tags (name, category, created_at) VALUES (?, ?, ?)`

	result, err := db.Exec(query, input.Name, input.Category, now)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return 0, fmt.Errorf("%w: tag with name %s already exists", ErrConstraintViolation, input.Name)
		}
		return 0, fmt.Errorf("failed to create tag: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert ID: %w", err)
	}

	return id, nil
}

// GetOrCreateTag gets an existing tag or creates it if it doesn't exist
func (db *DB) GetOrCreateTag(name string, category models.TagCategory) (*models.Tag, error) {
	tag, err := db.GetTagByName(name)
	if err == nil {
		return tag, nil
	}
	if err != ErrNotFound {
		return nil, err
	}

	id, err := db.CreateTag(&models.CreateTagInput{
		Name:     name,
		Category: category,
	})
	if err != nil {
		return nil, err
	}

	return db.GetTagByID(id)
}

// DeleteTag deletes a tag by ID
func (db *DB) DeleteTag(id int64) error {
	result, err := db.Exec("DELETE FROM tags WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete tag: %w", err)
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

// GetTagsForMedia retrieves all tags for a given media item
func (db *DB) GetTagsForMedia(mediaID int64) ([]*models.Tag, error) {
	query := `
		SELECT t.id, t.name, t.category, t.usage_count, t.created_at
		FROM tags t
		JOIN media_tags mt ON t.id = mt.tag_id
		WHERE mt.media_id = ?
		ORDER BY t.category, t.name
	`

	rows, err := db.Query(query, mediaID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tags for media: %w", err)
	}
	defer rows.Close()

	var tags []*models.Tag
	for rows.Next() {
		tag := &models.Tag{}
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Category, &tag.UsageCount, &tag.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tag row: %w", err)
		}
		tags = append(tags, tag)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tag rows: %w", err)
	}

	return tags, nil
}

// AddTagToMedia associates a tag with a media item
func (db *DB) AddTagToMedia(mediaID, tagID int64) error {
	now := time.Now().Unix()

	query := `INSERT INTO media_tags (media_id, tag_id, created_at) VALUES (?, ?, ?)`

	_, err := db.Exec(query, mediaID, tagID, now)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil // Already tagged, silently succeed
		}
		if strings.Contains(err.Error(), "FOREIGN KEY constraint failed") {
			return ErrNotFound
		}
		return fmt.Errorf("failed to add tag to media: %w", err)
	}

	return nil
}

// AddTagsToMedia associates multiple tags with a media item
func (db *DB) AddTagsToMedia(mediaID int64, tagNames []string) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, tagName := range tagNames {
		// Get or create tag
		var tagID int64
		err := tx.QueryRow("SELECT id FROM tags WHERE name = ? COLLATE NOCASE", tagName).Scan(&tagID)
		if err == sql.ErrNoRows {
			// Create tag if it doesn't exist
			result, err := tx.Exec("INSERT INTO tags (name, category, created_at) VALUES (?, ?, ?)",
				tagName, models.TagCategoryGeneral, time.Now().Unix())
			if err != nil {
				if !strings.Contains(err.Error(), "UNIQUE constraint failed") {
					return fmt.Errorf("failed to create tag %s: %w", tagName, err)
				}
				// Race condition: tag was created by another transaction, query again
				err = tx.QueryRow("SELECT id FROM tags WHERE name = ? COLLATE NOCASE", tagName).Scan(&tagID)
				if err != nil {
					return fmt.Errorf("failed to get tag ID after creation: %w", err)
				}
			} else {
				tagID, err = result.LastInsertId()
				if err != nil {
					return fmt.Errorf("failed to get last insert ID: %w", err)
				}
			}
		} else if err != nil {
			return fmt.Errorf("failed to query tag: %w", err)
		}

		// Add tag to media
		_, err = tx.Exec("INSERT OR IGNORE INTO media_tags (media_id, tag_id, created_at) VALUES (?, ?, ?)",
			mediaID, tagID, time.Now().Unix())
		if err != nil {
			return fmt.Errorf("failed to add tag %s to media: %w", tagName, err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// RemoveTagFromMedia removes a tag association from a media item
func (db *DB) RemoveTagFromMedia(mediaID, tagID int64) error {
	result, err := db.Exec("DELETE FROM media_tags WHERE media_id = ? AND tag_id = ?", mediaID, tagID)
	if err != nil {
		return fmt.Errorf("failed to remove tag from media: %w", err)
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

// GetMediaByTag retrieves all media items with a specific tag
func (db *DB) GetMediaByTag(tagID int64, limit, offset int) ([]*models.Media, error) {
	query := `
		SELECT m.id, m.file_path, m.md5, m.media_type, m.mime_type, m.file_size,
		       m.width, m.height, m.duration, m.codec, m.rating, m.is_favorite,
		       m.tag_count, m.tag_count_general, m.tag_count_metadata, m.tag_count_artist,
		       m.parent_id, m.has_children, m.source_url, m.created_at, m.updated_at, m.last_viewed_at
		FROM media m
		JOIN media_tags mt ON m.id = mt.media_id
		WHERE mt.tag_id = ?
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, tagID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get media by tag: %w", err)
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
