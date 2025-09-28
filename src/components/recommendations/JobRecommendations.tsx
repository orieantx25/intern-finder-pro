import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, User, Briefcase } from "lucide-react";

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  remote: boolean;
  description: string;
  url: string;
  source: string;
  score: number;
  reasons: string[];
}

export const JobRecommendations = () => {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchUserProfileAndRecommendations();
  }, []);

  const fetchUserProfileAndRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);

      // Fetch user's saved jobs and applications for preference learning
      const [savedJobsResult, applicationsResult, allJobsResult] = await Promise.all([
        supabase.from('saved_jobs').select('*').eq('user_id', user.id),
        supabase.from('user_applications').select('*').eq('user_id', user.id),
        supabase.from('jobs').select('*').eq('is_active', true).limit(100)
      ]);

      const savedJobs = savedJobsResult.data || [];
      const applications = applicationsResult.data || [];
      const allJobs = allJobsResult.data || [];

      // Generate recommendations based on user data
      const recommendations = await generateRecommendations(profile, savedJobs, applications, allJobs);
      setRecommendations(recommendations);

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = async (
    profile: any,
    savedJobs: any[],
    applications: any[],
    allJobs: any[]
  ): Promise<RecommendedJob[]> => {
    const recommendations: RecommendedJob[] = [];

    // Extract user preferences from saved jobs and applications
    const userPreferences = extractUserPreferences(savedJobs, applications);
    
    for (const job of allJobs) {
      const score = calculateJobScore(job, profile, userPreferences);
      const reasons = generateReasons(job, profile, userPreferences, score);

      if (score > 0.3) { // Only recommend jobs with score > 30%
        recommendations.push({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location || 'Not specified',
          type: job.type || 'Full-time',
          remote: job.remote || false,
          description: job.description || '',
          url: job.url,
          source: job.source,
          score: Math.round(score * 100),
          reasons
        });
      }
    }

    // Sort by score and return top 10
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  const extractUserPreferences = (savedJobs: any[], applications: any[]) => {
    const preferences = {
      preferredTitles: new Set<string>(),
      preferredCompanies: new Set<string>(),
      preferredLocations: new Set<string>(),
      preferredTypes: new Set<string>(),
      prefersRemote: false,
      keywords: new Set<string>()
    };

    // Extract from saved jobs
    savedJobs.forEach(job => {
      if (job.title) preferences.preferredTitles.add(job.title.toLowerCase());
      if (job.company) preferences.preferredCompanies.add(job.company.toLowerCase());
      if (job.location) preferences.preferredLocations.add(job.location.toLowerCase());
      if (job.type) preferences.preferredTypes.add(job.type.toLowerCase());
      if (job.remote) preferences.prefersRemote = true;
    });

    // Extract from applications
    applications.forEach(app => {
      if (app.job_title) preferences.preferredTitles.add(app.job_title.toLowerCase());
      if (app.company_name) preferences.preferredCompanies.add(app.company_name.toLowerCase());
    });

    return preferences;
  };

  const calculateJobScore = (job: any, profile: any, preferences: any): number => {
    let score = 0;

    // Title similarity (30% weight)
    if (preferences.preferredTitles.size > 0) {
      const titleSimilarity = Array.from(preferences.preferredTitles).some((title: any) =>
        job.title.toLowerCase().includes(title) || title.includes(job.title.toLowerCase())
      );
      if (titleSimilarity) score += 0.3;
    }

    // Company preference (10% weight)
    if (preferences.preferredCompanies.has(job.company?.toLowerCase())) {
      score += 0.1;
    }

    // Location preference (15% weight)
    if (preferences.preferredLocations.size > 0) {
      const locationMatch = Array.from(preferences.preferredLocations).some((loc: any) =>
        job.location?.toLowerCase().includes(loc) || loc.includes(job.location?.toLowerCase())
      );
      if (locationMatch) score += 0.15;
    }

    // Remote preference (10% weight)
    if (preferences.prefersRemote && job.remote) {
      score += 0.1;
    }

    // Education background match (20% weight)
    if (profile?.education_background && job.description) {
      const educationKeywords = profile.education_background.toLowerCase().split(' ');
      const hasEducationMatch = educationKeywords.some((keyword: string) =>
        keyword.length > 3 && job.description.toLowerCase().includes(keyword)
      );
      if (hasEducationMatch) score += 0.2;
    }

    // College name recognition (15% weight)
    if (profile?.college_name && job.description) {
      const collegeMatch = job.description.toLowerCase().includes(profile.college_name.toLowerCase());
      if (collegeMatch) score += 0.15;
    }

    return Math.min(score, 1); // Cap at 100%
  };

  const generateReasons = (job: any, profile: any, preferences: any, score: number): string[] => {
    const reasons: string[] = [];

    if (Array.from(preferences.preferredTitles).some((title: any) =>
      job.title.toLowerCase().includes(title))) {
      reasons.push("Similar to jobs you've saved");
    }

    if (preferences.preferredCompanies.has(job.company?.toLowerCase())) {
      reasons.push("Company you've shown interest in");
    }

    if (job.remote && preferences.prefersRemote) {
      reasons.push("Remote work opportunity");
    }

    if (profile?.education_background && job.description) {
      const educationKeywords = profile.education_background.toLowerCase().split(' ');
      const hasMatch = educationKeywords.some((keyword: string) =>
        keyword.length > 3 && job.description.toLowerCase().includes(keyword)
      );
      if (hasMatch) {
        reasons.push("Matches your educational background");
      }
    }

    if (score > 0.7) {
      reasons.push("High compatibility match");
    }

    return reasons;
  };

  const handleSaveJob = async (job: RecommendedJob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

    const { error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        job_id: job.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job saved successfully",
      });
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading recommendations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Recommended Jobs</h2>
      </div>

      {!userProfile?.profile_completed && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <p className="text-sm text-yellow-800">
            Complete your profile to get better job recommendations!
          </p>
        </Card>
      )}

      {recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
          <p className="text-muted-foreground">
            Save some jobs or complete applications to get personalized recommendations
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {recommendations.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.company}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {job.location}
                      </div>
                      {job.remote && (
                        <Badge variant="secondary">Remote</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {job.score}% Match
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {job.reasons.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Why this job?</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.reasons.map((reason, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {job.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSaveJob(job)}
                  >
                    Save Job
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => window.open(job.url, '_blank')}
                  >
                    View Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};