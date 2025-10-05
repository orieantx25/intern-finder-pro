import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { LogOut } from "lucide-react";

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roles);
      } else {
        setIsAdmin(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();
          
          setIsAdmin(!!roles);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Qrate</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/jobs" className={navLinkClasses}>
            Jobs
          </NavLink>
          <NavLink to="/internships" className={navLinkClasses}>
            Internships
          </NavLink>
          <NavLink to="/job-portal" className={navLinkClasses}>
            AI Portal
          </NavLink>
          <a href="#insights" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Insights</a>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="outline">
            <a href="#contact">Contact</a>
          </Button>
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="default">
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/submit-resume">Upload Resume</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/profile">Profile</Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
              <Button asChild variant="hero">
                <Link to="/jobs">Browse Roles</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="hero">
                <Link to="/jobs">Browse Roles</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
