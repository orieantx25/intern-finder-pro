import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Internships from "./pages/Internships";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import SubmitResume from "./pages/SubmitResume";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import JobPortal from "./pages/JobPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/job-portal" element={<JobPortal />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/submit-resume" element={<SubmitResume />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
