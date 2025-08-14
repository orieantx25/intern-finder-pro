import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("Missing FIRECRAWL_API_KEY secret");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { url, limit = 100, scrapeOptions = { formats: ["markdown", "html"] } } = body || {};

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "'url' is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[firecrawl] Crawling:", url, { limit });

    const fcResp = await fetch("https://api.firecrawl.dev/v1/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, limit, scrapeOptions }),
    });

    const result = await fcResp.json().catch(() => null);

    if (!fcResp.ok) {
      console.error("[firecrawl] Failed: ", fcResp.status, result);
      return new Response(
        JSON.stringify({ success: false, status: fcResp.status, error: result?.error || result || "Firecrawl error" }),
        { status: fcResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[firecrawl] Success");
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[firecrawl] Unexpected error:", err);
    return new Response(JSON.stringify({ success: false, error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
