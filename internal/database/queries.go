package database

import (
	"mybooru/internal/models"
)

type parser struct {
	query []rune
	pos   int
}

func isWhitespace(c rune) bool {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r'
}

func parseTag(p *parser) string {
	startPos := p.pos
	for p.pos < len(p.query) {
		c := p.query[p.pos]
		if isWhitespace(c) {
			result := string(p.query[startPos:p.pos])
			p.pos++
			return result
		}
		p.pos++
	}
	return string(p.query[startPos:p.pos])
}

func parseQuery(query string) *models.SearchQuery {
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
			tag := parseTag(p)
			searchQuery.ExcludeTags = append(searchQuery.ExcludeTags, tag)
			continue
		} else if c == '~' {
			p.pos++
			tag := parseTag(p)
			searchQuery.OptionalTags = append(searchQuery.OptionalTags, tag)
			continue
		} else {
			tag := parseTag(p)
			searchQuery.IncludeTags = append(searchQuery.IncludeTags, tag)
			continue
		}
	}

	return searchQuery
}
