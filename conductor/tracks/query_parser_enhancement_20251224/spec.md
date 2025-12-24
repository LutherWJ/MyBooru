# Spec: Search Query Parser Enhancements

## Overview
The current search query parser in `internal/search/queries.go` handles basic inclusion, exclusion (`-`), and optional (`~`) tags. This track aims to extend the parser to support more advanced Booru-style search syntax.

## Requirements
- **Wildcard Support:** Allow the `*` character within tags to match any sequence of characters (e.g., `blue*` matches "blue", "blueprint", "bluesky").
- **Metadata Colon Syntax:** Support `key:value` or `category:tag` syntax (e.g., `artist:shirley`, `ratio:16:9`).
- **Backward Compatibility:** Ensure existing `tag`, `-tag`, and `~tag` syntax continues to work correctly.
- **Integration:** The parser must continue to output a structured `SearchQuery` that the database layer can use to construct SQL queries.

## Technical Considerations
- The parser resides in `internal/search/queries.go`.
- SQL generation logic in `internal/database/media.go` will likely need corresponding updates to handle the new `SearchQuery` fields (e.g., using `LIKE` for wildcards).
