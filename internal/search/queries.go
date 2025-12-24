package search

import (
	"mybooru/internal/models"
	"strconv"
)

type parser struct {
	query []rune
	pos   int
}

func isWhitespace(c rune) bool {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r'
}

// parseTag assumes the parser position is on the first character of a word (after a space or modifier char).
// It will iterate through the string until a whitespace or the end of the string is reached,
// returning the complete word.
func (p *parser) parseTag() string {
	startPos := p.pos
	for p.pos < len(p.query) {
		c := p.query[p.pos]
		if isWhitespace(c) {
			result := string(p.query[startPos:p.pos])
			p.pos++ // Move past the terminating whitespace
			return result
		}
		p.pos++
	}
	return string(p.query[startPos:p.pos])
}

// addFilter takes a string and attempts to parse out a SearchQuery filter condition to be added to the query.
// Automatically modifies the query passed as a parameter, fails silently if syntax is invalid.
// If a query defines the same filter multiple times, the later filter will overwrite the previous one.
func (p *parser) addFilter(q *models.SearchQuery) {
	startPos := p.pos
	var filter string
	var modifier string
	for p.pos < len(p.query) {
		c := p.query[p.pos]

		if c == ':' {
			filter = string(p.query[startPos:p.pos])
			p.pos++
			modifier = p.parseTag()
			break
		} else if isWhitespace(c) {
			filter = string(p.query[startPos:p.pos])
			p.pos++
			break
		}
		p.pos++
	}
	if filter == "" && startPos < p.pos {
		filter = string(p.query[startPos:p.pos])
	}
	switch filter {
	case "favorite":
		var val bool
		if modifier == "true" {
			val = true
		} else if modifier == "false" {
			val = false
		}
		q.IsFavorite = &val
	case "minwidth":
		{
			num, err := strconv.ParseInt(modifier, 10, 64)
			if err != nil {
				return
			}
			q.MinWidth = &num
		}
	case "maxwidth":
		{
			num, err := strconv.ParseInt(modifier, 10, 64)
			if err != nil {
				return
			}
			q.MaxWidth = &num
		}
	case "minheight":
		{
			num, err := strconv.ParseInt(modifier, 10, 64)
			if err != nil {
				return
			}
			q.MinHeight = &num
		}
	case "maxheight":
		{
			num, err := strconv.ParseInt(modifier, 10, 64)
			if err != nil {
				return
			}
			q.MaxHeight = &num
		}
	case "minfilesize":
		{
			num, err := strconv.ParseInt(modifier, 10, 64)
			if err != nil {
				return
			}
			q.MinFileSize = &num
		}
	case "maxfilesize":
		{
			num, err := strconv.ParseInt(modifier, 10, 64)
			if err != nil {
				return
			}
			q.MaxFileSize = &num
		}
	case "rating":
		{
			if modifier == "safe" || modifier == "s" {
				q.Rating = append(q.Rating, models.RatingSafe)
			} else if modifier == "questionable" || modifier == "q" {
				q.Rating = append(q.Rating, models.RatingQuestionable)
			} else if modifier == "explicit" || modifier == "e" {
				q.Rating = append(q.Rating, models.RatingExplicit)
			}
		}
	case "type":
		{
			if modifier == "image" {
				q.MediaTypes = append(q.MediaTypes, models.MediaTypeImage)
			} else if modifier == "video" {
				q.MediaTypes = append(q.MediaTypes, models.MediaTypeVideo)
			} else if modifier == "audio" {
				q.MediaTypes = append(q.MediaTypes, models.MediaTypeAudio)
			}
		}
	case "parent":
		{
			if modifier == "none" || modifier == "false" {
				val := false
				q.HasParent = &val
			} else if modifier == "any" || modifier == "true" {
				val := true
				q.HasParent = &val
			} else {
				if num, err := strconv.ParseInt(modifier, 10, 64); err == nil {
					q.ParentID = &num
					val := true
					q.HasParent = &val
				}
			}
		}
	}
}

// ParseQuery takes a user generated string and transforms it into a SearchQuery struct.
func ParseQuery(query string) *models.SearchQuery {
	var searchQuery = &models.SearchQuery{}
	p := &parser{query: []rune(query), pos: 0}

	if len(query) <= 0 {
		return searchQuery
	}

	for p.pos < len(p.query) {
		c := p.query[p.pos]

		if isWhitespace(c) {
			p.pos++
			continue
		} else if c == '-' {
			p.pos++
			tag := p.parseTag()
			searchQuery.ExcludeTags = append(searchQuery.ExcludeTags, tag)
			continue
		} else if c == '~' {
			p.pos++
			tag := p.parseTag()
			searchQuery.OptionalTags = append(searchQuery.OptionalTags, tag)
			continue
		} else if c == '/' {
			p.pos++
			p.addFilter(searchQuery)
			continue
		} else if c == '*' {
			p.pos++
			tag := p.parseTag()
			searchQuery.WildcardTags = append(searchQuery.WildcardTags, tag)
			continue
		} else {
			tag := p.parseTag()
			searchQuery.IncludeTags = append(searchQuery.IncludeTags, tag)
			continue
		}
	}

	return searchQuery
}
