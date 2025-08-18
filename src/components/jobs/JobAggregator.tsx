import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from '@/utils/FirecrawlService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const JobAggregator = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapedJobs, setScrapedJobs] = useState<any[]>([]);

  const jobSources = [
    { name: 'Indeed', baseUrl: 'https://www.indeed.com/jobs?q=', locationParam: '&l=' },
    { name: 'RemoteOK', baseUrl: 'https://remoteok.io/remote-jobs/', locationParam: '' },
    { name: 'WeWorkRemotely', baseUrl: 'https://weworkremotely.com/remote-jobs/search?term=', locationParam: '' },
  ];

  const handleScrapeJobs = async () => {
    if (!searchQuery.trim() || !selectedSource) {
      toast({
        title: "Error",
        description: "Please enter a search query and select a job source",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setScrapedJobs([]);

    try {
      const source = jobSources.find(s => s.name === selectedSource);
      if (!source) return;

      // Construct search URL
      const searchUrl = `${source.baseUrl}${encodeURIComponent(searchQuery)}${source.locationParam}${encodeURIComponent(location)}`;
      
      setProgress(25);
      
      // Use Firecrawl to scrape job listings
      const result = await FirecrawlService.crawlWebsite(searchUrl, {
        limit: 20,
        scrapeOptions: { 
          formats: ["markdown", "html"],
          includeTags: ['.job', '.jobsearch-SerpJobCard', '.jobs-search__results-list', '[data-jk]'],
          excludeTags: ['nav', 'footer', '.advertisement']
        }
      });

      setProgress(75);

      if (result.success && result.data) {
        // Parse and store jobs in database
        const jobs = parseJobsFromCrawlData(result.data, selectedSource);
        await storeJobsInDatabase(jobs);
        setScrapedJobs(jobs);
        
        toast({
          title: "Success",
          description: `Found and stored ${jobs.length} jobs from ${selectedSource}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to scrape jobs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scraping jobs:', error);
      toast({
        title: "Error",
        description: "Failed to scrape jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const parseJobsFromCrawlData = (crawlData: any, source: string) => {
    // This is a simplified parser - in reality, you'd need specific parsers for each job board
    const jobs = [];
    
    if (crawlData.data && Array.isArray(crawlData.data)) {
      for (const page of crawlData.data) {
        if (page.markdown || page.html) {
          // Basic job extraction from markdown/html content
          // This would need to be enhanced with proper parsing logic for each job board
          const jobTitle = extractJobTitle(page.markdown || page.html);
          const company = extractCompany(page.markdown || page.html);
          const jobLocation = extractLocation(page.markdown || page.html);
          
          if (jobTitle && company) {
            jobs.push({
              title: jobTitle,
              company: company,
              location: jobLocation || location,
              source: source.toLowerCase(),
              url: page.sourceURL || '',
              description: page.markdown || '',
              posted_at: new Date().toISOString(),
              external_id: `${source.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
          }
        }
      }
    }
    
    return jobs;
  };

  const extractJobTitle = (content: string): string | null => {
    // Simple regex to extract job titles - would need refinement
    const titleMatch = content.match(/(?:Job Title:|Position:|Role:)\s*([^\n]+)/i) ||
                      content.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i) ||
                      content.match(/^#\s+(.+)/m);
    return titleMatch ? titleMatch[1].trim() : null;
  };

  const extractCompany = (content: string): string | null => {
    const companyMatch = content.match(/(?:Company:|at |@)\s*([^\n]+)/i) ||
                        content.match(/\*\*([^*]+)\*\*/);
    return companyMatch ? companyMatch[1].trim() : null;
  };

  const extractLocation = (content: string): string | null => {
    const locationMatch = content.match(/(?:Location:|Based in:|Remote|Hybrid)\s*([^\n]+)/i);
    return locationMatch ? locationMatch[1].trim() : null;
  };

  const storeJobsInDatabase = async (jobs: any[]) => {
    for (const job of jobs) {
      try {
        const { error } = await supabase
          .from('jobs')
          .insert({
            external_id: job.external_id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            source: job.source,
            posted_at: job.posted_at,
            type: 'full-time', // Default, could be enhanced
            remote: job.location?.toLowerCase().includes('remote') || false
          });

        if (error && !error.message.includes('duplicate key')) {
          console.error('Error storing job:', error);
        }
      } catch (error) {
        console.error('Error storing job:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Job Aggregator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Keywords</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Software Engineer, React Developer"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, Remote"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Source</label>
            <Select value={selectedSource} onValueChange={setSelectedSource} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select job board" />
              </SelectTrigger>
              <SelectContent>
                {jobSources.map((source) => (
                  <SelectItem key={source.name} value={source.name}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <Progress value={progress} className="w-full" />
        )}

        <Button
          onClick={handleScrapeJobs}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Scraping Jobs..." : "Scrape Jobs"}
        </Button>

        {scrapedJobs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Found {scrapedJobs.length} Jobs</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scrapedJobs.map((job, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <p className="text-sm">{job.location}</p>
                    <p className="text-xs text-muted-foreground">Source: {job.source}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};