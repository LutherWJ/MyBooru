import type Database from 'better-sqlite3';
import type { DatabaseError } from './types';
import { Ok, Err, type Result } from './../shared/types';

type DatabaseInstance = Database.Database;

const CREATE_TABLES_SQL = `
-- ============================================================================
-- Core Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  original_path TEXT,
  md5 TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video', 'audio')),
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,

  -- Dimensions/duration
  width INTEGER,
  height INTEGER,
  duration REAL,
  codec TEXT,

  -- Content ratings & engagement
  rating TEXT NOT NULL DEFAULT 'safe' CHECK(rating IN ('safe', 'questionable', 'explicit')),
  is_favorite INTEGER NOT NULL DEFAULT 0 CHECK(is_favorite IN (0, 1)),
  score INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,

  -- Tag counts (denormalized for performance)
  tag_count INTEGER NOT NULL DEFAULT 0,
  tag_count_general INTEGER NOT NULL DEFAULT 0,
  tag_count_metadata INTEGER NOT NULL DEFAULT 0,
  tag_count_artist INTEGER NOT NULL DEFAULT 0,

  -- Relationships
  parent_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  has_children INTEGER NOT NULL DEFAULT 0 CHECK(has_children IN (0, 1)),

  -- Metadata
  source_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_viewed_at INTEGER
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  category INTEGER NOT NULL DEFAULT 0 CHECK(category IN (0, 1, 2)),
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE(media_id, tag_id)
);

CREATE TABLE IF NOT EXISTS view_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  viewed_at INTEGER NOT NULL,
  view_duration INTEGER,
  session_id TEXT
);

CREATE TABLE IF NOT EXISTS tag_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  antecedent_name TEXT NOT NULL UNIQUE,
  consequent_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_implications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  parent_tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE(child_tag_id, parent_tag_id)
);

CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  searched_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  query TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_media (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY(collection_id, media_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Media indexes for search/filtering
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_score ON media(score DESC);
CREATE INDEX IF NOT EXISTS idx_media_view_count ON media(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_media_rating ON media(rating);
CREATE INDEX IF NOT EXISTS idx_media_md5 ON media(md5);
CREATE INDEX IF NOT EXISTS idx_media_last_viewed ON media(last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_width ON media(width);
CREATE INDEX IF NOT EXISTS idx_media_height ON media(height);
CREATE INDEX IF NOT EXISTS idx_media_file_size ON media(file_size);
CREATE INDEX IF NOT EXISTS idx_media_parent_id ON media(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_media_type ON media(media_type);

-- CRITICAL: Junction table indexes for tag queries
CREATE INDEX IF NOT EXISTS idx_media_tags_media ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag ON media_tags(tag_id);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_category_usage ON tags(category, usage_count DESC);

-- View history indexes
CREATE INDEX IF NOT EXISTS idx_view_history_media ON view_history(media_id);
CREATE INDEX IF NOT EXISTS idx_view_history_viewed ON view_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_history_composite ON view_history(media_id, viewed_at DESC);

-- Search history index
CREATE INDEX IF NOT EXISTS idx_search_history_searched ON search_history(searched_at DESC);

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_collection_media_pool ON collection_media(collection_id, position);
CREATE INDEX IF NOT EXISTS idx_collection_media_post ON collection_media(media_id);

-- Tag alias and implication indexes
CREATE INDEX IF NOT EXISTS idx_tag_aliases_antecedent ON tag_aliases(antecedent_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tag_implications_child ON tag_implications(child_tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_implications_parent ON tag_implications(parent_tag_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update tag usage counts when media_tags changes
CREATE TRIGGER IF NOT EXISTS trg_media_tags_insert
AFTER INSERT ON media_tags
BEGIN
  UPDATE tags
  SET usage_count = usage_count + 1
  WHERE id = NEW.tag_id;

  UPDATE media
  SET tag_count = tag_count + 1,
      updated_at = unixepoch()
  WHERE id = NEW.media_id;

  -- Update category-specific counts
  UPDATE media
  SET tag_count_general = tag_count_general + 1
  WHERE id = NEW.media_id
    AND (SELECT category FROM tags WHERE id = NEW.tag_id) = 0;

  UPDATE media
  SET tag_count_metadata = tag_count_metadata + 1
  WHERE id = NEW.media_id
    AND (SELECT category FROM tags WHERE id = NEW.tag_id) = 1;

  UPDATE media
  SET tag_count_artist = tag_count_artist + 1
  WHERE id = NEW.media_id
    AND (SELECT category FROM tags WHERE id = NEW.tag_id) = 2;
END;

CREATE TRIGGER IF NOT EXISTS trg_media_tags_delete
AFTER DELETE ON media_tags
BEGIN
  UPDATE tags
  SET usage_count = usage_count - 1
  WHERE id = OLD.tag_id;

  UPDATE media
  SET tag_count = tag_count - 1,
      updated_at = unixepoch()
  WHERE id = OLD.media_id;

  -- Update category-specific counts
  UPDATE media
  SET tag_count_general = tag_count_general - 1
  WHERE id = OLD.media_id
    AND (SELECT category FROM tags WHERE id = OLD.tag_id) = 0;

  UPDATE media
  SET tag_count_metadata = tag_count_metadata - 1
  WHERE id = OLD.media_id
    AND (SELECT category FROM tags WHERE id = OLD.tag_id) = 1;

  UPDATE media
  SET tag_count_artist = tag_count_artist - 1
  WHERE id = OLD.media_id
    AND (SELECT category FROM tags WHERE id = OLD.tag_id) = 2;
END;

-- Auto-update has_children flag when media parent_id is set
CREATE TRIGGER IF NOT EXISTS trg_media_parent_insert
AFTER INSERT ON media
WHEN NEW.parent_id IS NOT NULL
BEGIN
  UPDATE media
  SET has_children = 1
  WHERE id = NEW.parent_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_media_parent_update
AFTER UPDATE OF parent_id ON media
WHEN NEW.parent_id IS NOT NULL
BEGIN
  UPDATE media
  SET has_children = 1
  WHERE id = NEW.parent_id;
END;

-- Update view count when view_history entry is added
CREATE TRIGGER IF NOT EXISTS trg_view_history_insert
AFTER INSERT ON view_history
BEGIN
  UPDATE media
  SET view_count = view_count + 1,
      last_viewed_at = NEW.viewed_at,
      updated_at = unixepoch()
  WHERE id = NEW.media_id;
END;

-- Update media.updated_at on any update
CREATE TRIGGER IF NOT EXISTS trg_media_update_timestamp
AFTER UPDATE ON media
FOR EACH ROW
BEGIN
  UPDATE media
  SET updated_at = unixepoch()
  WHERE id = NEW.id;
END;
`;


/**
 * Initialize the database schema with all tables, indexes, and triggers
 */
export function initializeSchema(db: DatabaseInstance): Result<void, DatabaseError> {
  try {
    db.pragma('foreign_keys = ON');
    db.exec(CREATE_TABLES_SQL);
    return Ok(undefined);
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to initialize database schema',
      originalError: error,
    });
  }
}

export function configurePragmas(
  db: DatabaseInstance,
  config: {
    enableWAL?: boolean;
    cacheSize?: number;
    tempStore?: 'default' | 'file' | 'memory';
    synchronous?: 'off' | 'normal' | 'full' | 'extra';
  } = {}
): Result<void, DatabaseError> {
  try {
    if (config.enableWAL !== false) {
      db.pragma('journal_mode = WAL');
    }

    if (config.cacheSize !== undefined) {
      db.pragma(`cache_size = ${config.cacheSize}`);
    }

    if (config.tempStore) {
      const tempStoreValue =
        config.tempStore === 'default' ? 0 :
        config.tempStore === 'file' ? 1 :
        2;
      db.pragma(`temp_store = ${tempStoreValue}`);
    }

    if (config.synchronous) {
      db.pragma(`synchronous = ${config.synchronous.toUpperCase()}`);
    }

    db.pragma('foreign_keys = ON');

    return Ok(undefined);
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to configure database pragmas',
      originalError: error,
    });
  }
}

/**
 * Run ANALYZE to update query planner statistics
 * Should be run periodically after bulk operations
 */
export function analyzeDatabase(db: DatabaseInstance): Result<void, DatabaseError> {
  try {
    db.exec('ANALYZE');
    return Ok(undefined);
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to analyze database',
      originalError: error,
    });
  }
}

/**
 * Vacuum database to reclaim space and optimize
 */
export function vacuumDatabase(db: DatabaseInstance): Result<void, DatabaseError> {
  try {
    db.exec('VACUUM');
    return Ok(undefined);
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to vacuum database',
      originalError: error,
    });
  }
}

/**
 * Check database integrity
 */
export function checkIntegrity(db: DatabaseInstance): Result<boolean, DatabaseError> {
  try {
    const result = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    return Ok(result.integrity_check === 'ok');
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to check database integrity',
      originalError: error,
    });
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats(db: DatabaseInstance): Result<{
  mediaCount: number;
  tagCount: number;
  viewHistoryCount: number;
  totalFileSize: number;
}, DatabaseError> {
  try {
    const mediaCountResult = db.prepare('SELECT COUNT(*) as count FROM media').get() as { count: number };
    const tagCountResult = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
    const viewHistoryCountResult = db.prepare('SELECT COUNT(*) as count FROM view_history').get() as { count: number };
    const totalFileSizeResult = db.prepare('SELECT COALESCE(SUM(file_size), 0) as total FROM media').get() as { total: number };

    return Ok({
      mediaCount: mediaCountResult.count,
      tagCount: tagCountResult.count,
      viewHistoryCount: viewHistoryCountResult.count,
      totalFileSize: totalFileSizeResult.total,
    });
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to get database statistics',
      originalError: error,
    });
  }
}
