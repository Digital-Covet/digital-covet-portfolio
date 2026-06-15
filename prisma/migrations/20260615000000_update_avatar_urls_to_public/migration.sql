-- Update avatar URLs from /api/file to /api/public/file
-- This allows avatars to be accessed by other internal projects without authentication
UPDATE "user"
SET "image" = REPLACE("image", '/api/file?key=', '/api/public/file?key=')
WHERE "image" LIKE '/api/file?key=avatars%';
