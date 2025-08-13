import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-job-portal.jpg";
import { Link } from "react-router-dom";

const Hero = () => {
  const blobRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = blobRef.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={heroImage} alt="Gradient tech career landscape" className="w-full h-[48vh] md:h-[60vh] object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 to-background"></div>
      </div>

      <div ref={blobRef} aria-hidden className="pointer-events-none fixed left-0 top-0 -z-10 size-40 rounded-full bg-gradient-primary opacity-40 blur-2xl will-change-transform" />

      <div className="container pt-20 md:pt-28 pb-16 md:pb-24 text-center">
        <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold tracking-tight">
          Find Curated Jobs and Internships
        </h1>
        <p className="mt-4 md:mt-6 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Fresh openings sourced from official company websites and social channels. Apply directly at the source.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" variant="hero">
            <Link to="/jobs">Explore Jobs</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/internships">Explore Internships</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
