package models

import (
	"database/sql"
	"time"
)

// MediaType represents the type of media file
type MediaType string

const (
	MediaTypeImage MediaType = "image"
	MediaTypeVideo MediaType = "video"
	MediaTypeAudio MediaType = "audio"
)

// Rating represents content rating
type Rating string

const (
	RatingSafe         Rating = "safe"
	RatingQuestionable Rating = "questionable"
	RatingExplicit     Rating = "explicit"
)

// TagCategory represents the category of a tag
type TagCategory int

const (
	TagCategoryGeneral   TagCategory = 0
	TagCategoryArtist    TagCategory = 1
	TagCategoryCopyright TagCategory = 2
	TagCategoryCharacter TagCategory = 3
	TagCategoryMetadata  TagCategory = 4
)

// Media represents a media file in the database
type Media struct {
	ID                int64
	MD5               string
	FileExt           string
	MediaType         MediaType
	MimeType          string
	FileSize          int64
	Width             sql.NullInt64
	Height            sql.NullInt64
	Duration          sql.NullFloat64
	Codec             sql.NullString
	Rating            Rating
	IsFavorite        bool
	TagCount          int
	TagCountGeneral   int
	TagCountArtist    int
	TagCountCopyright int
	TagCountCharacter int
	TagCountMetadata  int
	ParentID          sql.NullInt64
	HasChildren       bool
	SourceURL         sql.NullString
	CreatedAt         int64
	UpdatedAt         int64
	LastViewedAt      sql.NullInt64
}

// Tag represents a tag in the database
type Tag struct {
	ID         int64
	Name       string
	Category   TagCategory
	UsageCount int
	CreatedAt  int64
}

// MediaTag represents the junction table between media and tags
type MediaTag struct {
	ID        int64
	MediaID   int64
	TagID     int64
	CreatedAt int64
}

// ViewHistory represents a view history entry
type ViewHistory struct {
	ID           int64
	MediaID      int64
	ViewedAt     int64
	ViewDuration sql.NullInt64
	SessionID    sql.NullString
}

// TagAlias represents a tag alias
type TagAlias struct {
	ID             int64
	AntecedentName string
	ConsequentName string
	CreatedAt      int64
}

// TagImplication represents a tag implication rule
type TagImplication struct {
	ID          int64
	ChildTagID  int64
	ParentTagID int64
	CreatedAt   int64
}

// SearchHistory represents a search query history entry
type SearchHistory struct {
	ID          int64
	Query       string
	ResultCount int
	SearchedAt  int64
}

// SavedSearch represents a saved search query
type SavedSearch struct {
	ID         int64
	Name       string
	Query      string
	CreatedAt  int64
	LastUsedAt sql.NullInt64
}

// Collection represents a media collection
type Collection struct {
	ID          int64
	Name        string
	Description sql.NullString
	CreatedAt   int64
}

// CollectionMedia represents the junction table for collections and media
type CollectionMedia struct {
	CollectionID int64
	MediaID      int64
	Position     int
}

// CreateMediaInput represents input for creating new media
type CreateMediaInput struct {
	MD5       string
	FileExt   string
	MediaType MediaType
	MimeType  string
	FileSize  int64
	Width     *int64
	Height    *int64
	Duration  *float64
	Codec     *string
	Rating    Rating
	ParentID  *int64
	SourceURL *string
}

// UpdateMediaInput represents input for updating media
type UpdateMediaInput struct {
	Rating     *Rating
	IsFavorite *bool
	ParentID   *int64
	SourceURL  *string
}

// CreateTagInput represents input for creating a new tag
type CreateTagInput struct {
	Name     string
	Category TagCategory
}

// SearchQuery represents a media search query
type SearchQuery struct {
	IncludeTags   []string
	OptionalTags  []string
	ExcludeTags   []string
	Rating        []Rating
	MinWidth      *int64
	MaxWidth      *int64
	MinHeight     *int64
	MaxHeight     *int64
	MinFileSize   *int64
	MaxFileSize   *int64
	HasParent     *bool
	HasChildren   *bool
	ParentID      *int64
	IsFavorite    *bool
	CreatedAfter  *time.Time
	CreatedBefore *time.Time
	MediaTypes    []MediaType

	// Pagination (offset-based for arbitrary page jumps)
	Limit  int // Number of results per page (default: 20)
	Offset int // Number of results to skip (0-indexed)

	// Cursor-based pagination (for efficient prev/next navigation)
	BeforeID *int64 // Get results before this ID (for next page - older items)
	AfterID  *int64 // Get results after this ID (for previous page - newer items)
}

// FFprobeMetadata represents metadata extracted from ffprobe
type FFprobeMetadata struct {
	FileSize int64
	Codec    string
	Format   string
	Height   *int64
	Width    *int64
	Duration *float64
}

// SearchResult represents paginated search results
type SearchResult struct {
	Media      []*Media
	TotalCount int64
	FirstID    int64 // ID of first item in current page
	LastID     int64 // ID of last item in current page
	HasMore    bool  // Whether there are more results after this page
}
