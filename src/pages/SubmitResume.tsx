import Layout from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  portfolio_url: z.string().url().optional().or(z.literal("")),
  summary: z.string().max(1000).optional(),
  resume: z
    .any()
    .refine((f) => f instanceof File || (f && f[0] instanceof File), "Resume file is required"),
});

type FormValues = z.infer<typeof schema>;

const SubmitResume = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // Preload session to avoid initial redirect flicker
    supabase.auth.getSession();
  }, []);

  const onSubmit = async (values: FormValues) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Sign in required", description: "Please sign in to submit your resume." });
      navigate("/auth");
      return;
    }

    const file: File = values.resume instanceof File ? values.resume : values.resume[0];
    if (!file) {
      toast({ title: "Resume required", description: "Please attach your resume.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const path = `${session.user.id}/${Date.now()}-${file.name}`;
      const { data: upload, error: upErr } = await supabase.storage
        .from("resumes")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "application/pdf" });
      if (upErr) throw upErr;

    const { data, error } = await supabase
      .from('applicants')
      .insert([
        {
          user_id: session.user.id,
          full_name: values.name,
          email: values.email,
          phone: values.phone,
          resume_url: upload?.path || path,
        },
      ]);
      if (error) throw error;

      toast({ title: "Submitted", description: "Your details and resume were uploaded successfully." });
      reset();
      navigate("/jobs");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "Submission failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const canonical = typeof window !== "undefined" ? window.location.origin + "/submit-resume" : "/submit-resume";

  return (
    <Layout>
      <Helmet>
        <title>Upload Resume – CareerConnect</title>
        <meta name="description" content="Job seekers can upload their resume and details to get discovered by companies." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <main className="container py-10">
        <h1 className="text-3xl font-bold">Upload your resume</h1>
        <p className="mt-2 text-muted-foreground">Share your details so companies can reach out directly.</p>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">Full name</label>
                <Input id="name" placeholder="Jane Doe" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">Email</label>
                <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="phone">Phone</label>
                <Input id="phone" placeholder="+1 555 123 4567" {...register("phone")} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="location">Location</label>
                <Input id="location" placeholder="City, Country" {...register("location")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="skills">Skills</label>
                <Input id="skills" placeholder="React, TypeScript, SQL" {...register("skills")} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="linkedin">LinkedIn URL</label>
                <Input id="linkedin" placeholder="https://linkedin.com/in/username" {...register("linkedin_url")} />
                {errors.linkedin_url && <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="portfolio">Portfolio URL</label>
                <Input id="portfolio" placeholder="https://your-portfolio.com" {...register("portfolio_url")} />
                {errors.portfolio_url && <p className="text-sm text-destructive">{errors.portfolio_url.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="summary">Summary</label>
                <Textarea id="summary" placeholder="Brief summary of your experience" {...register("summary")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="resume">Resume (PDF/DOC)</label>
                <Input id="resume" type="file" accept=".pdf,.doc,.docx" {...register("resume")} />
                {errors.resume && <p className="text-sm text-destructive">{errors.resume.message as string}</p>}
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={uploading} className="w-full md:w-auto">
                  {uploading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
};

export default SubmitResume;
