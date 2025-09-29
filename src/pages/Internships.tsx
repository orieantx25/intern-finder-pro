import Layout from "@/components/layout/Layout";
import JobCard, { JobItem } from "@/components/jobs/JobCard";
import JobsFilterBar, { FilterState } from "@/components/jobs/JobsFilterBar";
import { Helmet } from "react-helmet-async";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Internships = () => {
  const [filters, setFilters] = useState<FilterState>({ q: "", type: "All", remoteOnly: false });
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .eq('type', 'Internship')
          .order('posted_at', { ascending: false });

        if (error) throw error;

        const mappedJobs: JobItem[] = (data || []).map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location || 'Remote',
          type: 'Internship' as const,
          remote: job.remote || false,
          url: job.url || '#',
          postedAt: job.posted_at || new Date().toISOString(),
          description: job.description || undefined,
        }));

        setJobs(mappedJobs);
      } catch (error) {
        console.error('Error fetching internships:', error);
        toast({
          title: "Error loading internships",
          description: "Failed to fetch internships from database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [toast]);

  const filtered: JobItem[] = useMemo(() => {
    return jobs.filter((j) => {
      const q = filters.q.toLowerCase();
      const matchesQ = !q || [j.title, j.company, j.location].some((v) => v.toLowerCase().includes(q));
      const matchesRemote = !filters.remoteOnly || j.remote;
      return matchesQ && matchesRemote;
    }).sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
  }, [filters, jobs]);

  const canonical = typeof window !== "undefined" ? window.location.origin + "/internships" : "/internships";

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
        <title>Internships – Qrate</title>
        <meta name="description" content="Explore internships sourced from official company websites and major job portals. AI-curated opportunities with direct application links." />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <section className="container py-10">
        <h1 className="text-3xl font-bold">Latest Internships</h1>
        <p className="mt-2 text-muted-foreground">Real opportunities for students and grads with direct apply links.</p>
        <div className="mt-6">
          <JobsFilterBar onChange={setFilters} />
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading internships...</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {filtered.length === 0 && (
              <p className="text-muted-foreground">No internships found. Try adjusting filters.</p>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Internships;
