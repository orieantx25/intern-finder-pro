const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t mt-16">
      <div className="container py-10 grid gap-6 md:grid-cols-3 text-sm">
        <div className="space-y-2">
          <p className="font-semibold">Qrate</p>
          <p className="text-muted-foreground">AI-powered job discovery platform sourcing opportunities from official company channels and major Indian job portals.</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Explore</p>
          <ul className="text-muted-foreground space-y-1">
            <li><a className="hover:text-foreground" href="/jobs">Jobs</a></li>
            <li><a className="hover:text-foreground" href="/internships">Internships</a></li>
            <li><a className="hover:text-foreground" href="#insights">Insights</a></li>
          </ul>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Legal</p>
          <ul className="text-muted-foreground space-y-1">
            <li><a className="hover:text-foreground" href="#">Privacy</a></li>
            <li><a className="hover:text-foreground" href="#">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-6 text-xs text-muted-foreground flex justify-between">
          <p>© {year} Qrate. All rights reserved.</p>
          <p>Built with love.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
