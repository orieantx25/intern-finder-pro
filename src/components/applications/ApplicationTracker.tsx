import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Building, MapPin, Clock, Plus } from "lucide-react";

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  status: string;
  application_date: string;
  notes?: string;
  applied_through?: string;
  interview_date?: string;
  follow_up_date?: string;
}

export const ApplicationTracker = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newApplication, setNewApplication] = useState({
    job_title: '',
    company_name: '',
    status: 'applied',
    notes: '',
    applied_through: 'manual',
    interview_date: '',
    follow_up_date: ''
  });

  const statusOptions = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { value: 'interview', label: 'Interview', color: 'bg-yellow-500' },
    { value: 'offer', label: 'Offer', color: 'bg-green-500' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
    { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-500' }
  ];

  const appliedThroughOptions = [
    { value: 'our_portal', label: 'Our Portal' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'indeed', label: 'Indeed' },
    { value: 'glassdoor', label: 'Glassdoor' },
    { value: 'company_website', label: 'Company Website' },
    { value: 'manual', label: 'Manual/Other' }
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('application_date', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApplication = async () => {
    if (!newApplication.job_title.trim() || !newApplication.company_name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in job title and company name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_applications')
        .insert({
          user_id: user.id,
          job_title: newApplication.job_title,
          company_name: newApplication.company_name,
          status: newApplication.status,
          notes: newApplication.notes || null,
          applied_through: newApplication.applied_through,
          interview_date: newApplication.interview_date || null,
          follow_up_date: newApplication.follow_up_date || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application added successfully",
      });

      setNewApplication({
        job_title: '',
        company_name: '',
        status: 'applied',
        notes: '',
        applied_through: 'manual',
        interview_date: '',
        follow_up_date: ''
      });
      setShowAddDialog(false);
      fetchApplications();
    } catch (error) {
      console.error('Error adding application:', error);
      toast({
        title: "Error",
        description: "Failed to add application",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application status updated",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <Badge 
        className={`${statusOption?.color} text-white`}
      >
        {statusOption?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Application Tracker</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={newApplication.job_title}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="Software Engineer"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={newApplication.company_name}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Tech Corp"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={newApplication.status} onValueChange={(value) => setNewApplication(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Applied Through</label>
                <Select value={newApplication.applied_through} onValueChange={(value) => setNewApplication(prev => ({ ...prev, applied_through: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appliedThroughOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={newApplication.notes}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Interview scheduled for next week..."
                  rows={3}
                />
              </div>
              
              <Button onClick={handleAddApplication} className="w-full">
                Add Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {applications.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your job applications to stay organized</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Application
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <Card key={application.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{application.job_title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {application.company_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(application.application_date).toLocaleDateString()}
                    </div>
                    {application.applied_through && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {appliedThroughOptions.find(opt => opt.value === application.applied_through)?.label}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(application.status)}
                  <Select value={application.status} onValueChange={(value) => handleUpdateStatus(application.id, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {application.notes && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm">{application.notes}</p>
                </div>
              )}
              
              {(application.interview_date || application.follow_up_date) && (
                <div className="mt-4 flex gap-4 text-sm">
                  {application.interview_date && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="w-4 h-4" />
                      Interview: {new Date(application.interview_date).toLocaleDateString()}
                    </div>
                  )}
                  {application.follow_up_date && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-4 h-4" />
                      Follow-up: {new Date(application.follow_up_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};