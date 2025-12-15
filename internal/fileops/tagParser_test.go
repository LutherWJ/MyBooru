package fileops

import (
	"mybooru/internal/models"
	"testing"
)

func TestValidateTagName(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		expectError bool
	}{
		{name: "basic tag", input: "cat", expectError: false},
		{name: "tag with underscore", input: "long_tag", expectError: false},
		{name: "tag with hyphen in middle", input: "jack-o-lantern", expectError: false},
		{name: "empty string", input: "", expectError: false},
		{name: "starts with hyphen", input: "-invalid", expectError: true},
		{name: "starts with tilde", input: "~invalid", expectError: true},
		{name: "starts with colon", input: ":invalid", expectError: true},
		{name: "starts with asterisk", input: "*invalid", expectError: true},
		{name: "ends with hyphen", input: "invalid-", expectError: true},
		{name: "ends with tilde", input: "invalid~", expectError: true},
		{name: "ends with colon", input: "invalid:", expectError: true},
		{name: "ends with asterisk", input: "invalid*", expectError: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateTagName(tt.input)
			if tt.expectError && err == nil {
				t.Errorf("ValidateTagName(%q) expected error, got nil", tt.input)
			}
			if !tt.expectError && err != nil {
				t.Errorf("ValidateTagName(%q) unexpected error: %v", tt.input, err)
			}
		})
	}
}

func TestParseTags(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		expected    []models.CreateTagInput
		expectError bool
	}{
		{
			name:  "single tag",
			input: "cat",
			expected: []models.CreateTagInput{
				{Name: "cat", Category: models.TagCategoryGeneral},
			},
		},
		{
			name:  "multiple tags",
			input: "cat dog bird",
			expected: []models.CreateTagInput{
				{Name: "cat", Category: models.TagCategoryGeneral},
				{Name: "dog", Category: models.TagCategoryGeneral},
				{Name: "bird", Category: models.TagCategoryGeneral},
			},
		},
		{
			name:  "tag with artist category",
			input: "artist:john_doe",
			expected: []models.CreateTagInput{
				{Name: "john_doe", Category: models.TagCategoryArtist},
			},
		},
		{
			name:  "tag with multiple colons",
			input: "artist:tag:with:colons",
			expected: []models.CreateTagInput{
				{Name: "tag:with:colons", Category: models.TagCategoryArtist},
			},
		},
		{
			name:  "mixed tags with categories",
			input: "cat artist:john_doe character:hero",
			expected: []models.CreateTagInput{
				{Name: "cat", Category: models.TagCategoryGeneral},
				{Name: "john_doe", Category: models.TagCategoryArtist},
				{Name: "hero", Category: models.TagCategoryCharacter},
			},
		},
		{
			name:  "empty category name skipped",
			input: "cat artist: dog",
			expected: []models.CreateTagInput{
				{Name: "cat", Category: models.TagCategoryGeneral},
				{Name: "dog", Category: models.TagCategoryGeneral},
			},
		},
		{
			name:     "empty string",
			input:    "",
			expected: []models.CreateTagInput{},
		},
		{
			name:     "whitespace only",
			input:    "   ",
			expected: []models.CreateTagInput{},
		},
		{
			name:  "uppercase converted to lowercase",
			input: "CAT DOG",
			expected: []models.CreateTagInput{
				{Name: "cat", Category: models.TagCategoryGeneral},
				{Name: "dog", Category: models.TagCategoryGeneral},
			},
		},
		{
			name:  "uppercase category",
			input: "ARTIST:john_doe",
			expected: []models.CreateTagInput{
				{Name: "john_doe", Category: models.TagCategoryArtist},
			},
		},
		{
			name:  "series category alias",
			input: "series:pokemon",
			expected: []models.CreateTagInput{
				{Name: "pokemon", Category: models.TagCategoryCopyright},
			},
		},
		{
			name:        "tag starts with hyphen",
			input:       "-invalid",
			expectError: true,
		},
		{
			name:        "tag starts with tilde",
			input:       "~invalid",
			expectError: true,
		},
		{
			name:        "tag starts with asterisk",
			input:       "*invalid",
			expectError: true,
		},
		{
			name:        "one invalid tag stops parsing",
			input:       "cat -invalid dog",
			expectError: true,
		},
		{
			name:  "special characters in middle are okay",
			input: "jack-o'-lantern",
			expected: []models.CreateTagInput{
				{Name: "jack-o'-lantern", Category: models.TagCategoryGeneral},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseTags(tt.input)

			if tt.expectError {
				if err == nil {
					t.Errorf("ParseTags(%q) expected error, got nil", tt.input)
				}
				return
			}

			if err != nil {
				t.Errorf("ParseTags(%q) unexpected error: %v", tt.input, err)
				return
			}

			if len(result) != len(tt.expected) {
				t.Errorf("ParseTags(%q) returned %d tags, want %d", tt.input, len(result), len(tt.expected))
				return
			}

			for i, tag := range result {
				if tag.Name != tt.expected[i].Name {
					t.Errorf("ParseTags(%q)[%d].Name = %q, want %q", tt.input, i, tag.Name, tt.expected[i].Name)
				}
				if tag.Category != tt.expected[i].Category {
					t.Errorf("ParseTags(%q)[%d].Category = %d, want %d", tt.input, i, tag.Category, tt.expected[i].Category)
				}
			}
		})
	}
}

func TestParseCategory(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected models.TagCategory
	}{
		{name: "general", input: "general", expected: models.TagCategoryGeneral},
		{name: "artist", input: "artist", expected: models.TagCategoryArtist},
		{name: "copyright", input: "copyright", expected: models.TagCategoryCopyright},
		{name: "series alias", input: "series", expected: models.TagCategoryCopyright},
		{name: "character", input: "character", expected: models.TagCategoryCharacter},
		{name: "meta", input: "meta", expected: models.TagCategoryMetadata},
		{name: "metadata", input: "metadata", expected: models.TagCategoryMetadata},
		{name: "unknown defaults to general", input: "unknown", expected: models.TagCategoryGeneral},
		{name: "empty defaults to general", input: "", expected: models.TagCategoryGeneral},
		{name: "uppercase", input: "ARTIST", expected: models.TagCategoryArtist},
		{name: "mixed case", input: "Character", expected: models.TagCategoryCharacter},
		{name: "with whitespace", input: "  artist  ", expected: models.TagCategoryArtist},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ParseCategory(tt.input)
			if result != tt.expected {
				t.Errorf("ParseCategory(%q) = %d, want %d", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsWhitespace(t *testing.T) {
	tests := []struct {
		name     string
		input    rune
		expected bool
	}{
		{name: "space", input: ' ', expected: true},
		{name: "tab", input: '\t', expected: true},
		{name: "newline", input: '\n', expected: true},
		{name: "carriage return", input: '\r', expected: true},
		{name: "letter", input: 'a', expected: false},
		{name: "number", input: '1', expected: false},
		{name: "underscore", input: '_', expected: false},
		{name: "hyphen", input: '-', expected: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isWhitespace(tt.input)
			if result != tt.expected {
				t.Errorf("isWhitespace(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}
