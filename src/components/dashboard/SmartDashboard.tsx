import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Briefcase, Target, Calendar, Award, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        ['applied', 'interview'].includes(app.status)
      ).length;
      const interviewsScheduled = applications.filter(app => 
        app.status === 'interview'
      ).length;
      const offerReceived = applications.filter(app => 
        app.status === 'offer'
      ).length;
      const successfulApplications = applications.filter(app => 
        ['offer', 'interview'].includes(app.status)
      ).length;
      
      const applicationSuccessRate = totalApplications > 0 
        ? Math.round((successfulApplications / totalApplications) * 100)
        : 0;

      // Top applied roles
      const roleCount = applications.reduce((acc: any, app) => {
        acc[app.job_title] = (acc[app.job_title] || 0) + 1;
        return acc;
      }, {});
      const topAppliedRoles = Object.entries(roleCount)
        .map(([role, count]) => ({ role, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top companies
      const companyCount = applications.reduce((acc: any, app) => {
        acc[app.company_name] = (acc[app.company_name] || 0) + 1;
        return acc;
      }, {});
      const topCompanies = Object.entries(companyCount)
        .map(([company, count]) => ({ company, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Applications by status
      const statusCount = applications.reduce((acc: any, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});
      const applicationsByStatus = Object.entries(statusCount)
        .map(([status, count]) => ({ status, count: count as number }));

      // Recent activity (last 10 applications)
      const recentActivity = applications
        .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime())
        .slice(0, 10);

      setStats({
        totalApplications,
        activeApplications,
        interviewsScheduled,
        offerReceived,
        savedJobs: savedJobs.length,
        applicationSuccessRate,
        topAppliedRoles,
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
      interview: 'bg-yellow-500',
      offer: 'bg-green-500',
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
            <CardTitle>Most Applied Roles</CardTitle>
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
            <CardTitle>Top Companies Applied</CardTitle>
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
                  <div key={activity.id} className="flex items-center gap-3 p-2 border rounded-md">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.job_title}</p>
                      <p className="text-xs text-muted-foreground">{activity.company_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.application_date).toLocaleDateString()}
                    </p>
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