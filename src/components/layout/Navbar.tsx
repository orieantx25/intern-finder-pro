import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">CareerConnect</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/jobs" className={navLinkClasses}>
            Jobs
          </NavLink>
          <NavLink to="/internships" className={navLinkClasses}>
            Internships
          </NavLink>
          <a href="#insights" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Insights</a>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="outline">
            <a href="#contact">Contact</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild variant="hero">
            <Link to="/jobs">Browse Roles</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
