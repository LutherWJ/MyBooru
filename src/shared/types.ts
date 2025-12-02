// I LOVE EXPLICIT ERROR HANDLING
export type Success<T> = {
    ok: true
    value: T
}

export type Failure<E> = {
    ok: false
    error: E
}

export type Result<T, E> = Success<T> | Failure<E>;
export const Ok = <T>(value: T): Success<T> => ({ok: true, value: value})
export const Err = <E>(error: E): Failure<E> => ({ok: false, error: error})


// Helper functions for Result type
export function mapResult<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
): Result<U, E> {
    if (result.ok) {
        return Ok(fn(result.value));
    }
    return result as Result<U, E>;
}

export function flatMapResult<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
): Result<U, E> {
    if (result.ok) {
        return fn(result.value);
    }
    return result as Result<U, E>;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.ok) {
        return result.value;
    }
    return defaultValue;
}

export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) {
        return result.value;
    }
    const err = (result as Failure<E>).error;
    throw new Error(
        `Attempted to unwrap an error Result: ${JSON.stringify(err)}`
    );
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
    return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
    return !result.ok;
}

// ============================================================================
// Error Types
// ============================================================================

export type DatabaseError =
  | { type: 'not_found'; message: string }
  | { type: 'constraint_violation'; message: string }
  | { type: 'invalid_input'; message: string }
  | { type: 'database_error'; message: string; originalError?: unknown };

export type FileSystemError =
  | { type: 'file_not_found'; message: string; path: string }
  | { type: 'permission_denied'; message: string; path: string }
  | { type: 'disk_full'; message: string; path: string }
  | { type: 'io_error'; message: string; path: string; originalError?: unknown };

export type ParserError =
    | { type: 'invalid_character'; message: string }

export type MetadataError =
  | { type: 'file_not_found'; message: string; path: string }
  | { type: 'invalid_file'; message: string; path: string }
  | { type: 'ffprobe_error'; message: string; path: string; originalError?: unknown }
  | { type: 'parse_error'; message: string; path: string; originalError?: unknown }
// ============================================================================
// Enums
// ============================================================================

export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
}

export enum Rating {
    SAFE = 'safe',
    QUESTIONABLE = 'questionable',
    EXPLICIT = 'explicit',
}

export enum TagCategory {
    GENERAL = 0,
    METADATA = 1,
    ARTIST = 2,
}

export enum SortOrder {
    ID_ASC = 'id_asc',
    ID_DESC = 'id_desc',
    CREATED_ASC = 'created_at_asc',
    CREATED_DESC = 'created_at_desc',
    SCORE_ASC = 'score_asc',
    SCORE_DESC = 'score_desc',
    VIEW_COUNT_ASC = 'view_count_asc',
    VIEW_COUNT_DESC = 'view_count_desc',
    RANDOM = 'random',
    FILE_SIZE_ASC = 'file_size_asc',
    FILE_SIZE_DESC = 'file_size_desc',
}

// ============================================================================
// Database Entity Types
// ============================================================================

export interface Media {
    id: number;
    file_path: string;
    original_path: string | null;
    md5: string;
    media_type: MediaType;
    mime_type: string;
    file_size: number;

    // Dimensions/duration
    width: number | null;
    height: number | null;
    duration: number | null; // seconds for video/audio
    codec: string | null;

    // Content ratings & engagement
    rating: Rating;
    is_favorite: boolean;
    score: number;
    view_count: number;

    // Tag counts (denormalized)
    tag_count: number;
    tag_count_general: number;
    tag_count_metadata: number;
    tag_count_artist: number;

    // Relationships
    parent_id: number | null;
    has_children: boolean;

    // Metadata
    source_url: string | null;
    created_at: number; // Unix timestamp
    updated_at: number;
    last_viewed_at: number | null;
}

export interface FFprobeMetadata {
    file_size: number;
    height: number | null;
    width: number | null;
    duration: number | null;
    codec: string | null;
}

export interface Tag {
    id: number;
    name: string;
    category: TagCategory;
    usage_count: number;
    created_at: number;
}

export interface MediaTag {
    id: number;
    media_id: number;
    tag_id: number;
    created_at: number;
}

export interface ViewHistory {
    id: number;
    media_id: number;
    viewed_at: number;
    view_duration: number | null;
    session_id: string | null;
}

export interface TagAlias {
    id: number;
    antecedent_name: string; // old/alias name
    consequent_name: string; // canonical target name
    created_at: number;
}

export interface TagImplication {
    id: number;
    child_tag_id: number;
    parent_tag_id: number;
    created_at: number;
}

export interface SearchHistory {
    id: number;
    query: string;
    result_count: number;
    searched_at: number;
}

export interface SavedSearch {
    id: number;
    name: string;
    query: string;
    created_at: number;
    last_used_at: number | null;
}

export interface Collection {
    id: number;
    name: string;
    description: string | null;
    created_at: number;
}

export interface CollectionMedia {
    collection_id: number;
    media_id: number;
    position: number;
}

export interface CreateMediaInput {
    file_path: string;
    original_path: string | null;
    md5: string;
    media_type: MediaType;
    mime_type: string;
    file_size: number;
    width: number | null;
    height: number | null;
    duration: number | null;
    codec: string | null;
    rating: Rating;
    is_favorite: boolean;
    parent_id: number | null;
    source_url: string | null;
}

export interface UpdateMediaInput {
    rating?: Rating;
    is_favorite?: boolean;
    score?: number;
    parent_id?: number | null;
    source_url?: string | null;
}

export interface CreateTagInput {
    name: string;
    category?: TagCategory;
}

export interface CreateViewHistoryInput {
    media_id: number;
    view_duration?: number | null;
    session_id?: string | null;
}

export interface CreateCollectionInput {
    name: string;
    description?: string | null;
}

export interface MediaSearchResults {
    media: Media[]
    currentPage: number
    totalPages: number
    mediaPerPage: number
}


// Query types
export interface SearchQuery {
    // Filters
    includeTags?: string[];
    optionalTags?: string[];
    excludeTags?: string[];
    // Metatags
    rating?: Rating[];
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minFileSize?: number;
    maxFileSize?: number;
    minViewCount?: number;
    maxViewCount?: number;
    // Relationships
    hasParent?: boolean;
    hasChildren?: boolean;
    parentId?: number;
    // Status
    isFavorite?: boolean;
    // Date ranges
    createdAfter?: number;
    createdBefore?: number;
    // Media types
    mediaTypes?: MediaType[];
    // Sorting and pagination
    sortBy?: SortOrder;
    limit?: number;
    offset?: number;
}

export interface TagSearchQuery {
    pattern?: string;
    category?: TagCategory;
    minUsageCount?: number;
    limit?: number;
    offset?: number;
}

export interface MediaWithTags extends Media {
    tags: Tag[];
}

export interface TagWithCount extends Tag {
    media_count: number;
}

export interface UploadProgress {
    current: number;
    total: number;
    fileName: string;
}

// Extend window with our API
declare global {
    interface Window {
        api: {
            media: {
                getAll: (page: number) => Promise<Result<MediaSearchResults, DatabaseError>>;
                getById: (id: number) => Promise<Result<Media, DatabaseError>>;
                search: (query: string, page: number) => Promise<Result<MediaSearchResults, DatabaseError>>;
                toggleFavorite: (id: number) => Promise<Result<Media, DatabaseError>>;
                delete: (id: number) => Promise<Result<void, DatabaseError>>;
            };
            tags: {
                getForMedia: (mediaId: number) => Promise<Result<Tag[], DatabaseError>>;
                addToMedia: (mediaId: number, tagNames: string[]) => Promise<Result<void, DatabaseError>>;
                removeFromMedia: (mediaId: number, tagId: number) => Promise<Result<void, DatabaseError>>;
                search: (pattern: string) => Promise<Result<Tag[], DatabaseError>>;
            };
            upload: {
                selectFiles: () => Promise<Result<string[], FileSystemError>>;
                uploadFiles: (filePaths: string[]) => Promise<Result<void, DatabaseError | FileSystemError>>;
                uploadFile: (stream: ReadableStream) => Promise<Result<void, DatabaseError | FileSystemError>>;
            };
            file: {
                getThumbnailPath: (mediaId: number) => Promise<Result<string, FileSystemError>>;
                getMediaPath: (mediaId: number) => Promise<Result<string, FileSystemError>>;
            };
            onUploadProgress: (callback: (progress: UploadProgress) => void) => void;
            removeUploadProgressListener: () => void;
        };
    }
}
