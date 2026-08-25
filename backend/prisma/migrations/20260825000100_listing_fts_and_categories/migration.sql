-- Full-text search index (title + description) using PostgreSQL tsvector
CREATE INDEX IF NOT EXISTS "Listing_fts_idx"
ON "Listing"
USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Reference categories in Postgres (not demo users/listings)
INSERT INTO "Category" (id, name)
SELECT v.id, v.name
FROM (VALUES
  ('a1b2c3d4-e5f6-7890-abcd-000000000001', 'Electronics'),
  ('a1b2c3d4-e5f6-7890-abcd-000000000002', 'Clothing'),
  ('a1b2c3d4-e5f6-7890-abcd-000000000003', 'Furniture'),
  ('a1b2c3d4-e5f6-7890-abcd-000000000004', 'Books'),
  ('a1b2c3d4-e5f6-7890-abcd-000000000005', 'Vehicles'),
  ('a1b2c3d4-e5f6-7890-abcd-000000000006', 'Kitchen'),
  ('a1b2c3d4-e5f6-7890-abcd-000000000007', 'Tools'),
  ('a1b2c3d4-e5f6-7890-abcd-000000000008', 'Other')
) AS v(id, name)
WHERE NOT EXISTS (
  SELECT 1 FROM "Category" c WHERE c.name = v.name
);
