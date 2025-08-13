-- Create utility function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Saved Jobs table: allows users to bookmark external job posts
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  type TEXT,
  remote BOOLEAN,
  url TEXT NOT NULL,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_saved_job_per_user UNIQUE (user_id, job_external_id)
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved jobs" ON public.saved_jobs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved jobs" ON public.saved_jobs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved jobs" ON public.saved_jobs
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved jobs" ON public.saved_jobs
FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_external_id ON public.saved_jobs (job_external_id);

CREATE TRIGGER update_saved_jobs_updated_at
BEFORE UPDATE ON public.saved_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job Alerts table: lets users configure simple alerts
CREATE TABLE IF NOT EXISTS public.job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  keywords TEXT,
  location TEXT,
  cadence TEXT NOT NULL DEFAULT 'weekly', -- allowed values: daily | weekly
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job alerts" ON public.job_alerts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job alerts" ON public.job_alerts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job alerts" ON public.job_alerts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job alerts" ON public.job_alerts
FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON public.job_alerts (user_id);

CREATE TRIGGER update_job_alerts_updated_at
BEFORE UPDATE ON public.job_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Articles table: public-readable list of curated articles
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public can read articles
CREATE POLICY "Articles are viewable by everyone" ON public.articles
FOR SELECT USING (true);

-- Only authors can manage their own articles
CREATE POLICY "Users can insert their own articles" ON public.articles
FOR INSERT WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Users can update their own articles" ON public.articles
FOR UPDATE USING (auth.uid() = author_user_id);

CREATE POLICY "Users can delete their own articles" ON public.articles
FOR DELETE USING (auth.uid() = author_user_id);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles (published_at DESC);

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();