-- Migration: expand activity_categories table to support full multi-language hierarchy
-- Adds: label_ja, label_zh, label_ko, label_ru, emoji, parent_key, sort_order
-- Converts existing icon column -> keeps it, adds emoji alias
-- Adds parent_key as self-referencing FK to support sub-categories

-- Add new language columns if they don't exist
ALTER TABLE activity_categories
  ADD COLUMN IF NOT EXISTS label_ja text,
  ADD COLUMN IF NOT EXISTS label_zh text,
  ADD COLUMN IF NOT EXISTS label_ko text,
  ADD COLUMN IF NOT EXISTS label_ru text,
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS parent_key text REFERENCES activity_categories(key) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Copy any existing icon values into emoji if emoji is still null
UPDATE activity_categories SET emoji = icon WHERE emoji IS NULL AND icon IS NOT NULL;

-- Index for fast parent lookups
CREATE INDEX IF NOT EXISTS idx_activity_categories_parent_key ON activity_categories(parent_key);
CREATE INDEX IF NOT EXISTS idx_activity_categories_sort_order ON activity_categories(sort_order);
