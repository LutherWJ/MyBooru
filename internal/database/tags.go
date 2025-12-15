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
		return nil, WrapGetByIDError("tag", err)
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
		return nil, WrapGetByNameError("tag", err)
	}

	return tag, nil
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
		return 0, WrapCreateError("tag", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, WrapLastInsertIDError(err)
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
		return WrapDeleteError("tag", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return WrapRowsAffectedError(err)
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
		return nil, WrapQueryError("media tags", err)
	}
	defer rows.Close()

	var tags []*models.Tag
	for rows.Next() {
		tag := &models.Tag{}
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Category, &tag.UsageCount, &tag.CreatedAt)
		if err != nil {
			return nil, WrapScanError("tag", err)
		}
		tags = append(tags, tag)
	}

	if err = rows.Err(); err != nil {
		return nil, WrapIterationError("tag", err)
	}

	return tags, nil
}

// addTagsToMediaWithTx is the core logic for adding tags within an existing transaction
func addTagsToMediaWithTx(tx *sql.Tx, mediaID int64, tags []models.CreateTagInput) error {
	now := time.Now().Unix()

	for _, tag := range tags {
		// Get or create tag
		var tagID int64
		err := tx.QueryRow("SELECT id FROM tags WHERE name = ? COLLATE NOCASE", tag.Name).Scan(&tagID)
		if err == sql.ErrNoRows {
			result, err := tx.Exec("INSERT INTO tags (name, category, created_at) VALUES (?, ?, ?)",
				tag.Name, tag.Category, now)
			if err != nil {
				if !strings.Contains(err.Error(), "UNIQUE constraint failed") {
					return fmt.Errorf("failed to create tag %s: %w", tag.Name, err)
				}
				// Race condition: tag was created by another transaction, query again
				err = tx.QueryRow("SELECT id FROM tags WHERE name = ? COLLATE NOCASE", tag.Name).Scan(&tagID)
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
			mediaID, tagID, now)
		if err != nil {
			return fmt.Errorf("failed to add tag %s to media: %w", tag.Name, err)
		}
	}

	return nil
}

// AddTagsToMediaTx associates multiple tags with a media item
func (db *DB) AddTagsToMediaTx(mediaID int64, tags []models.CreateTagInput) error {
	tx, err := db.Begin()
	if err != nil {
		return WrapTransactionBeginError(err)
	}
	defer tx.Rollback()

	if err := addTagsToMediaWithTx(tx, mediaID, tags); err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return WrapTransactionCommitError(err)
	}

	return nil
}

// AddTagsToMediaInTx adds tags to media within an existing transaction (for external callers)
func AddTagsToMediaInTx(tx *sql.Tx, mediaID int64, tags []models.CreateTagInput) error {
	return addTagsToMediaWithTx(tx, mediaID, tags)
}

// RemoveTagFromMedia removes a tag association from a media item
func (db *DB) RemoveTagFromMedia(mediaID, tagID int64) error {
	result, err := db.Exec("DELETE FROM media_tags WHERE media_id = ? AND tag_id = ?", mediaID, tagID)
	if err != nil {
		return WrapExecError("remove tag from media", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return WrapRowsAffectedError(err)
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

// GetMediaByTag retrieves all media items with a specific tag
func (db *DB) GetMediaByTag(tagID int64, limit, offset int) ([]*models.Media, error) {
	query := `
		SELECT m.id, m.md5, m.file_ext, m.media_type, m.mime_type, m.file_size,
		       m.width, m.height, m.duration, m.codec, m.rating, m.is_favorite,
		       m.tag_count, m.tag_count_general, m.tag_count_artist, m.tag_count_copyright,
		       m.tag_count_character, m.tag_count_metadata,
		       m.parent_id, m.has_children, m.source_url, m.created_at, m.updated_at, m.last_viewed_at
		FROM media m
		JOIN media_tags mt ON m.id = mt.media_id
		WHERE mt.tag_id = ?
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, tagID, limit, offset)
	if err != nil {
		return nil, WrapQueryError("media by tag", err)
	}
	defer rows.Close()

	var mediaList []*models.Media
	for rows.Next() {
		media := &models.Media{}
		err := rows.Scan(
			&media.ID, &media.MD5, &media.FileExt, &media.MediaType, &media.MimeType, &media.FileSize,
			&media.Width, &media.Height, &media.Duration, &media.Codec, &media.Rating, &media.IsFavorite,
			&media.TagCount, &media.TagCountGeneral, &media.TagCountArtist, &media.TagCountCopyright,
			&media.TagCountCharacter, &media.TagCountMetadata,
			&media.ParentID, &media.HasChildren, &media.SourceURL, &media.CreatedAt, &media.UpdatedAt, &media.LastViewedAt,
		)
		if err != nil {
			return nil, WrapScanError("media", err)
		}
		mediaList = append(mediaList, media)
	}

	if err = rows.Err(); err != nil {
		return nil, WrapIterationError("media", err)
	}

	return mediaList, nil
}
