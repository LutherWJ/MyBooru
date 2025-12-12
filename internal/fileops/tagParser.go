package fileops

import (
	"mybooru/internal/models"
	"strings"
)

func isWhitespace(c rune) bool {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r'
}

func ParseCategory(category string) models.TagCategory {
	switch category {
	case "general":
		return 0
	case "artist":
		return 1
	case "copyright":
		return 2
	case "series":
		return 2
	case "character":
		return 3
	case "meta":
		return 4
	case "metadata":
		return 4
	default:
		return 0
	}
}

// ParseTags takes in a raw string and returns an array of tags ready to be inserted in the database.
// Used for parsing user input for operations where they're adding tags.
func ParseTags(tagString string) []models.CreateTagInput {
	tagList := strings.Split(tagString, " ")
	tags := make([]models.CreateTagInput, len(tagList))
	for i, tag := range tagList {
		if strings.Contains(tag, ":") {
			tagParts := strings.Split(tag, ":")
			tagParts[0] = strings.TrimSpace(tagParts[0])
			tagParts[1] = strings.TrimSpace(tagParts[1])
			tags[i] = models.CreateTagInput{
				Name:     tagParts[1],
				Category: ParseCategory(tagParts[0]),
			}
		} else {
			tags[i] = models.CreateTagInput{
				Name:     tag,
				Category: 0,
			}
		}
	}
	return tags
}
