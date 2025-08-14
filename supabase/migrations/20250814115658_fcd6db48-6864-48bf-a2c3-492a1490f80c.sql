-- Applicants table and RLS for resume submissions
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  skills TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  summary TEXT,
  resume_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Policies wrapped in conditional DO blocks (no IF NOT EXISTS support on CREATE POLICY)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applicants' AND policyname='Users can view their own applications'
  ) THEN
    CREATE POLICY "Users can view their own applications"
      ON public.applicants FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applicants' AND policyname='Users can insert their own applications'
  ) THEN
    CREATE POLICY "Users can insert their own applications"
      ON public.applicants FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applicants' AND policyname='Users can update their own applications'
  ) THEN
    CREATE POLICY "Users can update their own applications"
      ON public.applicants FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applicants' AND policyname='Users can delete their own applications'
  ) THEN
    CREATE POLICY "Users can delete their own applications"
      ON public.applicants FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_applicants_updated_at'
  ) THEN
    CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON public.applicants(user_id);

-- Storage bucket for resumes (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for 'resumes' bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can read their own resumes'
  ) THEN
    CREATE POLICY "Users can read their own resumes"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'resumes'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload their own resumes'
  ) THEN
    CREATE POLICY "Users can upload their own resumes"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'resumes'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can modify their own resumes'
  ) THEN
    CREATE POLICY "Users can modify their own resumes"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'resumes'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'resumes'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete their own resumes'
  ) THEN
    CREATE POLICY "Users can delete their own resumes"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'resumes'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;