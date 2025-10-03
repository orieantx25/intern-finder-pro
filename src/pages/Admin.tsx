import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { CrawlerControls } from "@/components/admin/CrawlerControls";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const Admin = () => {
  const { isLoading } = useAdminAuth();
  const canonical = `${window.location.origin}/admin`;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 md:py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying admin access...</p>
          </div>
        </div>
      </Layout>
    );
  }

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