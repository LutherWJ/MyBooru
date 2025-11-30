import type {
  Media,
  Tag,
  MediaTag,
  ViewHistory,
  TagAlias,
  TagImplication,
  SearchHistory,
  SavedSearch,
  Collection,
  CollectionMedia,
  MediaWithTags,
  TagWithCount,
  MediaType,
  Rating,
  TagCategory,
} from '../../shared/types';

export function mapToMedia(row: any): Media {
  return {
    id: row.id,
    file_path: row.file_path,
    original_path: row.original_path,
    md5: row.md5,
    media_type: row.media_type as MediaType,
    mime_type: row.mime_type,
    file_size: row.file_size,
    width: row.width,
    height: row.height,
    duration: row.duration,
    codec: row.codec,
    rating: row.rating as Rating,
    is_favorite: Boolean(row.is_favorite),
    score: row.score,
    view_count: row.view_count,
    tag_count: row.tag_count,
    tag_count_general: row.tag_count_general,
    tag_count_metadata: row.tag_count_metadata,
    tag_count_artist: row.tag_count_artist,
    parent_id: row.parent_id,
    has_children: Boolean(row.has_children),
    source_url: row.source_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_viewed_at: row.last_viewed_at,
  };
}

export function mapToTag(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    category: row.category as TagCategory,
    usage_count: row.usage_count,
    created_at: row.created_at,
  };
}

export function mapToMediaTag(row: any): MediaTag {
  return {
    id: row.id,
    media_id: row.media_id,
    tag_id: row.tag_id,
    created_at: row.created_at,
  };
}

export function mapToViewHistory(row: any): ViewHistory {
  return {
    id: row.id,
    media_id: row.media_id,
    viewed_at: row.viewed_at,
    view_duration: row.view_duration,
    session_id: row.session_id,
  };
}

export function mapToTagAlias(row: any): TagAlias {
  return {
    id: row.id,
    antecedent_name: row.antecedent_name,
    consequent_name: row.consequent_name,
    created_at: row.created_at,
  };
}

export function mapToTagImplication(row: any): TagImplication {
  return {
    id: row.id,
    child_tag_id: row.child_tag_id,
    parent_tag_id: row.parent_tag_id,
    created_at: row.created_at,
  };
}

export function mapToSearchHistory(row: any): SearchHistory {
  return {
    id: row.id,
    query: row.query,
    result_count: row.result_count,
    searched_at: row.searched_at,
  };
}

export function mapToSavedSearch(row: any): SavedSearch {
  return {
    id: row.id,
    name: row.name,
    query: row.query,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
  };
}

export function mapToCollection(row: any): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
  };
}

export function mapToCollectionMedia(row: any): CollectionMedia {
  return {
    collection_id: row.collection_id,
    media_id: row.media_id,
    position: row.position,
  };
}

export function mapToMediaWithTags(mediaRow: any, tags: Tag[]): MediaWithTags {
  return {
    ...mapToMedia(mediaRow),
    tags,
  };
}

export function mapToTagWithCount(row: any): TagWithCount {
  return {
    ...mapToTag(row),
    media_count: row.media_count,
  };
}

export function mapArrayToMedia(rows: any[]): Media[] {
  return rows.map(mapToMedia);
}

export function mapArrayToTags(rows: any[]): Tag[] {
  return rows.map(mapToTag);
}

export function mapArrayToMediaTags(rows: any[]): MediaTag[] {
  return rows.map(mapToMediaTag);
}

export function mapArrayToViewHistory(rows: any[]): ViewHistory[] {
  return rows.map(mapToViewHistory);
}

export function mapArrayToTagAliases(rows: any[]): TagAlias[] {
  return rows.map(mapToTagAlias);
}

export function mapArrayToTagImplications(rows: any[]): TagImplication[] {
  return rows.map(mapToTagImplication);
}

export function mapArrayToSearchHistory(rows: any[]): SearchHistory[] {
  return rows.map(mapToSearchHistory);
}

export function mapArrayToSavedSearches(rows: any[]): SavedSearch[] {
  return rows.map(mapToSavedSearch);
}

export function mapArrayToCollections(rows: any[]): Collection[] {
  return rows.map(mapToCollection);
}

export function mapArrayToCollectionMedia(rows: any[]): CollectionMedia[] {
  return rows.map(mapToCollectionMedia);
}

export function mapArrayToTagsWithCount(rows: any[]): TagWithCount[] {
  return rows.map(mapToTagWithCount);
}
