-- Security fixes for PII exposure
-- Run this in Supabase SQL Editor

-- 1. Add author_display_name column to comments (derived from email, not the full email)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_display_name TEXT;

-- 2. Backfill existing comments with display names (username part of email)
UPDATE comments 
SET author_display_name = split_part(author_email, '@', 1)
WHERE author_display_name IS NULL AND author_email IS NOT NULL;

-- 3. Create a secure view for comments that hides author_email
CREATE OR REPLACE VIEW public_comments AS
SELECT 
  id,
  submission_id,
  user_id,
  author_display_name,
  content,
  created_at
FROM comments;

-- 4. Grant access to the view (anon and authenticated can read)
GRANT SELECT ON public_comments TO anon, authenticated;

-- 5. Create a secure view for submissions that hides PII (submitted_for_contact)
CREATE OR REPLACE VIEW public_submissions AS
SELECT 
  id,
  title,
  description,
  presenter_name,
  links,
  submission_type,
  submitted_by,
  submitted_for_name,  -- Keep name, hide contact
  is_openclaw_contributor,
  created_at
FROM submissions;

-- 6. Grant access to the submissions view
GRANT SELECT ON public_submissions TO anon, authenticated;

-- 7. Update comments insert to auto-populate display name
CREATE OR REPLACE FUNCTION set_comment_display_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_email IS NOT NULL AND NEW.author_display_name IS NULL THEN
    NEW.author_display_name := split_part(NEW.author_email, '@', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_comment_display_name_trigger ON comments;
CREATE TRIGGER set_comment_display_name_trigger
  BEFORE INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_display_name();

-- 8. Restrict direct table access (optional - more secure but may break existing queries)
-- Uncomment these if you want to force use of views only:
-- REVOKE SELECT ON comments FROM anon;
-- REVOKE SELECT ON submissions FROM anon;
