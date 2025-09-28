import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import ArticleCard from "@/components/home/ArticleCard";
import { articles } from "@/data/articles";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/" : "/";
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Qrate – AI-Powered Job Discovery Platform',
    url: canonical,
    potentialAction: {
      '@type': 'SearchAction',
      target: canonical + 'jobs?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Qrate – AI-Powered Job Discovery Platform</title>
        <meta name="description" content="Discover curated jobs and internships from official company websites and major Indian job portals. AI-powered matching and automated job discovery." />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <Hero />

      <section id="insights" aria-labelledby="insights-heading" className="container py-12 md:py-16">
        <h2 id="insights-heading" className="text-2xl md:text-3xl font-semibold">Market Research & Articles</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">Insights on hiring trends, internship conversions, and salary benchmarks.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} {...a} />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
