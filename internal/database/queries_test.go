package database

import (
	"reflect"
	"testing"

	"mybooru/internal/models"
)

func TestParseQuery(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected *models.SearchQuery
	}{
		{
			name:  "empty query",
			input: "",
			expected: &models.SearchQuery{
				IncludeTags:  nil,
				OptionalTags: nil,
				ExcludeTags:  nil,
			},
		},
		{
			name:  "single include tag",
			input: "cat",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"cat"},
				OptionalTags: nil,
				ExcludeTags:  nil,
			},
		},
		{
			name:  "multiple include tags",
			input: "cat dog bird",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"cat", "dog", "bird"},
				OptionalTags: nil,
				ExcludeTags:  nil,
			},
		},
		{
			name:  "single exclude tag",
			input: "-dog",
			expected: &models.SearchQuery{
				IncludeTags:  nil,
				OptionalTags: nil,
				ExcludeTags:  []string{"dog"},
			},
		},
		{
			name:  "single optional tag",
			input: "~outdoor",
			expected: &models.SearchQuery{
				IncludeTags:  nil,
				OptionalTags: []string{"outdoor"},
				ExcludeTags:  nil,
			},
		},
		{
			name:  "complex query with all tag types",
			input: "cat -dog ~outdoor",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"cat"},
				OptionalTags: []string{"outdoor"},
				ExcludeTags:  []string{"dog"},
			},
		},
		{
			name:  "multiple tags of each type",
			input: "cat kitten -dog -wolf ~outdoor ~nature",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"cat", "kitten"},
				OptionalTags: []string{"outdoor", "nature"},
				ExcludeTags:  []string{"dog", "wolf"},
			},
		},
		{
			name:  "query with extra whitespace",
			input: "  cat   -dog    ~outdoor  ",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"cat"},
				OptionalTags: []string{"outdoor"},
				ExcludeTags:  []string{"dog"},
			},
		},
		{
			name:  "query with tabs and newlines",
			input: "cat\t-dog\n~outdoor",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"cat"},
				OptionalTags: []string{"outdoor"},
				ExcludeTags:  []string{"dog"},
			},
		},
		{
			name:  "tags with underscores",
			input: "long_tag another_long_tag",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"long_tag", "another_long_tag"},
				OptionalTags: nil,
				ExcludeTags:  nil,
			},
		},
		{
			name:  "mixed order of tag types",
			input: "~outdoor cat -dog bird ~nature -wolf",
			expected: &models.SearchQuery{
				IncludeTags:  []string{"cat", "bird"},
				OptionalTags: []string{"outdoor", "nature"},
				ExcludeTags:  []string{"dog", "wolf"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseQuery(tt.input)

			if !reflect.DeepEqual(result.IncludeTags, tt.expected.IncludeTags) {
				t.Errorf("IncludeTags mismatch:\ngot:  %v\nwant: %v", result.IncludeTags, tt.expected.IncludeTags)
			}

			if !reflect.DeepEqual(result.OptionalTags, tt.expected.OptionalTags) {
				t.Errorf("OptionalTags mismatch:\ngot:  %v\nwant: %v", result.OptionalTags, tt.expected.OptionalTags)
			}

			if !reflect.DeepEqual(result.ExcludeTags, tt.expected.ExcludeTags) {
				t.Errorf("ExcludeTags mismatch:\ngot:  %v\nwant: %v", result.ExcludeTags, tt.expected.ExcludeTags)
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
		{"space", ' ', true},
		{"tab", '\t', true},
		{"newline", '\n', true},
		{"carriage return", '\r', true},
		{"letter", 'a', false},
		{"dash", '-', false},
		{"tilde", '~', false},
		{"underscore", '_', false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isWhitespace(tt.input)
			if result != tt.expected {
				t.Errorf("isWhitespace(%q) = %v; want %v", tt.input, result, tt.expected)
			}
		})
	}
}
