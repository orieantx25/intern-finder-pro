import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🕐 Job Scheduler: Starting automated job crawling');
    
    // Get the last crawl time to determine if we should run
    const { data: lastRun, error: lastRunError } = await supabase
      .from('job_sources')
      .select('last_crawled_at')
      .order('last_crawled_at', { ascending: false })
      .limit(1)
      .single();

    if (lastRunError && lastRunError.code !== 'PGRST116') {
      console.error('❌ Error checking last crawl time:', lastRunError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check last crawl time' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const now = new Date();
    const lastCrawl = lastRun?.last_crawled_at ? new Date(lastRun.last_crawled_at) : null;
    const hoursSinceLastCrawl = lastCrawl 
      ? (now.getTime() - lastCrawl.getTime()) / (1000 * 60 * 60)
      : 24; // If no previous crawl, assume it's been 24 hours

    // Only run if it's been more than 12 hours
    if (hoursSinceLastCrawl < 12) {
      console.log(`⏰ Too soon to crawl. Last crawl was ${hoursSinceLastCrawl.toFixed(1)} hours ago`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Skipped crawl. Last crawl was ${hoursSinceLastCrawl.toFixed(1)} hours ago`,
          nextCrawlIn: `${(12 - hoursSinceLastCrawl).toFixed(1)} hours`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Starting scheduled job crawl...');
    
    // Trigger the job crawler
    const { data, error } = await supabase.functions.invoke('job-crawler');
    
    if (error) {
      console.error('❌ Error invoking job crawler:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to start job crawler' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Scheduled job crawl completed successfully');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled job crawl completed',
        crawlerResult: data,
        scheduledAt: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Job scheduler error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown scheduler error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});