import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobListing {
  title: string;
  company: string;
  location: string;
  skills: string[];
  experience_required: string;
  description: string;
  url: string;
  source: string;
  salary_range?: string;
  posted_at: string;
  external_id: string;
}

interface CrawlTarget {
  name: string;
  base_url: string;
  search_patterns: {
    job_listings: string[];
    job_title: string[];
    company: string[];
    location: string[];
    skills: string[];
    experience: string[];
    description: string[];
    apply_link: string[];
    salary: string[];
    posted_date: string[];
  };
}

const CRAWL_TARGETS: CrawlTarget[] = [
  {
    name: 'Naukri',
    base_url: 'https://www.naukri.com',
    search_patterns: {
      job_listings: ['.srp-jobtuple-wrapper', '.job-tuple', '.jobTuple'],
      job_title: ['.title', '.job-title', '.designation', 'h3 a', '.jobTupleHeader .title'],
      company: ['.companyInfo .company', '.company-name', '.org-details .company', '.subTitle .company'],
      location: ['.location-info', '.job-location', '.locations', '.locationsContainer'],
      skills: ['.skills .chip-container span', '.tags .tag', '.skill-container .skill'],
      experience: ['.experience', '.exp', '.experience-range', '.ellipsis.fleft.experience'],
      description: ['.job-description', '.description', '.job-summary'],
      apply_link: ['a[href*="job-detail"]', '.title a', '.jobTupleHeader a'],
      salary: ['.salary', '.package', '.sal', '.salary-info'],
      posted_date: ['.job-post-day', '.posted-date', '.timeAgo', '.date-posted']
    }
  },
  {
    name: 'Indeed India',
    base_url: 'https://in.indeed.com',
    search_patterns: {
      job_listings: ['.jobsearch-SerpJobCard', '.job_seen_beacon', '.slider_container .slider_item'],
      job_title: ['h2 a span[title]', '.jobTitle a span', 'h2.jobTitle span'],
      company: ['.companyName span', '.companyName a', '.company'],
      location: ['.companyLocation', '.locationsContainer div'],
      skills: ['.jobSnippet .jobSnippet span', '.job-snippet li'],
      experience: ['.metadata .attribute_snippet', '.jobMetadata .attribute'],
      description: ['.jobSnippet', '.job-snippet', '.summary'],
      apply_link: ['h2 a', '.jobTitle a'],
      salary: ['.salary-snippet', '.estimated-salary', '.salary'],
      posted_date: ['.date', '.jobsearch-JobMetadataFooter span']
    }
  },
  {
    name: 'LinkedIn',
    base_url: 'https://www.linkedin.com',
    search_patterns: {
      job_listings: ['.base-card', '.job-search-card', '.jobs-search__results-list li'],
      job_title: ['.base-search-card__title', '.job-search-card__title', 'h3 a'],
      company: ['.base-search-card__subtitle', '.job-search-card__subtitle a', '.job-result-card__subtitle'],
      location: ['.job-search-card__location', '.job-result-card__location'],
      skills: ['.job-search-card__benefits', '.job-flavors__flavors li'],
      experience: ['.job-search-card__benefits', '.job-criteria dd'],
      description: ['.job-search-card__snippet', '.job-description'],
      apply_link: ['.base-card__full-link', '.job-search-card__title-link', 'h3 a'],
      salary: ['.job-search-card__salary-info', '.job-criteria__salary'],
      posted_date: ['.job-search-card__listdate', '.job-result-card__listdate']
    }
  },
  {
    name: 'Monster India',
    base_url: 'https://www.monsterindia.com',
    search_patterns: {
      job_listings: ['.card-body', '.job-card', '.search-results .card'],
      job_title: ['.job-tittle', '.job-title', 'h2 a', '.card-title'],
      company: ['.company-name', '.company', '.org-name'],
      location: ['.location', '.job-location', '.loc'],
      skills: ['.skills .skill', '.job-tags .tag'],
      experience: ['.experience', '.exp-range', '.job-meta .experience'],
      description: ['.job-summary', '.description', '.job-desc'],
      apply_link: ['.job-tittle a', '.apply-btn', 'h2 a'],
      salary: ['.salary', '.package', '.salary-range'],
      posted_date: ['.posted-date', '.job-age', '.time-ago']
    }
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🚀 Starting intelligent job crawler...')

    // Get active job sources from database
    const { data: jobSources, error: sourcesError } = await supabase
      .from('job_sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError) {
      throw new Error(`Failed to fetch job sources: ${sourcesError.message}`)
    }

    const results = {
      total_crawled: 0,
      new_jobs: 0,
      updated_jobs: 0,
      errors: [] as string[],
      sources_processed: [] as string[]
    }

    // Process each job source
    for (const source of jobSources || []) {
      try {
        console.log(`🎯 Processing ${source.name}...`)
        
        const crawlTarget = CRAWL_TARGETS.find(t => t.name === source.name)
        if (!crawlTarget) {
          console.log(`⚠️ No crawl pattern found for ${source.name}, using Firecrawl`)
          continue
        }

        // Search URLs for different job categories
        const searchUrls = await generateSearchUrls(source.name, source.base_url)
        
        for (const searchUrl of searchUrls) {
          console.log(`🔍 Crawling: ${searchUrl}`)
          
          // Use Firecrawl to get job listings
          const crawlResult = await crawlJobsWithFirecrawl(firecrawlApiKey, searchUrl)
          
          if (crawlResult.success && crawlResult.data) {
            const extractedJobs = await extractJobsFromCrawlData(
              crawlResult.data,
              crawlTarget,
              source.name
            )
            
            console.log(`📋 Extracted ${extractedJobs.length} jobs from ${searchUrl}`)
            
            // Save jobs to database
            const saveResults = await saveJobsToDatabase(supabase, extractedJobs)
            results.new_jobs += saveResults.new_jobs
            results.updated_jobs += saveResults.updated_jobs
            results.total_crawled += extractedJobs.length
          } else {
            const errorMsg = `Failed to crawl ${searchUrl}: ${crawlResult.error}`
            console.error(errorMsg)
            results.errors.push(errorMsg)
          }

          // Respect rate limiting - wait 2 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        // Update last crawled time
        await supabase
          .from('job_sources')
          .update({ last_crawled_at: new Date().toISOString() })
          .eq('id', source.id)

        results.sources_processed.push(source.name)
        
      } catch (error) {
        const errorMsg = `Error processing ${source.name}: ${error.message}`
        console.error(errorMsg)
        results.errors.push(errorMsg)
      }
    }

    // Clean up expired jobs (jobs older than 30 days without updates)
    await cleanupExpiredJobs(supabase)

    console.log('✅ Job crawling completed:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job crawling completed successfully',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Job crawler error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function generateSearchUrls(sourceName: string, baseUrl: string): Promise<string[]> {
  const searchTerms = [
    'software engineer',
    'data scientist',
    'product manager',
    'frontend developer',
    'backend developer',
    'full stack developer',
    'devops engineer',
    'machine learning engineer',
    'ui ux designer',
    'business analyst'
  ]

  const locations = ['bangalore', 'mumbai', 'delhi', 'pune', 'hyderabad', 'chennai', 'remote']

  const urls: string[] = []

  for (const term of searchTerms.slice(0, 3)) { // Limit to 3 terms per source to avoid overwhelming
    for (const location of locations.slice(0, 2)) { // Limit to 2 locations per term
      let searchUrl = ''
      
      switch (sourceName) {
        case 'Naukri':
          searchUrl = `${baseUrl}/jobs-in-${location}?k=${encodeURIComponent(term)}`
          break
        case 'Indeed India':
          searchUrl = `${baseUrl}/jobs?q=${encodeURIComponent(term)}&l=${encodeURIComponent(location)}`
          break
        case 'LinkedIn':
          searchUrl = `${baseUrl}/jobs/search/?keywords=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&f_TPR=r86400` // Last 24 hours
          break
        case 'Monster India':
          searchUrl = `${baseUrl}/search/${encodeURIComponent(term)}-jobs-in-${location}`
          break
        default:
          searchUrl = `${baseUrl}?q=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}`
      }
      
      urls.push(searchUrl)
    }
  }

  return urls
}

async function crawlJobsWithFirecrawl(apiKey: string, url: string) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v0/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        crawlerOptions: {
          includes: [url],
          excludes: ['**/privacy', '**/terms', '**/about'],
          generateImgAltText: false,
          limit: 10
        },
        pageOptions: {
          onlyMainContent: true,
          includeHtml: true,
          screenshot: false
        }
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Crawl request failed' }
    }

    // Poll for results if crawl is async
    if (result.jobId) {
      return await pollCrawlStatus(apiKey, result.jobId)
    }

    return { success: true, data: result }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function pollCrawlStatus(apiKey: string, jobId: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`https://api.firecrawl.dev/v0/crawl/status/${jobId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })

      const result = await response.json()
      
      if (result.status === 'completed') {
        return { success: true, data: result }
      } else if (result.status === 'failed') {
        return { success: false, error: result.error || 'Crawl failed' }
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 5000))
      
    } catch (error) {
      console.error(`Polling attempt ${i + 1} failed:`, error)
    }
  }

  return { success: false, error: 'Crawl timeout - max attempts reached' }
}

async function extractJobsFromCrawlData(
  crawlData: any,
  crawlTarget: CrawlTarget,
  sourceName: string
): Promise<JobListing[]> {
  const jobs: JobListing[] = []
  
  if (!crawlData.data || !Array.isArray(crawlData.data)) {
    return jobs
  }

  for (const page of crawlData.data) {
    if (!page.html && !page.markdown) continue

    const content = page.html || page.markdown
    const pageUrl = page.metadata?.sourceURL || page.url || ''

    try {
      // Extract individual job listings from the page content
      const jobElements = extractJobElements(content, crawlTarget.search_patterns.job_listings)
      
      for (const jobElement of jobElements) {
        const job = extractJobDetails(jobElement, crawlTarget, sourceName, pageUrl)
        if (job && job.title && job.company) {
          jobs.push(job)
        }
      }
      
    } catch (error) {
      console.error(`Error extracting jobs from page ${pageUrl}:`, error)
    }
  }

  return jobs
}

function extractJobElements(content: string, patterns: string[]): string[] {
  const elements: string[] = []
  
  // Simple HTML parsing - in production, you'd use a proper HTML parser
  for (const pattern of patterns) {
    const regex = new RegExp(`<[^>]*class="[^"]*${pattern.replace('.', '')}[^"]*"[^>]*>.*?</[^>]+>`, 'gs')
    const matches = content.match(regex) || []
    elements.push(...matches)
  }
  
  // If no HTML matches, try extracting from markdown sections
  if (elements.length === 0) {
    const sections = content.split(/\n\n+/).filter(section => 
      section.includes('Software') || 
      section.includes('Engineer') || 
      section.includes('Developer') ||
      section.includes('Manager') ||
      section.includes('Analyst')
    )
    elements.push(...sections)
  }
  
  return elements
}

function extractJobDetails(
  jobElement: string,
  crawlTarget: CrawlTarget,
  sourceName: string,
  pageUrl: string
): JobListing | null {
  try {
    const title = extractWithPatterns(jobElement, crawlTarget.search_patterns.job_title)
    const company = extractWithPatterns(jobElement, crawlTarget.search_patterns.company)
    const location = extractWithPatterns(jobElement, crawlTarget.search_patterns.location)
    const description = extractWithPatterns(jobElement, crawlTarget.search_patterns.description)
    const experienceText = extractWithPatterns(jobElement, crawlTarget.search_patterns.experience)
    const salaryText = extractWithPatterns(jobElement, crawlTarget.search_patterns.salary)
    const skillsText = extractWithPatterns(jobElement, crawlTarget.search_patterns.skills)
    
    // Extract apply link
    const applyLinkMatch = jobElement.match(/href="([^"]*)"/)
    let applyUrl = applyLinkMatch ? applyLinkMatch[1] : pageUrl
    
    // Make relative URLs absolute
    if (applyUrl.startsWith('/')) {
      const baseUrl = crawlTarget.base_url
      applyUrl = baseUrl + applyUrl
    }

    // Parse skills from text
    const skills = parseSkills(skillsText)

    // Generate external ID
    const external_id = `${sourceName.toLowerCase()}_${Buffer.from(title + company).toString('base64').slice(0, 16)}_${Date.now()}`

    return {
      title: cleanText(title),
      company: cleanText(company),
      location: cleanText(location) || 'Not specified',
      skills,
      experience_required: cleanText(experienceText) || 'Not specified',
      description: cleanText(description) || 'Job description not available',
      url: applyUrl,
      source: sourceName.toLowerCase(),
      salary_range: cleanText(salaryText),
      posted_at: new Date().toISOString(),
      external_id
    }
    
  } catch (error) {
    console.error('Error extracting job details:', error)
    return null
  }
}

function extractWithPatterns(content: string, patterns: string[]): string {
  for (const pattern of patterns) {
    // Remove CSS selector syntax and create a more flexible regex
    const cleanPattern = pattern.replace(/[.#]/g, '').replace(/\s+/g, '\\s+')
    
    // Try HTML tag extraction
    const htmlRegex = new RegExp(`<[^>]*${cleanPattern}[^>]*>([^<]+)`, 'i')
    const htmlMatch = content.match(htmlRegex)
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1].trim()
    }
    
    // Try class/id attribute extraction
    const attrRegex = new RegExp(`class="[^"]*${cleanPattern}[^"]*"[^>]*>([^<]+)`, 'i')
    const attrMatch = content.match(attrRegex)
    if (attrMatch && attrMatch[1]) {
      return attrMatch[1].trim()
    }
  }
  
  // Fallback: look for common job-related keywords
  const fallbackPatterns = [
    /(?:Job Title|Position|Role):\s*([^\n]+)/i,
    /(?:Company|Organization):\s*([^\n]+)/i,
    /(?:Location|Based in):\s*([^\n]+)/i,
    /(?:Experience|Years?):\s*([^\n]+)/i,
    /(?:Skills?|Technologies?):\s*([^\n]+)/i,
    /(?:Salary|Package|Compensation):\s*([^\n]+)/i
  ]
  
  for (const regex of fallbackPatterns) {
    const match = content.match(regex)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ''
}

function parseSkills(skillsText: string): string[] {
  if (!skillsText) return []
  
  // Common skill separators and cleanup
  const skills = skillsText
    .split(/[,|;•\n]/)
    .map(skill => skill.trim())
    .filter(skill => skill.length > 1 && skill.length < 50)
    .slice(0, 10) // Limit to 10 skills
  
  return skills
}

function cleanText(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[a-z]+;/gi, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

async function saveJobsToDatabase(supabase: any, jobs: JobListing[]) {
  let new_jobs = 0
  let updated_jobs = 0
  
  for (const job of jobs) {
    try {
      // Check if job already exists
      const { data: existing, error: checkError } = await supabase
        .from('jobs')
        .select('id, updated_at')
        .eq('external_id', job.external_id)
        .maybeSingle()

      if (checkError && !checkError.message.includes('No rows')) {
        console.error(`Error checking existing job: ${checkError.message}`)
        continue
      }

      if (existing) {
        // Update existing job
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            skills: job.skills,
            experience_required: job.experience_required,
            salary_range: job.salary_range,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error(`Error updating job: ${updateError.message}`)
        } else {
          updated_jobs++
        }
      } else {
        // Insert new job (bypass RLS for system operations)
        const { error: insertError } = await supabase
          .rpc('insert_job', {
            p_external_id: job.external_id,
            p_title: job.title,
            p_company: job.company,
            p_location: job.location,
            p_description: job.description,
            p_url: job.url,
            p_source: job.source,
            p_skills: job.skills,
            p_experience_required: job.experience_required,
            p_salary_range: job.salary_range,
            p_posted_at: job.posted_at
          })

        if (insertError) {
          console.error(`Error inserting job: ${insertError.message}`)
        } else {
          new_jobs++
        }
      }
      
    } catch (error) {
      console.error(`Error saving job: ${error.message}`)
    }
  }
  
  return { new_jobs, updated_jobs }
}

async function cleanupExpiredJobs(supabase: any) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  try {
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .eq('is_active', true)

    if (error) {
      console.error('Error cleaning up expired jobs:', error)
    } else {
      console.log('✅ Expired jobs cleanup completed')
    }
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}