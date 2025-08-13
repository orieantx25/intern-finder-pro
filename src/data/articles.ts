export interface ArticleItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  url: string;
}

export const articles: ArticleItem[] = [
  {
    id: "a1",
    title: "The 2025 Tech Hiring Outlook",
    summary: "What roles are in demand and how companies are sourcing talent across markets.",
    date: new Date().toISOString(),
    url: "https://example.com/reports/2025-hiring-outlook",
  },
  {
    id: "a2",
    title: "Internships That Convert to Full-Time Offers",
    summary: "Research-backed tips to land and convert internships into offers.",
    date: new Date(Date.now() - 1000*60*60*24*2).toISOString(),
    url: "https://example.com/articles/internship-conversion",
  },
  {
    id: "a3",
    title: "Remote vs Onsite Compensation Trends",
    summary: "A look at how compensation bands evolve for remote-friendly teams.",
    date: new Date(Date.now() - 1000*60*60*24*5).toISOString(),
    url: "https://example.com/insights/remote-compensation",
  },
  {
    id: "a4",
    title: "Design Portfolios That Stand Out",
    summary: "Recruiters share what they love to see in modern product design portfolios.",
    date: new Date(Date.now() - 1000*60*60*24*8).toISOString(),
    url: "https://example.com/articles/design-portfolios",
  },
];
