import { useState } from 'react';
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobAggregator } from "@/components/jobs/JobAggregator";
import { ApplicationTracker } from "@/components/applications/ApplicationTracker";
import { JobRecommendations } from "@/components/recommendations/JobRecommendations";
import { SmartDashboard } from "@/components/dashboard/SmartDashboard";
import { Search, Briefcase, Sparkles, BarChart3 } from "lucide-react";

const JobPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <Layout>
      <Helmet>
        <title>Job Portal - Find Your Dream Job</title>
        <meta 
          name="description" 
          content="Advanced job portal with AI recommendations, application tracking, and job aggregation from multiple sources" 
        />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Job Portal</h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered job search companion
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="aggregator" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Job Search
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SmartDashboard />
          </TabsContent>

          <TabsContent value="aggregator" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Job Aggregator</h2>
              <p className="text-muted-foreground">
                Search and scrape jobs from multiple job boards
              </p>
            </div>
            <JobAggregator />
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationTracker />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <JobRecommendations />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default JobPortal;