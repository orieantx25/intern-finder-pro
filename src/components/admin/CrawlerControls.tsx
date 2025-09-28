import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, Clock, Database } from "lucide-react";

interface CrawlerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  jobsExtracted: number;
  duplicatesSkipped: number;
}

interface CrawlResult {
  source: string;
  jobsFound: number;
  success: boolean;
  error?: string;
  stats?: CrawlerStats;
}

export const CrawlerControls = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const runCrawler = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setTotalJobs(0);
    setExecutionTime(null);

    try {
      toast({
        title: "🚀 Starting Crawler",
        description: "Qrate's AI-powered job crawler is now running...",
      });

      setProgress(25);

      // Call the job crawler function
      const { data, error } = await supabase.functions.invoke('job-crawler');

      setProgress(90);

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.success) {
        setResults(data.results || []);
        setTotalJobs(data.totalJobsFound || 0);
        setExecutionTime(data.executionTimeMs || null);
        
        toast({
          title: "✅ Crawl Completed",
          description: `Found ${data.totalJobsFound} new jobs across ${data.results?.length || 0} sources`,
        });
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Crawler error:', error);
      toast({
        title: "❌ Crawl Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const triggerScheduler = async () => {
    try {
      toast({
        title: "⏰ Triggering Scheduler",
        description: "Checking if automated crawl should run...",
      });

      const { data, error } = await supabase.functions.invoke('job-scheduler');

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast({
          title: "✅ Scheduler Triggered",
          description: data.message || "Scheduler executed successfully",
        });
      } else {
        toast({
          title: "ℹ️ Scheduler Response",
          description: data?.message || "Scheduler completed",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Scheduler Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Qrate Job Crawler Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={runCrawler}
              disabled={isRunning}
              className="flex items-center gap-2"
              size="lg"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? "Crawling..." : "Run Crawler Now"}
            </Button>

            <Button
              onClick={triggerScheduler}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              <Clock className="h-4 w-4" />
              Trigger Scheduler
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Crawling job portals and company websites...
              </p>
            </div>
          )}

          {totalJobs > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Crawl Completed Successfully
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Found {totalJobs} new jobs
                    {executionTime && ` in ${(executionTime / 1000).toFixed(1)}s`}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  {totalJobs} Jobs
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Crawl Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{result.source}</h4>
                      {result.success ? (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✅ Found {result.jobsFound} jobs
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          ❌ {result.error || 'Failed to crawl'}
                        </p>
                      )}
                      {result.stats && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Requests: {result.stats.successfulRequests}/{result.stats.totalRequests} • 
                          Extracted: {result.stats.jobsExtracted} • 
                          Duplicates: {result.stats.duplicatesSkipped}
                        </p>
                      )}
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">🤖 Automated Crawling</h4>
              <p className="text-muted-foreground">
                Runs every 12 hours (6 AM & 6 PM UTC) to discover new job postings from major Indian job portals.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🎯 Smart Extraction</h4>
              <p className="text-muted-foreground">
                Uses AI-powered parsing to extract job titles, companies, locations, skills, and experience requirements.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🚫 Duplicate Prevention</h4>
              <p className="text-muted-foreground">
                Automatically detects and prevents duplicate job postings using advanced fingerprinting.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🤝 Respectful Crawling</h4>
              <p className="text-muted-foreground">
                Respects robots.txt, implements rate limiting, and uses polite crawling practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};