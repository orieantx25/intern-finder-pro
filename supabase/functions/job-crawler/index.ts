import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface JobData {
  title: string;
  company: string;
  location?: string;
  skills?: string[];
  experience?: string;
  description?: string;
  url?: string;
  salary?: string;
  type?: string;
  remote?: boolean;
}

interface CrawlResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

interface JobSource {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
}

interface CrawlStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  jobsExtracted: number;
  duplicatesSkipped: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting and politeness controls
const RATE_LIMIT_MS = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000; // 30 seconds

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// User agents for respectful crawling
const USER_AGENTS = [
  'Mozilla/5.0 (compatible; QrateBot/1.0; +https://qrate.dev/bot)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

// Job portal specific selectors and patterns
const JOB_PATTERNS = {
  naukri: {
    selectors: {
      jobTitle: '.jobTuple-heading a, .title',
      company: '.companyInfo .company, .company-name',
      location: '.locationsContainer .location, .job-location', 
      experience: '.expwdth, .experience',
      skills: '.skillList .chip, .skills',
      salary: '.salary, .package',
      description: '.jobDescription, .job-desc'
    },
    baseUrl: 'https://www.naukri.com'
  },
  indeed: {
    selectors: {
      jobTitle: '[data-jk] h2 a span, .jobTitle a',
      company: '.companyName, [data-testid="company-name"]',
      location: '.companyLocation, [data-testid="job-location"]',
      experience: '.metadata, .job-snippet',
      salary: '.salary-snippet, .salary',
      description: '.job-snippet, .summary'
    },
    baseUrl: 'https://indeed.co.in'
  },
  linkedin: {
    selectors: {
      jobTitle: '.base-search-card__title, .job-details-jobs-unified-top-card__job-title',
      company: '.base-search-card__subtitle, .job-details-jobs-unified-top-card__company-name',
      location: '.job-search-card__location, .job-details-jobs-unified-top-card__bullet',
      experience: '.job-details-preferences-and-skills, .job-criteria',
      skills: '.job-details-preferences-and-skills__list-item',
      description: '.job-details-description-content__text'
    },
    baseUrl: 'https://www.linkedin.com'
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Qrate Job Crawler started');
    const startTime = Date.now();
    
    // Get active job sources from database
    const { data: jobSources, error: sourcesError } = await supabase
      .from('job_sources')
      .select('*')
      .eq('is_active', true);

    if (sourcesError) {
      console.error('❌ Error fetching job sources:', sourcesError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch job sources' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = [];
    let totalJobsFound = 0;
    let totalStats: CrawlStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      jobsExtracted: 0,
      duplicatesSkipped: 0
    };

    // Process each job source
    for (const source of jobSources as JobSource[]) {
      console.log(`🔍 Processing ${source.name}...`);
      
      try {
        const crawlResult = await crawlJobSource(source);
        
        if (crawlResult.success && crawlResult.data) {
          const { jobs, stats } = await parseJobsFromSource(
            crawlResult.data,
            source.name
          );
          
          const savedJobs = await saveJobsToDatabase(jobs);
          totalJobsFound += savedJobs;
          
          // Update stats
          totalStats.totalRequests += stats.totalRequests;
          totalStats.successfulRequests += stats.successfulRequests;
          totalStats.failedRequests += stats.failedRequests;
          totalStats.jobsExtracted += stats.jobsExtracted;
          totalStats.duplicatesSkipped += stats.duplicatesSkipped;
          
          results.push({
            source: source.name,
            jobsFound: savedJobs,
            success: true,
            stats: stats
          });

          // Update last crawled timestamp
          await supabase
            .from('job_sources')
            .update({ last_crawled_at: new Date().toISOString() })
            .eq('id', source.id);
            
          console.log(`✅ ${source.name}: Found ${savedJobs} new jobs`);
        } else {
          totalStats.failedRequests++;
          results.push({
            source: source.name,
            jobsFound: 0,
            success: false,
            error: crawlResult.error
          });
          console.log(`❌ ${source.name}: ${crawlResult.error}`);
        }

        // Rate limiting - respect robots.txt
        await delay(RATE_LIMIT_MS);
        
      } catch (error) {
        const errorMsg = `Error processing ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        totalStats.failedRequests++;
        
        results.push({
          source: source.name,
          jobsFound: 0,
          success: false,
          error: errorMsg
        });
      }
    }

    // Cleanup expired jobs
    const cleanupCount = await cleanupExpiredJobs();
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Qrate Job Crawler completed in ${executionTime}ms`);
    console.log(`📊 Stats: ${totalJobsFound} new jobs, ${cleanupCount} expired jobs cleaned`);

    return new Response(
      JSON.stringify({
        success: true,
        totalJobsFound,
        results,
        stats: totalStats,
        executionTimeMs: executionTime,
        cleanupCount,
        message: `Successfully processed ${jobSources.length} job sources`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Job crawler error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function crawlJobSource(source: JobSource): Promise<CrawlResult> {
  try {
    console.log(`🕷️ Crawling ${source.name} - ${source.base_url}`);

    // Check robots.txt first
    const robotsAllowed = await checkRobotsTxt(source.base_url);
    if (!robotsAllowed) {
      console.log(`🚫 Robots.txt disallows crawling for ${source.name}`);
      return { success: false, error: 'Robots.txt disallows crawling' };
    }

    // Use Firecrawl for real crawling when API key is available
    if (firecrawlApiKey && firecrawlApiKey !== 'your-api-key-here') {
      return await crawlWithFirecrawl(source);
    } else {
      // Fallback to direct HTTP crawling with proper error handling
      return await crawlWithDirectHttp(source);
    }
    
  } catch (error) {
    console.error(`❌ Error crawling ${source.name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': USER_AGENTS[0]
      }
    });
    
    if (!response.ok) return true; // If no robots.txt, assume allowed
    
    const robotsText = await response.text();
    const lines = robotsText.split('\n');
    let isOurUserAgent = false;
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith('user-agent:')) {
        isOurUserAgent = trimmed.includes('*') || trimmed.includes('qratebot');
      } else if (isOurUserAgent && trimmed.startsWith('disallow:')) {
        const disallowPath = trimmed.replace('disallow:', '').trim();
        if (disallowPath === '/' || disallowPath === '') {
          return false; // Disallowed
        }
      }
    }
    
    return true; // Allowed by default
  } catch (error) {
    console.log(`⚠️ Could not check robots.txt for ${baseUrl}, assuming allowed`);
    return true;
  }
}

async function crawlWithFirecrawl(source: JobSource): Promise<CrawlResult> {
  try {
    const crawlUrls = generateCrawlUrls(source);
    const allData = [];
    
    for (const url of crawlUrls) {
      console.log(`🔗 Crawling URL: ${url}`);
      
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlApiKey}`
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown', 'html'],
          timeout: REQUEST_TIMEOUT
        })
      });
      
      if (!response.ok) {
        console.error(`❌ Firecrawl error for ${url}:`, response.status);
        continue;
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        allData.push({
          url: url,
          markdown: data.data.markdown,
          html: data.data.html,
          content: data.data.content
        });
      }
      
      await delay(RATE_LIMIT_MS);
    }
    
    return { success: true, data: allData };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Firecrawl error' };
  }
}

async function crawlWithDirectHttp(source: JobSource): Promise<CrawlResult> {
  try {
    const crawlUrls = generateCrawlUrls(source);
    const allData = [];
    
    for (const url of crawlUrls) {
      console.log(`🔗 Direct crawling URL: ${url}`);
      
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const html = await response.text();
          allData.push({
            url: url,
            html: html,
            content: html
          });
          
          break; // Success, exit retry loop
          
        } catch (error) {
          retries++;
          console.log(`⚠️ Retry ${retries}/${MAX_RETRIES} for ${url}: ${error}`);
          if (retries >= MAX_RETRIES) {
            console.error(`❌ Failed to crawl ${url} after ${MAX_RETRIES} retries`);
          } else {
            await delay(RATE_LIMIT_MS * retries); // Exponential backoff
          }
        }
      }
      
      await delay(RATE_LIMIT_MS);
    }
    
    return { success: true, data: allData };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Direct crawling error' };
  }
}

function generateCrawlUrls(source: JobSource): string[] {
  const sourceName = source.name.toLowerCase();
  const baseUrl = source.base_url;
  
  // Generate specific URLs based on the job portal
  switch (sourceName) {
    case 'naukri':
      return [
        `${baseUrl}/jobs?k=software%20engineer&l=bangalore`,
        `${baseUrl}/jobs?k=data%20scientist&l=mumbai`,
        `${baseUrl}/jobs?k=product%20manager&l=delhi`,
        `${baseUrl}/jobs?k=frontend%20developer&l=pune`,
        `${baseUrl}/jobs?k=backend%20developer&l=hyderabad`
      ];
    case 'indeed':
      return [
        `${baseUrl}/jobs?q=software+engineer&l=Bangalore`,
        `${baseUrl}/jobs?q=data+scientist&l=Mumbai`,
        `${baseUrl}/jobs?q=product+manager&l=Delhi`,
        `${baseUrl}/jobs?q=frontend+developer&l=Pune`,
        `${baseUrl}/jobs?q=backend+developer&l=Hyderabad`
      ];
    case 'linkedin':
      return [
        `${baseUrl}/jobs/search/?keywords=software%20engineer&location=India`,
        `${baseUrl}/jobs/search/?keywords=data%20scientist&location=India`,
        `${baseUrl}/jobs/search/?keywords=product%20manager&location=India`
      ];
    default:
      return [baseUrl];
  }
}

function generateSampleJobs(sourceName: string): any[] {
  const jobTitles = [
    'Software Engineer',
    'Senior React Developer', 
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'DevOps Engineer',
    'Backend Developer',
    'Frontend Developer',
    'Mobile App Developer',
    'UI/UX Designer'
  ];

  const companies = [
    'TCS', 'Infosys', 'Wipro', 'Accenture', 'IBM', 'Microsoft India',
    'Google India', 'Amazon India', 'Flipkart', 'Paytm', 'BYJU\'S',
    'Zomato', 'Swiggy', 'Ola', 'PhonePe', 'Razorpay'
  ];

  const locations = [
    'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 
    'Pune', 'Kolkata', 'Gurgaon', 'Noida', 'Remote'
  ];

  const skills = [
    ['React', 'JavaScript', 'Node.js', 'MongoDB'],
    ['Python', 'Django', 'PostgreSQL', 'Docker'],
    ['Java', 'Spring Boot', 'MySQL', 'Kafka'],
    ['Angular', 'TypeScript', 'Firebase', 'AWS'],
    ['React Native', 'Flutter', 'Mobile Development'],
    ['Data Science', 'Machine Learning', 'Python', 'TensorFlow']
  ];

  const experiences = ['0-2 years', '2-5 years', '5-8 years', '8+ years', 'Fresher'];

  const jobs = [];
  for (let i = 0; i < 5; i++) {
    const randomTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomSkills = skills[Math.floor(Math.random() * skills.length)];
    const randomExp = experiences[Math.floor(Math.random() * experiences.length)];

    jobs.push({
      markdown: `# ${randomTitle} at ${randomCompany}

**Company:** ${randomCompany}
**Location:** ${randomLocation}
**Experience:** ${randomExp}
**Skills Required:** ${randomSkills.join(', ')}

We are looking for a talented ${randomTitle} to join our team. This is an excellent opportunity to work with cutting-edge technologies and contribute to innovative projects.

**Requirements:**
- ${randomExp} of experience in software development
- Proficiency in ${randomSkills.slice(0, 2).join(' and ')}
- Strong problem-solving skills
- Excellent communication skills

**What we offer:**
- Competitive salary package
- Flexible working hours
- Health insurance
- Learning and development opportunities`,
      
      url: `https://${sourceName.toLowerCase().replace(' ', '')}.com/jobs/${randomTitle.replace(/\s+/g, '-').toLowerCase()}-${randomCompany.replace(/\s+/g, '-').toLowerCase()}`
    });
  }

  return jobs;
}

async function parseJobsFromSource(crawlData: any[], sourceName: string): Promise<{jobs: JobData[], stats: CrawlStats}> {
  const jobs: JobData[] = [];
  const stats: CrawlStats = {
    totalRequests: crawlData.length,
    successfulRequests: 0,
    failedRequests: 0,
    jobsExtracted: 0,
    duplicatesSkipped: 0
  };
  
  for (const page of crawlData) {
    try {
      if (!page.html && !page.markdown && !page.content) {
        stats.failedRequests++;
        console.log(`⚠️ No content found for page from ${sourceName}`);
        continue;
      }
      
      stats.successfulRequests++;
      const content = page.html || page.markdown || page.content || '';
      
      // Log content preview for debugging
      console.log(`📄 Content preview from ${sourceName} (${content.length} chars):`, content.substring(0, 300));
      
      let extractedJobs: JobData[] = [];
      
      // Use specific parsers based on source
      if (sourceName.toLowerCase().includes('naukri')) {
        extractedJobs = parseNaukriJobs(content, page.url);
      } else if (sourceName.toLowerCase().includes('indeed')) {
        extractedJobs = parseIndeedJobs(content, page.url);
      } else if (sourceName.toLowerCase().includes('linkedin')) {
        extractedJobs = parseLinkedInJobs(content, page.url);
      } else {
        // Generic parser
        extractedJobs = extractJobsFromContent(content, sourceName, page.url);
      }
      
      console.log(`✅ Extracted ${extractedJobs.length} jobs from ${sourceName} page`);
      jobs.push(...extractedJobs);
      stats.jobsExtracted += extractedJobs.length;
      
    } catch (error) {
      console.error(`❌ Error parsing page from ${sourceName}:`, error);
      stats.failedRequests++;
    }
  }
  
  console.log(`📊 ${sourceName} parsing stats:`, stats);
  return { jobs, stats };
}

function extractJobsFromContent(content: string, sourceName: string, sourceUrl?: string): JobData[] {
  const jobs: JobData[] = [];
  
  // Enhanced job extraction patterns for Indian job portals
  const jobPatterns = {
    title: [
      /(?:Job Title|Position|Role|Designation):\s*([^\n]+)/gi,
      /<h[1-6][^>]*>([^<]*(?:engineer|developer|analyst|manager|executive|specialist|consultant|designer|architect|lead|intern)[^<]{0,100})<\/h[1-6]>/gi,
      /^#+\s+([^\n]*(?:engineer|developer|analyst|manager|executive|specialist|consultant|designer|architect|lead|intern)[^\n]{0,100})/gim,
      /\*\*([^*]*(?:engineer|developer|analyst|manager|executive|specialist|consultant|designer|architect|lead|intern)[^*]{0,100})\*\*/gi,
      /<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/[^>]*>/gi,
      /\b((?:Senior|Junior|Lead|Staff|Principal)?\s*(?:Software|Full[- ]?Stack|Backend|Frontend|Mobile|Data|ML|AI|DevOps|Cloud|QA|Test)\s+(?:Engineer|Developer|Analyst|Architect|Specialist))\b/gi
    ],
    company: [
      /(?:Company|Organization|Employer|Hiring):\s*([^\n]+)/gi,
      /(?:at|@)\s+([A-Z][a-zA-Z0-9\s&.',-]{2,50}(?:\s+(?:Ltd|Limited|Inc|Corp|Corporation|Pvt|Private|Technologies|Tech|Solutions|Systems|Services|Consulting|Group|Labs))?)(?:\s|$|\n)/g,
      /<[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/[^>]*>/gi
    ],
    location: [
      /(?:Location|Based in|City|Work Location):\s*([^\n]+)/gi,
      /\b(Mumbai|Delhi|NCR|Bangalore|Bengaluru|Chennai|Hyderabad|Pune|Kolkata|Ahmedabad|Gurgaon|Gurugram|Noida|Remote|Work from home|WFH|Anywhere in India)\b/gi,
      /<[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/[^>]*>/gi
    ],
    experience: [
      /(?:Experience|Exp):\s*([^\n]+)/gi,
      /(\d+[\s-]*(?:to|-)?\s*\d*\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience)?)/gi,
      /(Fresher|Entry[- ]level|Junior|Senior|Lead)/gi
    ],
    skills: [
      /(?:Skills|Technologies|Requirements):\s*([^\n]+)/gi,
      /\b(JavaScript|Python|Java|React|Node\.?js|Angular|Vue|PHP|C\+\+|C#|SQL|MySQL|PostgreSQL|MongoDB|AWS|Azure|Docker|Kubernetes|Git|HTML|CSS|TypeScript|Express|Spring|Django|Flask)\b/gi
    ],
    salary: [
      /(?:Salary|Package|CTC):\s*([^\n]+)/gi,
      /₹\s*[\d,]+(?:\s*[-–]\s*₹?\s*[\d,]+)?(?:\s*(?:lakh|crore|LPA|per\s*annum))?/gi,
      /\b\d+\s*[-–]\s*\d+\s*LPA\b/gi
    ]
  };

  // Split content into potential job sections
  const sections = content.split(/\n\s*\n/);
  
  for (const section of sections) {
    if (section.length < 100) continue; // Skip very short sections
    
    const job: Partial<JobData> = {};
    
    // Extract title
    for (const pattern of jobPatterns.title) {
      const match = pattern.exec(section);
      if (match && match[1]) {
        job.title = cleanText(match[1]);
        break;
      }
    }
    
    // Extract company
    for (const pattern of jobPatterns.company) {
      const match = pattern.exec(section);
      if (match && match[1] && match[1].length > 2) {
        job.company = cleanText(match[1]);
        break;
      }
    }
    
    // Extract location
    const locationMatches: string[] = [];
    for (const pattern of jobPatterns.location) {
      let match;
      while ((match = pattern.exec(section)) !== null) {
        locationMatches.push(cleanText(match[1] || match[0]));
      }
    }
    if (locationMatches.length > 0) {
      job.location = locationMatches[0];
    }
    
    // Extract experience
    for (const pattern of jobPatterns.experience) {
      const match = pattern.exec(section);
      if (match && match[1]) {
        job.experience = cleanText(match[1]);
        break;
      }
    }
    
    // Extract skills
    const skillsMatches: string[] = [];
    for (const pattern of jobPatterns.skills) {
      let match;
      while ((match = pattern.exec(section)) !== null) {
        skillsMatches.push(cleanText(match[1] || match[0]));
      }
    }
    if (skillsMatches.length > 0) {
      job.skills = [...new Set(skillsMatches)]; // Remove duplicates
    }
    
    // Extract salary
    for (const pattern of jobPatterns.salary) {
      const match = pattern.exec(section);
      if (match && match[0]) {
        job.salary = cleanText(match[0]);
        break;
      }
    }
    
    job.description = section.substring(0, 500); // First 500 chars as description
    job.url = sourceUrl;
    
    // Add job if we have at least title (company is optional)
    if (job.title) {
      if (!job.company) {
        job.company = sourceName; // Use source name as fallback company
      }
      jobs.push(job as JobData);
      console.log(`🔍 Found job: ${job.title} at ${job.company}`);
    }
  }
  
  if (jobs.length === 0) {
    console.log(`⚠️ No jobs extracted from content. Content length: ${content.length}, Sections: ${sections.length}`);
    console.log(`📝 First 1000 chars of content:`, content.substring(0, 1000));
  }
  
  return jobs;
}

function cleanText(text: string): string {
  return text.trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,()-]/g, '')
    .substring(0, 200);
}

async function saveJobsToDatabase(jobs: JobData[]): Promise<number> {
  let savedCount = 0;
  
  for (const job of jobs) {
    try {
      // Create unique external_id for deduplication using crypto API
      const textEncoder = new TextEncoder();
      const data = textEncoder.encode(job.title + job.company);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const external_id = `${job.company?.toLowerCase().replace(/\s+/g, '_')}_${hashHex.slice(0, 16)}_${Date.now()}`;

      const { error } = await supabase
        .from('jobs')
        .upsert({
          external_id,
          title: job.title,
          company: job.company,
          location: job.location || 'India',
          description: job.description,
          url: job.url,
          source: 'job-crawler',
          skills: job.skills || [],
          experience_required: job.experience,
          salary_range: job.salary,
          posted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          remote: job.location?.toLowerCase().includes('remote') || job.location?.toLowerCase().includes('work from home') || false,
          type: 'full-time',
          is_active: true
        }, {
          onConflict: 'external_id',
          ignoreDuplicates: true
        });

      if (!error) {
        savedCount++;
      } else if (!error.message?.includes('duplicate')) {
        console.error(`Error saving job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error saving job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return savedCount;
}

async function cleanupExpiredJobs(): Promise<number> {
  try {
    // Mark jobs as inactive if they're older than 30 days
    const { data, error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_active', true)
      .select('id');

    if (error) {
      console.error('❌ Error cleaning up expired jobs:', error);
      return 0;
    }
    
    const count = data?.length || 0;
    console.log(`🧹 Cleaned up ${count} expired jobs`);
    return count;
  } catch (error) {
    console.error('❌ Error in cleanup function:', error);
    return 0;
  }
}

// Specialized parsers for different job portals
function parseNaukriJobs(html: string, sourceUrl?: string): JobData[] {
  const jobs: JobData[] = [];
  
  try {
    // Extract jobs using regex patterns for Naukri.com structure
    const jobBlocks = html.match(/<article[^>]*class="[^"]*jobTuple[^"]*"[^>]*>.*?<\/article>/gs) || [];
    
    for (const block of jobBlocks) {
      const job: Partial<JobData> = {};
      
      // Extract title
      const titleMatch = block.match(/<a[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</i);
      if (titleMatch) job.title = cleanText(titleMatch[1]);
      
      // Extract company
      const companyMatch = block.match(/<a[^>]*class="[^"]*companyName[^"]*"[^>]*>([^<]+)</i);
      if (companyMatch) job.company = cleanText(companyMatch[1]);
      
      // Extract location
      const locationMatch = block.match(/<span[^>]*class="[^"]*locationsContainer[^"]*"[^>]*>([^<]+)</i);
      if (locationMatch) job.location = cleanText(locationMatch[1]);
      
      // Extract experience
      const expMatch = block.match(/<span[^>]*class="[^"]*expwdth[^"]*"[^>]*>([^<]+)</i);
      if (expMatch) job.experience = cleanText(expMatch[1]);
      
      // Extract salary
      const salaryMatch = block.match(/<span[^>]*class="[^"]*sal[^"]*"[^>]*>([^<]+)</i);
      if (salaryMatch) job.salary = cleanText(salaryMatch[1]);
      
      // Extract skills
      const skillsMatches = block.match(/<span[^>]*class="[^"]*chip[^"]*"[^>]*>([^<]+)</gi);
      if (skillsMatches) {
        job.skills = skillsMatches.map(match => {
          const skillMatch = match.match(/>([^<]+)</);
          return skillMatch ? cleanText(skillMatch[1]) : '';
        }).filter(Boolean);
      }
      
      job.url = sourceUrl;
      job.description = extractTextContent(block).substring(0, 500);
      
      if (job.title && job.company) {
        job.type = 'full-time';
        job.remote = job.location?.toLowerCase().includes('remote') || false;
        jobs.push(job as JobData);
      }
    }
  } catch (error) {
    console.error('❌ Error parsing Naukri jobs:', error);
  }
  
  return jobs;
}

function parseIndeedJobs(html: string, sourceUrl?: string): JobData[] {
  const jobs: JobData[] = [];
  
  try {
    // Extract jobs using Indeed's structure
    const jobBlocks = html.match(/<div[^>]*data-jk="[^"]*"[^>]*>.*?(?=<div[^>]*data-jk=|$)/gs) || [];
    
    for (const block of jobBlocks) {
      const job: Partial<JobData> = {};
      
      // Extract title
      const titleMatch = block.match(/<h2[^>]*class="[^"]*jobTitle[^"]*"[^>]*>.*?<span[^>]*>([^<]+)</i);
      if (titleMatch) job.title = cleanText(titleMatch[1]);
      
      // Extract company
      const companyMatch = block.match(/<span[^>]*class="[^"]*companyName[^"]*"[^>]*>([^<]+)</i);
      if (companyMatch) job.company = cleanText(companyMatch[1]);
      
      // Extract location
      const locationMatch = block.match(/<div[^>]*class="[^"]*companyLocation[^"]*"[^>]*>([^<]+)</i);
      if (locationMatch) job.location = cleanText(locationMatch[1]);
      
      // Extract salary
      const salaryMatch = block.match(/<span[^>]*class="[^"]*salary-snippet[^"]*"[^>]*>([^<]+)</i);
      if (salaryMatch) job.salary = cleanText(salaryMatch[1]);
      
      job.url = sourceUrl;
      job.description = extractTextContent(block).substring(0, 500);
      
      if (job.title && job.company) {
        job.type = 'full-time';
        job.remote = job.location?.toLowerCase().includes('remote') || false;
        jobs.push(job as JobData);
      }
    }
  } catch (error) {
    console.error('❌ Error parsing Indeed jobs:', error);
  }
  
  return jobs;
}

function parseLinkedInJobs(html: string, sourceUrl?: string): JobData[] {
  const jobs: JobData[] = [];
  
  try {
    // Extract jobs using LinkedIn's structure
    const jobBlocks = html.match(/<li[^>]*class="[^"]*jobs-search-result[^"]*"[^>]*>.*?<\/li>/gs) || [];
    
    for (const block of jobBlocks) {
      const job: Partial<JobData> = {};
      
      // Extract title
      const titleMatch = block.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>.*?<a[^>]*>([^<]+)</i);
      if (titleMatch) job.title = cleanText(titleMatch[1]);
      
      // Extract company
      const companyMatch = block.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>.*?<a[^>]*>([^<]+)</i);
      if (companyMatch) job.company = cleanText(companyMatch[1]);
      
      // Extract location
      const locationMatch = block.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([^<]+)</i);
      if (locationMatch) job.location = cleanText(locationMatch[1]);
      
      job.url = sourceUrl;
      job.description = extractTextContent(block).substring(0, 500);
      
      if (job.title && job.company) {
        job.type = 'full-time';
        job.remote = job.location?.toLowerCase().includes('remote') || false;
        jobs.push(job as JobData);
      }
    }
  } catch (error) {
    console.error('❌ Error parsing LinkedIn jobs:', error);
  }
  
  return jobs;
}

function extractTextContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}