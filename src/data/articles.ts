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
    title: "India's Tech Job Market: 2025 Growth Projections",
    summary: "NASSCOM report reveals 4.5 million tech jobs by 2025, with AI/ML, cloud computing, and cybersecurity leading demand across Bangalore, Hyderabad, and emerging tier-2 cities.",
    date: new Date().toISOString(),
    url: "https://www.nasscom.in/knowledge-center/publications/technology-sector-india-2025-strategic-review",
  },
  {
    id: "a2", 
    title: "The Great Indian Talent Migration: Remote Work Impact",
    summary: "McKinsey Global Institute study shows 40% of Indian tech professionals now work remotely, reshaping salary bands and opening opportunities beyond metro cities.",
    date: new Date(Date.now() - 1000*60*60*24*3).toISOString(),
    url: "https://www.mckinsey.com/featured-insights/future-of-work/the-future-of-work-in-india",
  },
  {
    id: "a3",
    title: "Startup vs Corporate: Compensation Analysis 2024",
    summary: "EY-FICCI report comparing startup equity packages vs MNC fixed compensation. Startups offer 15-30% higher total rewards for senior roles, with significant equity upside potential.",
    date: new Date(Date.now() - 1000*60*60*24*5).toISOString(),
    url: "https://www.ey.com/en_in/consulting/how-indian-startups-are-redefining-talent-acquisition",
  },
  {
    id: "a4",
    title: "Women in Tech: Breaking the Glass Ceiling",
    summary: "Catalyst India research reveals strategies used by successful women leaders in tech. Key insights on mentorship, skill development, and navigating career transitions in male-dominated fields.",
    date: new Date(Date.now() - 1000*60*60*24*7).toISOString(),
    url: "https://www.catalyst.org/research/women-in-tech-india/",
  },
  {
    id: "a5",
    title: "Skills That Matter: Engineering Hiring Trends",
    summary: "StackOverflow Developer Survey 2024 India edition highlights React, Python, and AWS as most in-demand skills. Cloud architecture and DevOps see 60% year-over-year growth.",
    date: new Date(Date.now() - 1000*60*60*24*10).toISOString(),
    url: "https://survey.stackoverflow.co/2024/work#section-salary-salary-by-country",
  },
  {
    id: "a6",
    title: "The Rise of Tier-2 Cities in Tech Employment",
    summary: "CBRE report on how Pune, Chennai, and Kochi are becoming major tech hubs. 25% of new tech jobs now created outside Bangalore-Mumbai-Delhi corridor.",
    date: new Date(Date.now() - 1000*60*60*24*12).toISOString(),
    url: "https://www.cbre.co.in/research-and-reports/India-Real-Estate-Market-Outlook-2024",
  }
];
