-- 1) Applicants table for job seeker details and resume reference
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  skills TEXT, -- comma separated skills or freeform
  linkedin_url TEXT,
  portfolio_url TEXT,
  summary TEXT,
  resume_path TEXT NOT NULL, -- storage path in 'resumes' bucket
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Policies: users manage only their own applications
CREATE POLICY "Users can view their own applications"
  ON public.applicants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
  ON public.applicants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON public.applicants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
  ON public.applicants FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_applicants_updated_at'
  ) THEN
    CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON public.applicants(user_id);

-- 2) Storage bucket for resumes (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for 'resumes' bucket
-- Allow users to read their own files
CREATE POLICY IF NOT EXISTS "Users can read their own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload files to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update/delete their own files
CREATE POLICY IF NOT EXISTS "Users can modify their own resumes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
