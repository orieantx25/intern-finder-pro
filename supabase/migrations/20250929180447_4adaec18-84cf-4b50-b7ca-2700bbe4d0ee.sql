-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to invoke the job crawler
CREATE OR REPLACE FUNCTION public.trigger_job_crawler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called by cron to trigger the job crawler edge function
  PERFORM net.http_post(
    url := 'https://flyqofieagfdvjjvcunv.supabase.co/functions/v1/job-crawler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseXFvZmllYWdmZHZqanZjdW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5ODc0NTYsImV4cCI6MjA3NDU2MzQ1Nn0.HxSS1epLwwxQIbaWS31zEhgyeY2I3tzlePo8mccmwS0'
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the crawler to run every 12 hours (at 6 AM and 6 PM UTC)
SELECT cron.schedule(
  'qrate-job-crawler-12h',
  '0 6,18 * * *',  -- At 6:00 AM and 6:00 PM every day
  'SELECT public.trigger_job_crawler();'
);

-- Create a table to track cron job execution history
CREATE TABLE IF NOT EXISTS public.crawler_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL,
  jobs_found INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  error_message TEXT
);

-- Enable RLS on the log table
ALTER TABLE public.crawler_execution_log ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view the logs (for admin dashboard)
CREATE POLICY "Crawler logs are viewable by everyone"
ON public.crawler_execution_log
FOR SELECT
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;