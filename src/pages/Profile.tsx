import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | null;
  college_name: string | null;
  education_background: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth", { replace: true });
        return;
      }
      setUser(session.user);
      
      // Fetch profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
      } else if (!profileData) {
        // No profile found, redirect to setup
        navigate("/profile-setup", { replace: true });
        return;
      } else {
        setProfile(profileData);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({
        title: "Avatar updated successfully!",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  return (
    <Layout>
      <Helmet>
        <title>Your Profile – CareerConnect</title>
        <meta name="description" content="Manage your CareerConnect profile and preferences." />
      </Helmet>
      <section className="container py-12 md:py-16 max-w-2xl">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
          
          <h1 className="text-3xl font-bold">Welcome, {profile.full_name}!</h1>
          <p className="text-muted-foreground mt-2">{user?.email}</p>
        </div>

        <div className="bg-card rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="mt-1">{profile.full_name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">College/University</label>
              <p className="mt-1">{profile.college_name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Education Background</label>
              <p className="mt-1">{profile.education_background}</p>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => navigate("/submit-resume")}>
              Upload Resume
            </Button>
            <Button variant="outline" onClick={() => navigate("/jobs")}>
              Browse Jobs
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;