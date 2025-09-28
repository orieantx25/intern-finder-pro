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
import { formatDistanceToNow } from "date-fns";

interface Application {
  id?: string;
  job_id: string;
  user_id: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  applied_at: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const ApplicationTracker = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newApplication, setNewApplication] = useState({
    job_id: '',
    status: 'applied' as Application['status'],
    applied_at: new Date().toISOString(),
    notes: '',
  });

  const statusOptions = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-500' },
    { value: 'offered', label: 'Offered', color: 'bg-green-500' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
    { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-500' }
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data as Application[]) || []);
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_applications')
        .insert([{
          user_id: session.user.id,
          job_id: newApplication.job_id,
          status: newApplication.status,
          applied_at: newApplication.applied_at,
          notes: newApplication.notes || null,
        }])
        .select();

      if (error) throw error;

      setApplications(prev => [(data[0] as Application), ...prev]);
      setNewApplication({
        job_id: '',
        status: 'applied' as Application['status'],
        applied_at: new Date().toISOString(),
        notes: '',
      });
      setShowAddDialog(false);
      
      toast({
        title: "Success",
        description: "Application added successfully",
      });
    } catch (error) {
      console.error('Error adding application:', error);
      toast({
        title: "Error",
        description: "Failed to add application",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: Application['status']) => {
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
                <label className="text-sm font-medium">Job ID</label>
                <Input
                  value={newApplication.job_id || ''}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, job_id: e.target.value }))}
                  placeholder="Enter job ID"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={newApplication.status} onValueChange={(value) => setNewApplication(prev => ({ ...prev, status: value as Application['status'] }))}>
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
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={newApplication.notes || ''}
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
            <Card key={application.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Job Application</span>
                  {getStatusBadge(application.status)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Job ID: {application.job_id}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Applied:</strong> {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                  </p>
                  {application.notes && (
                    <p className="text-sm">
                      <strong>Notes:</strong> {application.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={application.status}
                      onChange={(e) => handleUpdateStatus(application.id!, e.target.value as Application['status'])}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};