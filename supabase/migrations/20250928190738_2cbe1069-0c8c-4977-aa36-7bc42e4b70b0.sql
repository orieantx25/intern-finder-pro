-- Enable cron extension for automated job scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run the job crawler every 12 hours
-- Run at 6 AM and 6 PM daily (UTC)
SELECT cron.schedule(
  'qrate-job-crawler-automation',
  '0 6,18 * * *',
  $$
  SELECT
    net.http_post(
        url := 'https://flyqofieagfdvjjvcunv.supabase.co/functions/v1/job-scheduler',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseXFvZmllYWdmZHZqanZjdW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5ODc0NTYsImV4cCI6MjA3NDU2MzQ1Nn0.HxSS1epLwwxQIbaWS31zEhgyeY2I3tzlePo8mccmwS0"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Insert some popular Indian job sources for the crawler
INSERT INTO job_sources (name, base_url, is_active) VALUES
('Naukri.com', 'https://www.naukri.com', true),
('Indeed India', 'https://indeed.co.in', true),
('LinkedIn India', 'https://www.linkedin.com/jobs', true),
('AngelList India', 'https://angel.co/jobs', true),
('Freshersworld', 'https://www.freshersworld.com', true)
ON CONFLICT (name) DO UPDATE SET 
  base_url = EXCLUDED.base_url,
  is_active = EXCLUDED.is_active;