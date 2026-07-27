/**
 * Tool Registry
 * Central index mapping agent IDs to their associated tool names.
 * Tool definitions stay in their current files (e.g. SOCIAL_TOOLS in agent-router.ts,
 * social tools in lib/social/tools.ts). This registry is a single source of truth for
 * which tools belong to which agent, supplementing (not replacing) tool-assembler.ts.
 */

import { AGENT_IDS, type AgentId } from './constants'

export const TOOL_REGISTRY: Record<AgentId, string[]> = {
  [AGENT_IDS.SEO_AEO]: [
    // Keyword Research
    'keywords_data_google_ads_search_volume',
    'dataforseo_labs_google_keyword_ideas',
    'dataforseo_labs_google_keyword_suggestions',
    'dataforseo_labs_google_keyword_overview',
    'dataforseo_labs_bulk_keyword_difficulty',
    'dataforseo_labs_search_intent',
    'dataforseo_labs_google_keywords_for_site',
    'dataforseo_labs_google_related_keywords',
    // SERP Analysis
    'serp_organic_live_advanced',
    'serp_locations',
    'dataforseo_labs_google_serp_competitors',
    'dataforseo_labs_google_historical_serp',
    'dataforseo_labs_google_top_searches',
    // YouTube SEO
    'serp_youtube_organic_live_advanced',
    'serp_youtube_video_info_live_advanced',
    'serp_youtube_video_comments_live_advanced',
    'serp_youtube_video_subtitles_live_advanced',
    'serp_youtube_locations',
    // Competitor Analysis
    'dataforseo_labs_google_ranked_keywords',
    'dataforseo_labs_google_competitors_domain',
    'dataforseo_labs_google_domain_intersection',
    'dataforseo_labs_google_page_intersection',
    'dataforseo_labs_google_relevant_pages',
    'dataforseo_labs_google_subdomains',
    // Domain Analysis
    'dataforseo_labs_google_domain_rank_overview',
    'dataforseo_labs_google_historical_rank_overview',
    'dataforseo_labs_bulk_traffic_estimation',
    'domain_analytics_whois_overview',
    'domain_analytics_technologies_domain_technologies',
    // Backlinks
    'aisa_backlinks_summary',
    'aisa_backlinks_list',
    'aisa_referring_domains',
    'aisa_backlink_anchors',
    // Trends
    'keywords_data_google_trends_explore',
    'keywords_data_dataforseo_trends_explore',
    'keywords_data_dataforseo_trends_demography',
    // Technical SEO
    'on_page_lighthouse',
    'on_page_content_parsing',
    'on_page_instant_pages',
    // AI/AEO Optimization
    'ai_optimization_keyword_data_search_volume',
    'ai_optimization_keyword_data_locations_and_languages',
    // Content Analysis
    'content_analysis_search',
    'content_analysis_summary',
    'content_analysis_phrase_trends',
    // Business Data
    'business_data_business_listings_search',
    // Firecrawl (Web Scraping)
    'firecrawl_scrape',
    'firecrawl_search',
    'firecrawl_crawl',
    'firecrawl_map',
    'firecrawl_extract',
    'firecrawl_check_crawl_status',
    'geo_fix_cycle_status',
  ],

  [AGENT_IDS.GEO]: [
    'geo_brand_scan',
    'geo_generate_fix',
    'generate_schema_markup',
    'ai_crawlability_audit',
    'geo_setup_tracking',
    'geo_tracked_prompts',
    'geo_prompt_snapshot',
    'geo_competitors',
    'geo_visibility_report',
    'geo_daily_digest',
    'geo_perplexity_direct_probe',
    'geo_gateway_control_probe',
    'geo_start_fix_cycle',
    'geo_mark_fix_shipped',
    'geo_fix_cycle_status',
  ],

  [AGENT_IDS.CONTENT]: [
    // Core content tools
    'generate_content_package',
    'generate_researched_content',
    'perplexity_search',
    // Firecrawl (Research)
    'firecrawl_scrape',
    'firecrawl_search',
    'firecrawl_crawl',
    // Content Analysis
    'content_analysis_search',
    'content_analysis_summary',
    'content_analysis_phrase_trends',
    // Keyword Optimization
    'keywords_data_google_ads_search_volume',
    'dataforseo_labs_search_intent',
    'dataforseo_labs_google_keyword_suggestions',
    // Jina advanced tools
    'read_url',
    'search_web',
    'expand_query',
    'parallel_search_web',
    'sort_by_relevance',
  ],

  [AGENT_IDS.SOCIAL]: [
    'aisa_x_profile',
    'aisa_x_search',
    'reddit_social_search',
    'firecrawl_search',
    'firecrawl_scrape',
    'search_web',
    'parallel_search_web',
    'read_url',
  ],

  [AGENT_IDS.ONBOARDING]: [
    'client_ui',
    'onboarding_progress',
  ],

  [AGENT_IDS.GENERAL]: [
    'web_search_competitors',
    'perplexity_search',
    'client_ui',
  ],

  [AGENT_IDS.IMAGE]: [
    'generate_article_images',
    'generate_hero_image',
  ],
}

export function getToolsForAgent(agentId: AgentId): string[] {
  return TOOL_REGISTRY[agentId] ?? []
}

export const ALL_TOOLS: string[] = Object.values(TOOL_REGISTRY).flat()