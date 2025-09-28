import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  remote: boolean;
  url: string;
  postedAt: string; // ISO
  description?: string;
}

interface JobCardProps {
  job: JobItem;
}

const JobCard = ({ job }: JobCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const checkSaved = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSaved(false);
        setSavedId(null);
        return;
      }
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('job_id', job.id)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error loading saved state', error);
      }
      setSaved(!!data);
      setSavedId(data?.id ?? null);
    };
    checkSaved();
  }, [job.id]);

  const onToggleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Sign in required', description: 'Please sign in to save jobs.' });
      navigate('/auth');
      return;
    }
    setBusy(true);
    try {
      if (saved && savedId) {
        const { error } = await supabase.from('saved_jobs').delete().eq('id', savedId);
        if (error) throw error;
        setSaved(false);
        setSavedId(null);
        toast({ title: 'Removed', description: 'Job removed from saved.' });
      } else {
        const { data, error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: session.user.id,
            job_id: job.id,
          })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        setSaved(true);
        setSavedId(data?.id ?? null);
        toast({ title: 'Saved', description: 'Job saved successfully.' });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e?.message || 'Could not update saved jobs', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const postedAgo = formatDistanceToNow(new Date(job.postedAt), { addSuffix: true });
  return (
    <article className="h-full" itemScope itemType="https://schema.org/JobPosting">
      <meta itemProp="datePosted" content={new Date(job.postedAt).toISOString()} />
      <meta itemProp="employmentType" content={job.type} />
      <meta itemProp="applicantLocationRequirements" content={job.remote ? "Remote" : job.location} />
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl" itemProp="title">{job.title}</CardTitle>
          <p className="text-sm text-muted-foreground" itemProp="hiringOrganization">{job.company} • {job.location} {job.remote && "(Remote)"}</p>
        </CardHeader>
        <CardContent className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{job.type}</p>
            <p className="mt-1 text-xs text-muted-foreground">Posted {postedAgo}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={saved ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleSave}
              aria-pressed={saved}
              disabled={busy}
            >
              {saved ? 'Saved' : 'Save'}
            </Button>
            <Button asChild variant="secondary">
              <a href={job.url} itemProp="hiringOrganization" target="_blank" rel="noopener nofollow">Apply</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
};

export default JobCard;
