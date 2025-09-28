import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { CrawlerControls } from "@/components/admin/CrawlerControls";

const Admin = () => {
  const canonical = `${window.location.origin}/admin`;

  return (
    <Layout>
      <Helmet>
        <title>Admin Dashboard – Qrate</title>
        <meta name="description" content="Admin dashboard for managing Qrate's AI-powered job crawler and system controls." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <section className="container py-12 md:py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Manage Qrate's AI-powered job discovery system. Control automated crawling, monitor performance, and review job extraction results.
          </p>
        </div>
        
        <CrawlerControls />
      </section>
    </Layout>
  );
};

export default Admin;