package database

const createTablesSQL = `
-- ============================================================================
-- Core Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
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

  -- Tag counts (denormalized for performance)
  tag_count INTEGER NOT NULL DEFAULT 0,
  tag_count_general INTEGER NOT NULL DEFAULT 0,
  tag_count_artist INTEGER NOT NULL DEFAULT 0,
  tag_count_copyright INTEGER NOT NULL DEFAULT 0,
  tag_count_character INTEGER NOT NULL DEFAULT 0,
  tag_count_metadata INTEGER NOT NULL DEFAULT 0,

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
  -- Category: 0=general, 1=artist, 2=copyright, 3=character, 4=metadata (matches Danbooru)
  category INTEGER NOT NULL DEFAULT 0 CHECK(category IN (0, 1, 2, 3, 4)),
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

CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_rating ON media(rating);
CREATE INDEX IF NOT EXISTS idx_media_md5 ON media(md5);
CREATE INDEX IF NOT EXISTS idx_media_last_viewed ON media(last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_width ON media(width);
CREATE INDEX IF NOT EXISTS idx_media_height ON media(height);
CREATE INDEX IF NOT EXISTS idx_media_file_size ON media(file_size);
CREATE INDEX IF NOT EXISTS idx_media_parent_id ON media(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_media_type ON media(media_type);

CREATE INDEX IF NOT EXISTS idx_media_tags_media ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag ON media_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_category_usage ON tags(category, usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_view_history_media ON view_history(media_id);
CREATE INDEX IF NOT EXISTS idx_view_history_viewed ON view_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_history_composite ON view_history(media_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_searched ON search_history(searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_media_pool ON collection_media(collection_id, position);
CREATE INDEX IF NOT EXISTS idx_collection_media_post ON collection_media(media_id);

CREATE INDEX IF NOT EXISTS idx_tag_aliases_antecedent ON tag_aliases(antecedent_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tag_implications_child ON tag_implications(child_tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_implications_parent ON tag_implications(parent_tag_id);

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_media_tags_insert
AFTER INSERT ON media_tags
BEGIN
  UPDATE tags
  SET usage_count = usage_count + 1
  WHERE id = NEW.tag_id;

  UPDATE media
  SET tag_count = tag_count + 1,
      tag_count_general = tag_count_general +
        CASE WHEN (SELECT category FROM tags WHERE id = NEW.tag_id) = 0 THEN 1 ELSE 0 END,
      tag_count_artist = tag_count_artist +
        CASE WHEN (SELECT category FROM tags WHERE id = NEW.tag_id) = 1 THEN 1 ELSE 0 END,
      tag_count_copyright = tag_count_copyright +
        CASE WHEN (SELECT category FROM tags WHERE id = NEW.tag_id) = 2 THEN 1 ELSE 0 END,
      tag_count_character = tag_count_character +
        CASE WHEN (SELECT category FROM tags WHERE id = NEW.tag_id) = 3 THEN 1 ELSE 0 END,
      tag_count_metadata = tag_count_metadata +
        CASE WHEN (SELECT category FROM tags WHERE id = NEW.tag_id) = 4 THEN 1 ELSE 0 END,
      updated_at = unixepoch()
  WHERE id = NEW.media_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_media_tags_delete
AFTER DELETE ON media_tags
BEGIN
  UPDATE tags
  SET usage_count = usage_count - 1
  WHERE id = OLD.tag_id;

  UPDATE media
  SET tag_count = tag_count - 1,
      tag_count_general = tag_count_general -
        CASE WHEN (SELECT category FROM tags WHERE id = OLD.tag_id) = 0 THEN 1 ELSE 0 END,
      tag_count_artist = tag_count_artist -
        CASE WHEN (SELECT category FROM tags WHERE id = OLD.tag_id) = 1 THEN 1 ELSE 0 END,
      tag_count_copyright = tag_count_copyright -
        CASE WHEN (SELECT category FROM tags WHERE id = OLD.tag_id) = 2 THEN 1 ELSE 0 END,
      tag_count_character = tag_count_character -
        CASE WHEN (SELECT category FROM tags WHERE id = OLD.tag_id) = 3 THEN 1 ELSE 0 END,
      tag_count_metadata = tag_count_metadata -
        CASE WHEN (SELECT category FROM tags WHERE id = OLD.tag_id) = 4 THEN 1 ELSE 0 END,
      updated_at = unixepoch()
  WHERE id = OLD.media_id;
END;

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

CREATE TRIGGER IF NOT EXISTS trg_view_history_insert
AFTER INSERT ON view_history
BEGIN
  UPDATE media
  SET last_viewed_at = NEW.viewed_at,
      updated_at = unixepoch()
  WHERE id = NEW.media_id;
END;
`
