import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    const checkUserAndRedirect = async (userId: string) => {
      // First check if user is admin
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (adminRole) {
        navigate("/admin", { replace: true });
        return;
      }

      // If not admin, check profile completion
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('user_id', userId)
        .single();
      
      if (profile) {
        navigate("/profile", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setTimeout(() => checkUserAndRedirect(session.user.id), 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await checkUserAndRedirect(session.user.id);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed in", description: "Welcome back!" });
    }
  };

  const signUp = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/profile-setup`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "Confirm your email to complete sign up." });
    }
  };

  const canonical = typeof window !== "undefined" ? window.location.origin + "/auth" : "/auth";

  return (
    <Layout>
      <Helmet>
        <title>Sign in or Create account – Qrate</title>
        <meta name="description" content="Sign in or create your Qrate account to save jobs and set up personalized job alerts." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <section className="container py-12 md:py-16 max-w-md">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="mt-2 text-muted-foreground">Sign in or create an account to save jobs and manage alerts.</p>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mt-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm">Email</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm">Password</label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button className="w-full" onClick={signIn} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="signup">
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="email2" className="text-sm">Email</label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password2" className="text-sm">Password</label>
                <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <Button className="w-full" onClick={signUp} disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Auth;
