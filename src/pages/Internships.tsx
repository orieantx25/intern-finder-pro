import Layout from "@/components/layout/Layout";
import JobCard, { JobItem } from "@/components/jobs/JobCard";
import JobsFilterBar, { FilterState } from "@/components/jobs/JobsFilterBar";
import { internships } from "@/data/internships";
import { Helmet } from "react-helmet-async";
import { useMemo, useState } from "react";

const Internships = () => {
  const [filters, setFilters] = useState<FilterState>({ q: "", type: "All", remoteOnly: false });

  const filtered: JobItem[] = useMemo(() => {
    return internships.filter((j) => {
      const q = filters.q.toLowerCase();
      const matchesQ = !q || [j.title, j.company, j.location].some((v) => v.toLowerCase().includes(q));
      const matchesType = filters.type === "All" || j.type === filters.type;
      const matchesRemote = !filters.remoteOnly || j.remote;
      return matchesQ && matchesType && matchesRemote;
    }).sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
  }, [filters]);

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
        <title>Internships – CareerConnect</title>
        <meta name="description" content="Explore internships sourced from official company websites and social posts. Apply directly to the company." />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <section className="container py-10">
        <h1 className="text-3xl font-bold">Latest Internships</h1>
        <p className="mt-2 text-muted-foreground">Real opportunities for students and grads with direct apply links.</p>
        <div className="mt-6">
          <JobsFilterBar onChange={setFilters} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground">No roles found. Try adjusting filters.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Internships;
