import { supabase } from "@/integrations/supabase/client";

export type CrawlResult = {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
};

export class FirecrawlService {
  static async crawlWebsite(url: string, options?: { limit?: number; scrapeOptions?: any }): Promise<CrawlResult> {
    const { data, error } = await supabase.functions.invoke("firecrawl", {
      body: {
        url,
        limit: options?.limit ?? 100,
        scrapeOptions: options?.scrapeOptions ?? { formats: ["markdown", "html"] },
      },
    });

    if (error) {
      console.error("Firecrawl function error:", error);
      return { success: false, error: error.message };
    }

    return data as CrawlResult;
  }
}
