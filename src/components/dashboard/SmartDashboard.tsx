import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Briefcase, Target, Calendar, Award, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offerReceived: number;
  savedJobs: number;
  applicationSuccessRate: number;
  topAppliedRoles: { role: string; count: number }[];
  topCompanies: { company: string; count: number }[];
  recentActivity: any[];
  applicationsByStatus: { status: string; count: number }[];
}

export const SmartDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    offerReceived: 0,
    savedJobs: 0,
    applicationSuccessRate: 0,
    topAppliedRoles: [],
    topCompanies: [],
    recentActivity: [],
    applicationsByStatus: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all user data in parallel
      const [applicationsResult, savedJobsResult] = await Promise.all([
        supabase
          .from('user_applications')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('saved_jobs')
          .select('*')
          .eq('user_id', user.id)
      ]);

      const applications = applicationsResult.data || [];
      const savedJobs = savedJobsResult.data || [];

      // Calculate statistics
      const totalApplications = applications.length;
      const activeApplications = applications.filter(app => 
        ['applied', 'interviewing'].includes(app.status)
      ).length;
      const interviewsScheduled = applications.filter(app => 
        app.status === 'interviewing'
      ).length;
      const offerReceived = applications.filter(app => 
        app.status === 'offered'
      ).length;
      const successfulApplications = applications.filter(app => 
        ['offered', 'interviewing'].includes(app.status)
      ).length;
      
      const applicationSuccessRate = totalApplications > 0 
        ? Math.round((successfulApplications / totalApplications) * 100)
        : 0;

      // Calculate top roles - using job_id for now since we don't have job titles
      const roleCount: Record<string, number> = {};
      applications.forEach(app => {
        roleCount[app.job_id] = (roleCount[app.job_id] || 0) + 1;
      });
      const topRoles = Object.entries(roleCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([role, count]) => ({ role, count }));

      // Calculate top companies - using job_id for now since we don't have company names
      const companyCount: Record<string, number> = {};
      applications.forEach(app => {
        companyCount[app.job_id] = (companyCount[app.job_id] || 0) + 1;
      });
      const topCompanies = Object.entries(companyCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([company, count]) => ({ company, count }));

      // Applications by status
      const statusCount = applications.reduce((acc: any, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});
      const applicationsByStatus = Object.entries(statusCount)
        .map(([status, count]) => ({ status, count: count as number }));

      // Recent activity
      const recentActivity = applications
        .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
        .slice(0, 10);

      setStats({
        totalApplications,
        activeApplications,
        interviewsScheduled,
        offerReceived,
        savedJobs: savedJobs.length,
        applicationSuccessRate,
        topAppliedRoles: topRoles,
        topCompanies,
        recentActivity,
        applicationsByStatus
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      applied: 'bg-blue-500',
      interviewing: 'bg-yellow-500',
      offered: 'bg-green-500',
      rejected: 'bg-red-500',
      withdrawn: 'bg-gray-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Applications</p>
                <p className="text-2xl font-bold">{stats.activeApplications}</p>
              </div>
              <Target className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interviews</p>
                <p className="text-2xl font-bold">{stats.interviewsScheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.applicationSuccessRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.applicationsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                    <span className="capitalize text-sm">{item.status}</span>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Applied Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Most Applied Job IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topAppliedRoles.length > 0 ? (
                stats.topAppliedRoles.map((role) => (
                  <div key={role.role} className="flex items-center justify-between">
                    <span className="text-sm truncate">{role.role}</span>
                    <Badge variant="outline">{role.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No applications yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Top Job IDs Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCompanies.length > 0 ? (
                stats.topCompanies.map((company) => (
                  <div key={company.company} className="flex items-center justify-between">
                    <span className="text-sm truncate">{company.company}</span>
                    <Badge variant="outline">{company.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No applications yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">Job Application</p>
                      <p className="text-sm text-muted-foreground">Job ID: {activity.job_id}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.applied_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Insights & Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.applicationSuccessRate > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Your application success rate is {stats.applicationSuccessRate}%. 
                  {stats.applicationSuccessRate > 20 
                    ? " Great job! You're performing well."
                    : " Consider improving your application strategy."}
                </p>
              </div>
            )}
            
            {stats.totalApplications === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Start applying to jobs to see your application insights here!
                </p>
              </div>
            )}
            
            {stats.savedJobs > stats.totalApplications && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  You have {stats.savedJobs} saved jobs but only {stats.totalApplications} applications. 
                  Consider applying to some of your saved jobs!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};