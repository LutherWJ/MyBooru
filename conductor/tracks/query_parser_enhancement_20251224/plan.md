# Plan: Search Query Parser Enhancements

## Phase 1: Analysis & Infrastructure
- [ ] Task: Analyze existing parser implementation in `internal/search/queries.go`
- [ ] Task: Update `SearchQuery` struct in `internal/models/types.go` if necessary to store wildcard and metadata info
- [ ] Task: Conductor - User Manual Verification 'Analysis & Infrastructure' (Protocol in workflow.md)

## Phase 2: Wildcard Operator Support
- [ ] Task: Write unit tests for wildcard patterns in `internal/search/queries_test.go`
- [ ] Task: Implement wildcard parsing logic in `internal/search/queries.go`
- [ ] Task: Update database search logic in `internal/database/media.go` to use `LIKE` for wildcard tags
- [ ] Task: Conductor - User Manual Verification 'Wildcard Operator Support' (Protocol in workflow.md)

## Phase 3: Metadata Colon Syntax
- [ ] Task: Write unit tests for colon syntax (`key:value`) in `internal/search/queries_test.go`
- [ ] Task: Implement colon syntax parsing in `internal/search/queries.go`
- [ ] Task: Update database search logic to handle metadata filters (e.g., filtering by specific tag categories or media properties)
- [ ] Task: Conductor - User Manual Verification 'Metadata Colon Syntax' (Protocol in workflow.md)

## Phase 4: Final Integration & Verification
- [ ] Task: Perform end-to-end search tests via Wails bindings to ensure frontend-to-backend flow
- [ ] Task: Conductor - User Manual Verification 'Final Integration & Verification' (Protocol in workflow.md)
