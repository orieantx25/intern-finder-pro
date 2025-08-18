-- Create jobs table for storing scraped job listings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE, -- ID from source job board
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  type TEXT, -- full-time, part-time, contract, internship
  remote BOOLEAN DEFAULT false,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  description TEXT,
  requirements TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL, -- job board source (linkedin, indeed, etc)
  posted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create index for better performance
CREATE INDEX idx_jobs_title ON public.jobs(title);
CREATE INDEX idx_jobs_company ON public.jobs(company);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_type ON public.jobs(type);
CREATE INDEX idx_jobs_remote ON public.jobs(remote);
CREATE INDEX idx_jobs_source ON public.jobs(source);
CREATE INDEX idx_jobs_posted_at ON public.jobs(posted_at);
CREATE INDEX idx_jobs_external_id ON public.jobs(external_id);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to jobs
CREATE POLICY "Jobs are viewable by everyone" 
ON public.jobs 
FOR SELECT 
USING (is_active = true);

-- Create user_applications table for tracking job applications
CREATE TABLE public.user_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  external_job_id TEXT, -- For jobs not in our system
  job_title TEXT,
  company_name TEXT,
  application_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'applied', -- applied, interview, rejected, offer, withdrawn
  notes TEXT,
  applied_through TEXT, -- our_portal, linkedin, indeed, manual, etc
  interview_date TIMESTAMP WITH TIME ZONE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for user_applications
CREATE INDEX idx_user_applications_user_id ON public.user_applications(user_id);
CREATE INDEX idx_user_applications_job_id ON public.user_applications(job_id);
CREATE INDEX idx_user_applications_status ON public.user_applications(status);
CREATE INDEX idx_user_applications_application_date ON public.user_applications(application_date);

-- Enable RLS
ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_applications
CREATE POLICY "Users can view their own applications" 
ON public.user_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON public.user_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
ON public.user_applications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" 
ON public.user_applications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create job_sources table to track scraping sources
CREATE TABLE public.job_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_frequency_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to job sources
CREATE POLICY "Job sources are viewable by everyone" 
ON public.job_sources 
FOR SELECT 
USING (true);

-- Insert some initial job sources
INSERT INTO public.job_sources (name, base_url, scrape_frequency_hours) VALUES
('Indeed', 'https://www.indeed.com', 12),
('LinkedIn', 'https://www.linkedin.com/jobs', 6),
('Glassdoor', 'https://www.glassdoor.com', 24),
('AngelList', 'https://angel.co', 24),
('RemoteOK', 'https://remoteok.io', 12),
('WeWorkRemotely', 'https://weworkremotely.com', 24);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_applications_updated_at
  BEFORE UPDATE ON public.user_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_sources_updated_at
  BEFORE UPDATE ON public.job_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();