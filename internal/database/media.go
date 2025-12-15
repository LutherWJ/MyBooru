package database

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"mybooru/internal/models"
)

// GetMediaByID retrieves a single media item by ID
func (db *DB) GetMediaByID(id int64) (*models.Media, error) {
	query := "SELECT * FROM media WHERE id = ?"

	media := &models.Media{}
	err := db.QueryRow(query, id).Scan(
		&media.ID, &media.MD5, &media.FileExt, &media.MediaType, &media.MimeType, &media.FileSize,
		&media.Width, &media.Height, &media.Duration, &media.Codec, &media.Rating, &media.IsFavorite,
		&media.TagCount, &media.TagCountGeneral, &media.TagCountArtist, &media.TagCountCopyright,
		&media.TagCountCharacter, &media.TagCountMetadata,
		&media.ParentID, &media.HasChildren, &media.SourceURL, &media.CreatedAt, &media.UpdatedAt, &media.LastViewedAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, WrapGetByIDError("media", err)
	}

	return media, nil
}

// GetAllMedia retrieves all media
func (db *DB) GetAllMedia() ([]*models.Media, error) {
	query := "SELECT * FROM media ORDER BY id"

	rows, err := db.Query(query)
	if err != nil {
		return nil, WrapQueryError("media", err)
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

// CreateMedia inserts a new media record
func (db *DB) CreateMedia(input *models.CreateMediaInput) (int64, error) {
	now := time.Now().Unix()

	query := `
		INSERT INTO media (
			md5, file_ext, media_type, mime_type, file_size,
			width, height, duration, codec, rating,
			parent_id, source_url, created_at, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		input.MD5, input.FileExt, input.MediaType, input.MimeType, input.FileSize,
		input.Width, input.Height, input.Duration, input.Codec, input.Rating,
		input.ParentID, input.SourceURL, now, now,
	)

	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return 0, fmt.Errorf("%w: media with MD5 %s already exists", ErrConstraintViolation, input.MD5)
		}
		return 0, WrapCreateError("media", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, WrapLastInsertIDError(err)
	}

	return id, nil
}

// UpdateMedia updates an existing media record
func (db *DB) UpdateMedia(id int64, input *models.UpdateMediaInput) error {
	var setParts []string
	var args []interface{}

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
		return WrapUpdateError("media", err)
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

// DeleteMedia deletes a media record by ID
func (db *DB) DeleteMedia(id int64) error {
	result, err := db.Exec("DELETE FROM media WHERE id = ?", id)
	if err != nil {
		return WrapDeleteError("media", err)
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

// ToggleFavorite toggles the is_favorite status of a media item
func (db *DB) ToggleFavorite(id int64) (*models.Media, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, WrapTransactionBeginError(err)
	}
	defer tx.Rollback()

	var isFavorite bool
	err = tx.QueryRow("SELECT is_favorite FROM media WHERE id = ?", id).Scan(&isFavorite)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, WrapQueryError("media favorite status", err)
	}

	newFavorite := !isFavorite
	var newFavoriteInt int
	if newFavorite {
		newFavoriteInt = 1
	}

	_, err = tx.Exec("UPDATE media SET is_favorite = ?, updated_at = ? WHERE id = ?",
		newFavoriteInt, time.Now().Unix(), id)
	if err != nil {
		return nil, WrapExecError("toggle favorite", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, WrapTransactionCommitError(err)
	}

	return db.GetMediaByID(id)
}

func (db *DB) GetMediaBySearch(query *models.SearchQuery) (*models.SearchResult, error) {
	sqlQuery := "SELECT DISTINCT m.* FROM media m"
	var args []interface{}
	var whereClauses []string

	// For each included tag, join mediatags to ensure ALL tags exist (AND logic)
	// Each tag gets its own JOIN with a unique alias
	for i, tag := range query.IncludeTags {
		mtAlias := fmt.Sprintf("mt_inc_%d", i)
		tAlias := fmt.Sprintf("t_inc_%d", i)

		sqlQuery += fmt.Sprintf(" INNER JOIN media_tags %s ON m.id = %s.media_id", mtAlias, mtAlias)
		sqlQuery += fmt.Sprintf(" INNER JOIN tags %s ON %s.tag_id = %s.id", tAlias, mtAlias, tAlias)
		whereClauses = append(whereClauses, fmt.Sprintf("%s.name = ?", tAlias))
		args = append(args, tag)
	}

	// Excluded tags
	for _, tag := range query.ExcludeTags {
		whereClauses = append(whereClauses, `NOT EXISTS (
			SELECT 1 FROM media_tags mt_exc
			JOIN tags t_exc ON mt_exc.tag_id = t_exc.id
			WHERE mt_exc.media_id = m.id AND t_exc.name = ?
		)`)
		args = append(args, tag)
	}

	// Optional filters
	if query.IsFavorite != nil {
		var fav int
		if *query.IsFavorite {
			fav = 1
		}
		whereClauses = append(whereClauses, "m.is_favorite = ?")
		args = append(args, fav)
	}

	if len(query.Rating) > 0 {
		var ratingPlaceholders []string
		for _, rating := range query.Rating {
			ratingPlaceholders = append(ratingPlaceholders, "?")
			args = append(args, rating)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("m.rating IN (%s)", strings.Join(ratingPlaceholders, ", ")))
	}

	if len(query.MediaTypes) > 0 {
		var typePlaceholders []string
		for _, mediaType := range query.MediaTypes {
			typePlaceholders = append(typePlaceholders, "?")
			args = append(args, mediaType)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("m.media_type IN (%s)", strings.Join(typePlaceholders, ", ")))
	}

	if query.MinWidth != nil {
		whereClauses = append(whereClauses, "m.width >= ?")
		args = append(args, *query.MinWidth)
	}
	if query.MaxWidth != nil {
		whereClauses = append(whereClauses, "m.width <= ?")
		args = append(args, *query.MaxWidth)
	}
	if query.MinHeight != nil {
		whereClauses = append(whereClauses, "m.height >= ?")
		args = append(args, *query.MinHeight)
	}
	if query.MaxHeight != nil {
		whereClauses = append(whereClauses, "m.height <= ?")
		args = append(args, *query.MaxHeight)
	}

	if query.MinFileSize != nil {
		whereClauses = append(whereClauses, "m.file_size >= ?")
		args = append(args, *query.MinFileSize)
	}
	if query.MaxFileSize != nil {
		whereClauses = append(whereClauses, "m.file_size <= ?")
		args = append(args, *query.MaxFileSize)
	}

	if query.HasParent != nil {
		if *query.HasParent {
			whereClauses = append(whereClauses, "m.parent_id IS NOT NULL")
		} else {
			whereClauses = append(whereClauses, "m.parent_id IS NULL")
		}
	}

	if query.HasChildren != nil {
		whereClauses = append(whereClauses, "m.has_children = ?")
		var hasChildren int
		if *query.HasChildren {
			hasChildren = 1
		}
		args = append(args, hasChildren)
	}

	if query.ParentID != nil {
		whereClauses = append(whereClauses, "m.parent_id = ?")
		args = append(args, *query.ParentID)
	}

	if query.CreatedAfter != nil {
		whereClauses = append(whereClauses, "m.created_at >= ?")
		args = append(args, query.CreatedAfter.Unix())
	}
	if query.CreatedBefore != nil {
		whereClauses = append(whereClauses, "m.created_at <= ?")
		args = append(args, query.CreatedBefore.Unix())
	}

	// Apply cursor-based pagination filters (priority: BeforeID > AfterID)
	if query.BeforeID != nil {
		// Next page: get items before this ID (older items)
		whereClauses = append(whereClauses, "m.id < ?")
		args = append(args, *query.BeforeID)
	} else if query.AfterID != nil {
		// Previous page: get items after this ID (newer items)
		whereClauses = append(whereClauses, "m.id > ?")
		args = append(args, *query.AfterID)
	}

	// Build WHERE clause once for both count and main query
	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count total results (excluding pagination)
	countQuery := "SELECT COUNT(DISTINCT m.id) FROM media m"
	for i := range query.IncludeTags {
		mtAlias := fmt.Sprintf("mt_inc_%d", i)
		tAlias := fmt.Sprintf("t_inc_%d", i)
		countQuery += fmt.Sprintf(" INNER JOIN media_tags %s ON m.id = %s.media_id", mtAlias, mtAlias)
		countQuery += fmt.Sprintf(" INNER JOIN tags %s ON %s.tag_id = %s.id", tAlias, mtAlias, tAlias)
	}
	countQuery += whereClause

	var totalCount int64
	err := db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, WrapQueryError("media count", err)
	}

	// Add WHERE and ORDER BY to main query
	sqlQuery += whereClause
	sqlQuery += " ORDER BY m.created_at DESC"

	// Determine limit (default: 20)
	limit := query.Limit
	if limit <= 0 {
		limit = 20
	}

	// Apply pagination (priority: BeforeID > AfterID > Offset)
	if query.BeforeID != nil || query.AfterID != nil {
		sqlQuery += " LIMIT ?"
		args = append(args, limit+1)
	} else if query.Offset > 0 {
		sqlQuery += " LIMIT ? OFFSET ?"
		args = append(args, limit+1, query.Offset)
	} else {
		// Default: first page
		sqlQuery += " LIMIT ?"
		args = append(args, limit+1)
	}

	rows, err := db.Query(sqlQuery, args...)
	if err != nil {
		return nil, WrapQueryError("media search", err)
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
			return nil, WrapScanError("media search", err)
		}
		mediaList = append(mediaList, media)
	}

	if err = rows.Err(); err != nil {
		return nil, WrapIterationError("media search", err)
	}

	// Determine if there are more results
	hasMore := len(mediaList) > limit
	if hasMore {
		mediaList = mediaList[:limit]
	}

	var firstID, lastID int64
	if len(mediaList) > 0 {
		firstID = mediaList[0].ID
		lastID = mediaList[len(mediaList)-1].ID
	}

	return &models.SearchResult{
		Media:      mediaList,
		TotalCount: totalCount,
		FirstID:    firstID,
		LastID:     lastID,
		HasMore:    hasMore,
	}, nil
}
