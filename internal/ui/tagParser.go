package ui

import (
	"fmt"
	"mybooru/internal/models"
	"strings"
)

// TODO: needs to handle multiple types of whitespace

func isWhitespace(c rune) bool {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r'
}

func ParseCategory(category string) models.TagCategory {
	category = strings.ToLower(strings.TrimSpace(category))
	switch category {
	case "artist":
		return 1
	case "a":
		return 1
	case "copyright":
		return 2
	case "series":
		return 2
	case "character":
		return 3
	case "char":
		return 3
	case "ch":
		return 3
	case "meta":
		return 4
	case "metadata":
		return 4
	default:
		return 0
	}
}

// ValidateTagName checks if a tag name has restricted characters at start/end.
// Returns an error if the tag starts or ends with: - ~ : *
func ValidateTagName(name string) error {
	if name == "" {
		return nil
	}

	restrictedChars := []rune{'-', '~', ':', '*'}
	firstChar := rune(name[0])
	lastChar := rune(name[len(name)-1])

	for _, rc := range restrictedChars {
		if firstChar == rc {
			return fmt.Errorf("tag '%s' cannot start with '%c'", name, rc)
		}
		if lastChar == rc {
			return fmt.Errorf("tag '%s' cannot end with '%c'", name, rc)
		}
	}

	return nil
}

// ParseTags takes in a raw string and returns an array of tags ready to be inserted in the database.
// Expected format: "tag_one artist:artist_name tag_two"
// Returns error if any tag has restricted characters at start/end.
func ParseTags(tagString string) ([]models.CreateTagInput, error) {
	tagString = strings.ToLower(strings.TrimSpace(tagString))

	if tagString == "" {
		return []models.CreateTagInput{}, nil
	}

	tagList := strings.Split(tagString, " ")
	tags := make([]models.CreateTagInput, 0, len(tagList))

	for _, tag := range tagList {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}

		var name string
		var category models.TagCategory

		if strings.Contains(tag, ":") {
			// Split on FIRST colon only to preserve colons in tag names
			tagParts := strings.SplitN(tag, ":", 2)
			categoryStr := strings.TrimSpace(tagParts[0])
			nameStr := strings.TrimSpace(tagParts[1])

			if nameStr == "" {
				continue
			}

			if err := ValidateTagName(nameStr); err != nil {
				return nil, err
			}

			name = nameStr
			category = ParseCategory(categoryStr)
		} else {
			if err := ValidateTagName(tag); err != nil {
				return nil, err
			}

			name = tag
			category = models.TagCategoryGeneral
		}

		tags = append(tags, models.CreateTagInput{
			Name:     name,
			Category: category,
		})
	}

	return tags, nil
}
