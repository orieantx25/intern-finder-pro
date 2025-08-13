import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

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
          <Button asChild variant="secondary">
            <a href={job.url} itemProp="hiringOrganization" target="_blank" rel="noopener nofollow">Apply</a>
          </Button>
        </CardContent>
      </Card>
    </article>
  );
};

export default JobCard;
