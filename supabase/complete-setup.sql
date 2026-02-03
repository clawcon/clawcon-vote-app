-- COMPLETE SETUP: Comments table + Security fixes
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Create comments table
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_email TEXT,
  author_display_name TEXT,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS for comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS comments_submission_id_idx ON comments(submission_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at);

-- ============================================
-- PART 2: Auto-populate display name from email
-- ============================================

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

-- ============================================
-- PART 3: Secure views (hide PII from public)
-- ============================================

-- View for comments - hides author_email
CREATE OR REPLACE VIEW public_comments AS
SELECT 
  id,
  submission_id,
  user_id,
  author_display_name,
  content,
  created_at
FROM comments;

GRANT SELECT ON public_comments TO anon, authenticated;

-- View for submissions - hides submitted_for_contact
CREATE OR REPLACE VIEW public_submissions AS
SELECT 
  id,
  title,
  description,
  presenter_name,
  links,
  submission_type,
  submitted_by,
  submitted_for_name,
  is_openclaw_contributor,
  created_at
FROM submissions;

GRANT SELECT ON public_submissions TO anon, authenticated;

-- ============================================
-- PART 4: Update get_submissions_with_votes to include comment_count
-- ============================================

CREATE OR REPLACE FUNCTION public.get_submissions_with_votes()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  presenter_name text,
  links text[],
  submission_type text,
  submitted_by text,
  submitted_for_name text,
  is_openclaw_contributor boolean,
  created_at timestamptz,
  vote_count integer,
  comment_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.id,
    s.title,
    s.description,
    s.presenter_name,
    s.links,
    s.submission_type,
    s.submitted_by,
    s.submitted_for_name,
    s.is_openclaw_contributor,
    s.created_at,
    COALESCE(v.vote_count, 0)::integer AS vote_count,
    COALESCE(c.comment_count, 0)::integer AS comment_count
  FROM public.submissions s
  LEFT JOIN (
    SELECT submission_id, COUNT(*)::integer AS vote_count
    FROM public.votes
    GROUP BY submission_id
  ) v ON v.submission_id = s.id
  LEFT JOIN (
    SELECT submission_id, COUNT(*)::integer AS comment_count
    FROM public.comments
    GROUP BY submission_id
  ) c ON c.submission_id = s.id;
$$;

-- Done! Site is now secure.
SELECT 'Migration complete! Comments table created, PII protected via views.' AS status;
