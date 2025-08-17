import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";

const ProfileSetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    collegeName: "",
    educationBackground: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          college_name: formData.collegeName,
          education_background: formData.educationBackground,
          profile_completed: true,
        });

      if (error) throw error;

      toast({
        title: "Profile created successfully!",
        description: "Welcome to CareerConnect",
      });

      navigate("/profile", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <Helmet>
        <title>Complete Your Profile – CareerConnect</title>
        <meta name="description" content="Complete your profile to get started with CareerConnect." />
      </Helmet>
      <section className="container py-12 md:py-16 max-w-md">
        <h1 className="text-3xl font-bold">Complete Your Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us about yourself to get personalized job recommendations.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name *
            </label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="collegeName" className="text-sm font-medium">
              College/University *
            </label>
            <Input
              id="collegeName"
              type="text"
              value={formData.collegeName}
              onChange={(e) => handleInputChange("collegeName", e.target.value)}
              placeholder="Your college or university"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="educationBackground" className="text-sm font-medium">
              Education Background *
            </label>
            <Textarea
              id="educationBackground"
              value={formData.educationBackground}
              onChange={(e) => handleInputChange("educationBackground", e.target.value)}
              placeholder="Tell us about your educational background, degree, major, etc."
              rows={4}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Profile..." : "Complete Profile"}
          </Button>
        </form>
      </section>
    </Layout>
  );
};

export default ProfileSetup;