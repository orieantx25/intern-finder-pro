import Layout from "@/components/layout/Layout";
import JobCard, { JobItem } from "@/components/jobs/JobCard";
import JobsFilterBar, { FilterState } from "@/components/jobs/JobsFilterBar";
import { Helmet } from "react-helmet-async";
import { useMemo, useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const isUS = (loc: string) => {
  const l = loc.toLowerCase();
  if (l.includes("united states") || l.includes(" usa ") || l.endsWith(", us")) return true;
  // Heuristic: common US cities
  const cities = ["san francisco", "new york", "austin", "seattle", "boston", "chicago", "los angeles", "san jose", "denver", "atlanta", "miami", "dallas"];
  if (cities.some(c => l.includes(c))) return true;
  // Avoid classifying Toronto, CA as US
  if (l.includes("toronto") && l.endsWith(", ca")) return false;
  // State abbreviation pattern
  return /,\s?(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/.test(loc);
};

const isIndia = (loc: string) => {
  const l = loc.toLowerCase();
  if (l.includes("india")) return true;
  const cities = ["bengaluru", "bangalore", "mumbai", "delhi", "hyderabad", "pune", "chennai", "noida", "gurgaon", "gurugram", "kolkata"];
  return cities.some(c => l.includes(c));
};

const Jobs = () => {
  const [filters, setFilters] = useState<FilterState>({ q: "", type: "All", remoteOnly: false });
  const [tab, setTab] = useState("all");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .order('posted_at', { ascending: false });

        if (error) throw error;

        const mappedJobs: JobItem[] = (data || []).map(job => {
          const validTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
          const jobType = validTypes.includes(job.type || '') ? job.type as JobItem['type'] : 'Full-time';
          
          return {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location || 'Remote',
            type: jobType,
            remote: job.remote || false,
            url: job.url || '#',
            postedAt: job.posted_at || new Date().toISOString(),
            description: job.description || undefined,
          };
        });

        setJobs(mappedJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: "Error loading jobs",
          description: "Failed to fetch jobs from database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [toast]);

  const filtered: JobItem[] = useMemo(() => {
    return jobs.filter((j) => {
      const q = filters.q.toLowerCase();
      const matchesQ = !q || [j.title, j.company, j.location].some((v) => v.toLowerCase().includes(q));
      const matchesType = filters.type === "All" || j.type === filters.type;
      const matchesRemote = !filters.remoteOnly || j.remote;
      return matchesQ && matchesType && matchesRemote;
    }).sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
  }, [filters, jobs]);

  const usJobs = useMemo(() => filtered.filter(j => isUS(j.location) || /\bUS\b|USA/i.test(j.location)), [filtered]);
  const indiaJobs = useMemo(() => filtered.filter(j => isIndia(j.location)), [filtered]);

  const canonical = typeof window !== "undefined" ? window.location.origin + "/jobs" : "/jobs";

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filtered.map((j, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'JobPosting',
        title: j.title,
        datePosted: new Date(j.postedAt).toISOString(),
        employmentType: j.type,
        hiringOrganization: { '@type': 'Organization', name: j.company },
        applicantLocationRequirements: j.remote ? 'Remote' : j.location,
        jobLocationType: j.remote ? 'TELECOMMUTE' : 'ONSITE',
        directApply: true,
        url: j.url,
      }
    }))
  };

  return (
    <Layout>
      <Helmet>
        <title>Jobs – Qrate</title>
        <meta name="description" content="Browse AI-curated job openings from official company websites and major Indian job portals. Direct application links and smart job matching." />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <section className="container py-10">
        <h1 className="text-3xl font-bold">Latest Jobs</h1>
        <p className="mt-2 text-muted-foreground">Freshly sourced roles with direct company application links.</p>
        <div className="mt-6">
          <JobsFilterBar onChange={setFilters} />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="us">US Jobs</TabsTrigger>
            <TabsTrigger value="india">India Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Loading jobs...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground">No roles found. Try adjusting filters.</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="us" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Loading jobs...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {usJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {usJobs.length === 0 && (
                  <p className="text-muted-foreground">No US roles found.</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="india" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Loading jobs...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {indiaJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {indiaJobs.length === 0 && (
                  <p className="text-muted-foreground">No India roles found.</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Jobs;
