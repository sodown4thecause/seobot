import {
  streamText,
  convertToCoreMessages,
  tool,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";
import { buildOnboardingSystemPrompt } from "@/lib/onboarding/prompts";
import {
  type OnboardingData,
  type OnboardingStep,
} from "@/lib/onboarding/state";
import { serverEnv } from "@/lib/config/env";
import {
  findRelevantFrameworks,
  formatFrameworksForPrompt,
  batchIncrementUsage,
} from "@/lib/ai/rag-service";
import { handleDataForSEOFunctionCall } from "@/lib/ai/dataforseo-tools";
import { getDataForSEOTools } from "@/lib/mcp/dataforseo-client";
import { getFirecrawlTools } from "@/lib/mcp/firecrawl-client";
import { getJinaTools } from "@/lib/mcp/jina-client";
import { getWinstonTools } from "@/lib/mcp/winston-client";
import { getContentQualityTools } from "@/lib/ai/content-quality-tools";
import { getEnhancedContentQualityTools } from "@/lib/ai/content-quality-enhancements";
import { searchWithPerplexity } from "@/lib/external-apis/perplexity";
// import { buildCodemodeToolRegistry, createCodemodeTool } from "@/lib/ai/codemode"; // DISABLED
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { vercelGateway } from "@/lib/ai/gateway-provider";
import { rateLimitMiddleware } from "@/lib/redis/rate-limit";
import { z } from "zod";

export const runtime = "edge";

// Using GPT-4o via Vercel Gateway
const CHAT_MODEL_ID = "openai/gpt-4o";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content?: string; // Legacy format
  parts?: Array<{ type: string; text?: string }>; // AI SDK v5 format
}

interface OnboardingContext {
  currentStep?: number;
  data?: OnboardingData;
}

interface ChatContext {
  page?: string;
  onboarding?: OnboardingContext;
  [key: string]: unknown;
}

interface RequestBody {
  messages: any[];
  context?: ChatContext;
}

export async function POST(req: Request) {
  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(req as any, "CHAT");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { messages, context } = body;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Initialize Orchestrator
    const orchestrator = new OrchestratorAgent();

    // Extract onboarding context if present
    const onboardingContext = context?.onboarding;
    const isOnboarding = context?.page === "onboarding";

    // Extract last user message content for intent detection
    const lastUserMessage = messages[messages.length - 1];
    const lastUserMessageContent = lastUserMessage.content || "";

    // WORKFLOW DETECTION: Check if user wants to run a workflow
    const { detectWorkflow, isWorkflowRequest, extractWorkflowId } =
      await import("@/lib/workflows");
    const detectedWorkflowId = detectWorkflow(lastUserMessageContent);
    const isExplicitWorkflowRequest = isWorkflowRequest(lastUserMessageContent);
    const explicitWorkflowId = extractWorkflowId(lastUserMessageContent);

    const workflowId = explicitWorkflowId || detectedWorkflowId;

    if (workflowId) {
      console.log("[Chat API] Workflow detected:", workflowId);
      // Return a message indicating workflow execution
      // The actual workflow will be executed via the /api/workflows/execute endpoint
      return new Response(
        JSON.stringify({
          type: "workflow",
          workflowId,
          message: `Starting workflow: ${workflowId}. Please use the workflow API endpoint to execute.`,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // RAG: Detect if query needs framework assistance
    const shouldUseRAG = detectFrameworkIntent(lastUserMessageContent);

    let retrievedFrameworks: string = "";
    let frameworkIds: string[] = [];

    // RAG: Retrieve relevant frameworks if needed
    if (shouldUseRAG && !isOnboarding) {
      try {
        const ragStartTime = Date.now();
        const frameworks = await findRelevantFrameworks(
          lastUserMessageContent,
          {
            maxResults: 3,
          },
        );

        if (frameworks.length > 0) {
          retrievedFrameworks = formatFrameworksForPrompt(frameworks);
          frameworkIds = frameworks.map((f) => f.id);
          const ragDuration = Date.now() - ragStartTime;
          console.log(
            `[Chat] RAG retrieved ${frameworks.length} frameworks in ${ragDuration}ms`,
          );
        }
      } catch (error) {
        // Graceful degradation: continue without RAG if retrieval fails
        console.warn(
          "[Chat] RAG retrieval failed, continuing without frameworks:",
          error,
        );
      }
    }

    // Build system prompt based on context
    let systemPrompt: string;
    if (isOnboarding && onboardingContext) {
      const currentStep = onboardingContext.currentStep || 1;
      const onboardingData = onboardingContext.data || {};
      systemPrompt = buildOnboardingSystemPrompt(
        currentStep as OnboardingStep,
        onboardingData as OnboardingData,
      );
    } else {
      systemPrompt = buildGeneralSystemPrompt(context, retrievedFrameworks);
    }

    // Load tools from DataForSEO MCP server
    let seoTools: Record<string, any>;
    let mcpConnected = false;

    try {
      const mcpTools = await getDataForSEOTools();
      if (mcpTools && Object.keys(mcpTools).length > 0) {
        mcpConnected = true;
        
        // Filter to only include essential tools to prevent context window overload
        const essentialTools = [
          'serp_google_organic_live_advanced',
          'serp_google_maps_live_advanced',
          'serp_google_images_live_advanced',
          'serp_google_news_live_advanced',
          'on_page_lighthouse',
          'on_page_content_parsing',
          'keywords_data_google_ads_search_volume',
          'dataforseo_labs_google_domain_rank_overview',
          'dataforseo_labs_google_ranked_keywords',
          'dataforseo_labs_google_competitors_domain',
          'backlinks_backlinks',
          'backlinks_summary'
        ];

        seoTools = Object.fromEntries(
          Object.entries(mcpTools).filter(([key]) => essentialTools.includes(key))
        );
      } else {
        mcpConnected = false;
        throw new Error("No tools returned");
      }
    } catch (error) {
      console.error("[Chat API] Failed to load MCP tools:", error);
      mcpConnected = false;
      seoTools = {
        ai_keyword_search_volume: tool({
          description:
            "Get search volume for keywords in AI platforms like ChatGPT, Claude, Perplexity. Use for GEO (Generative Engine Optimization) analysis.",
          parameters: z.object({
            keywords: z
              .array(z.string())
              .describe("Keywords to analyze in AI platforms"),
            location: z
              .string()
              .optional()
              .describe('Location (e.g., "United States", "United Kingdom")'),
          }),
          execute: async (args: any) => {
            const result = await handleDataForSEOFunctionCall(
              "ai_keyword_search_volume",
              args,
            );
            return { result };
          },
        } as any),
        keyword_search_volume: tool({
          description:
            "Get Google search volume, CPC, and competition for keywords. Core keyword research tool.",
          parameters: z.object({
            keywords: z
              .array(z.string())
              .describe("Keywords to analyze (max 100)"),
            location: z.string().optional().describe("Location for data"),
          }),
          execute: async (args: any) => {
            const result = await handleDataForSEOFunctionCall(
              "keyword_search_volume",
              args,
            );
            return { result };
          },
        } as any),
        google_rankings: tool({
          description:
            "Get current Google SERP results for a keyword including position, URL, title, and SERP features.",
          parameters: z.object({
            keyword: z.string().describe("Keyword to check rankings for"),
            location: z
              .string()
              .optional()
              .describe("Location for SERP results"),
          }),
          execute: async (args: any) => {
            const result = await handleDataForSEOFunctionCall(
              "google_rankings",
              args,
            );
            return { result };
          },
        } as any),
        domain_overview: tool({
          description:
            "Get comprehensive SEO metrics for a domain: traffic, keywords, rankings, visibility. This is an expensive operation that requires user approval.",
          parameters: z.object({
            domain: z
              .string()
              .describe("Domain to analyze (without http://)"),
            location: z.string().optional().describe("Location for metrics"),
          }),
          execute: async (args: any) => {
            const result = await handleDataForSEOFunctionCall(
              "domain_overview",
              args,
            );
            return { result };
          },
        } as any),
      };
    }

    // Load Firecrawl tools
    let firecrawlTools: Record<string, any> = {};
    try {
      if (serverEnv.FIRECRAWL_API_KEY) {
        const tools = await getFirecrawlTools();
        if (tools && Object.keys(tools).length > 0) {
          firecrawlTools = tools;
          console.log(`[Chat API] Loaded ${Object.keys(tools).length} Firecrawl tools`);
        }
      }
    } catch (error) {
      console.warn("[Chat API] Failed to load Firecrawl tools:", error);
    }

    // Load Jina tools
    let jinaTools: Record<string, any> = {};
    try {
      if (serverEnv.JINA_API_KEY) {
        const tools = await getJinaTools();
        if (tools && Object.keys(tools).length > 0) {
          jinaTools = tools;
          console.log(`[Chat API] Loaded ${Object.keys(tools).length} Jina tools`);
        }
      }
    } catch (error) {
      console.warn("[Chat API] Failed to load Jina tools:", error);
    }

    // Load Winston MCP tools
    let winstonMCPTools: Record<string, any> = {};
    try {
      if (serverEnv.WINSTON_AI_API_KEY) {
        const tools = await getWinstonTools();
        if (tools && Object.keys(tools).length > 0) {
          winstonMCPTools = tools;
          console.log(`[Chat API] Loaded ${Object.keys(tools).length} Winston MCP tools`);
        }
      }
    } catch (error) {
      console.warn("[Chat API] Failed to load Winston MCP tools:", error);
    }

    // Add content quality tools (Winston AI + Rytr)
    const contentQualityTools = getContentQualityTools();
    // Add enhanced content quality tools (SEO analysis, readability, fact-checking)
    const enhancedContentTools = getEnhancedContentQualityTools();

    // Add Perplexity tool
    const perplexityTool = {
      perplexity_search: tool({
        description: "Search the web using Perplexity AI for real-time, cited information. Use this for research, fact-checking, and finding authoritative sources.",
        parameters: z.object({
          query: z.string().describe("The search query"),
          search_recency_filter: z.enum(["month", "week", "day", "year"]).optional().describe("Filter results by recency"),
        }),
        execute: async ({ query, search_recency_filter }: any) => {
          return await searchWithPerplexity({
            query,
            searchRecencyFilter: search_recency_filter as "month" | "week" | "day" | "hour" | undefined,
          });
        },
      } as any),
    };

    // Orchestrator Tool - Content Generation with Research & Feedback Loop
    const orchestratorTool = {
      generate_researched_content: tool({
        description:
          "Generate high-quality, researched, and SEO-optimized content (blog posts, articles). This tool runs a comprehensive workflow: Research -> RAG (Best Practices) -> Write -> QA (Winston/Rytr) -> Feedback Loop.",
        parameters: z.object({
          topic: z.string().describe("The main topic of the content"),
          type: z
            .enum(["blog_post", "article", "social_media", "landing_page"])
            .describe("Type of content to generate"),
          keywords: z.array(z.string()).describe("Target keywords"),
          tone: z.string().optional().describe("Desired tone (e.g., professional, casual)"),
          wordCount: z.number().optional().describe("Target word count"),
        }),
        execute: async (args: any) => {
          try {
            // Pass userId for learning storage
            const result = await orchestrator.generateContent({
              ...args,
              userId: user?.id,
              targetPlatforms: ["chatgpt", "perplexity", "claude"], // Default targets
            });

            return {
              success: true,
              content: result.content,
              metadata: result.metadata,
              suggestions: result.suggestions,
              message: "Content generated successfully with research and QA passed.",
            };
          } catch (error) {
            console.error("[Chat API] Orchestrator error:", error);
            return {
              success: false,
              error: "Failed to generate content. Please try again.",
            };
          }
        },
      } as any),
    };

    const allTools = {
      ...seoTools,
      ...firecrawlTools,
      ...contentQualityTools,
      ...enhancedContentTools,
      ...jinaTools,
      ...winstonMCPTools,
      ...perplexityTool,
      ...orchestratorTool,
      client_ui: tool({
        description:
          "Display an interactive UI component to the user. Use this when you need to collect specific information or show structured data.",
        parameters: z.object({
          component: z
            .enum([
              "url_input",
              "card_selector",
              "location_picker",
              "confirmation_buttons",
              "loading_indicator",
              "analysis_result",
            ])
            .describe("The type of component to display"),
          props: z.record(z.any()).describe("The properties/data for the component"),
        }),
        execute: async ({ component }: any) => {
          // The client handles the actual display via tool call rendering.
          // We return a result to indicate the UI request was sent.
          return { displayed: true, component };
        },
      } as any),
    };

    // Using streamText from AI SDK 6
    const result = streamText({
      model: vercelGateway.languageModel(CHAT_MODEL_ID),
      messages: convertToCoreMessages(messages),
      system: systemPrompt,
      tools: allTools,
      // maxToolRoundtrips: 10, // Removed due to type error
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chat-api",
        metadata: {
          environment: process.env.NODE_ENV || "development",
          runtime: "edge",
          model: CHAT_MODEL_ID,
          provider: "gateway",
        },
      },
      onFinish: async ({ response }) => {
        const { messages: finalMessages } = response;
        
        // Save messages after completion
        if (user && !authError) {
          // We need to adapt standard messages to our DB schema
          // This is a simplified version of saving, you might need to adjust based on exact DB schema
          try {
            const lastMessage = finalMessages[finalMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              let content = "";
              if (typeof lastMessage.content === 'string') {
                content = lastMessage.content;
              } else if (Array.isArray(lastMessage.content)) {
                content = lastMessage.content
                  .filter(c => c.type === 'text')
                  .map(c => (c as any).text)
                  .join('');
              }
              
              const chatMessage = {
                user_id: user.id,
                role: 'assistant',
                content: content,
                metadata: onboardingContext ? { onboarding: onboardingContext } : {},
              };
              
              await supabase.from("chat_messages").insert(chatMessage);
              
              if (isOnboarding && onboardingContext?.data) {
                 await saveOnboardingProgress(supabase, user.id, onboardingContext.data);
              }
            }
          } catch (error) {
            console.error("Error saving chat messages:", error);
          }
        }

        // Track framework usage
        if (frameworkIds.length > 0) {
          batchIncrementUsage(frameworkIds).catch((err) =>
            console.warn("[Chat] Failed to track framework usage:", err),
          );
        }
      },
    });

    return (result as any).toDataStreamResponse();

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Chat API error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Detect if user's query should trigger RAG framework retrieval
 */
function detectFrameworkIntent(message: string): boolean {
  const messageLower = message.toLowerCase();

  // Action keywords indicating content creation
  const actionKeywords = [
    "write",
    "create",
    "generate",
    "draft",
    "compose",
    "build",
    "make",
    "develop",
    "produce",
    "craft",
  ];

  // Content type keywords
  const contentTypes = [
    "blog post",
    "article",
    "landing page",
    "email",
    "ad",
    "social post",
    "tweet",
    "copy",
    "content",
    "headline",
    "title",
    "description",
    "snippet",
  ];

  // Framework-specific keywords
  const frameworkKeywords = [
    "structure",
    "framework",
    "template",
    "format",
    "outline",
    "organize",
    "layout",
    "pattern",
  ];

  // SEO-specific keywords
  const seoKeywords = [
    "seo",
    "optimize",
    "rank",
    "serp",
    "meta",
    "keywords",
    "snippet",
    "schema",
    "featured",
    "paa",
    "people also ask",
    "header",
    "h1",
    "h2",
  ];

  // Check if message contains relevant keywords
  const hasActionKeyword = actionKeywords.some((kw) =>
    messageLower.includes(kw),
  );
  const hasContentType = contentTypes.some((kw) => messageLower.includes(kw));
  const hasFrameworkKeyword = frameworkKeywords.some((kw) =>
    messageLower.includes(kw),
  );
  const hasSeoKeyword = seoKeywords.some((kw) => messageLower.includes(kw));

  // Trigger RAG if:
  // - Action keyword + content type ("write a blog post")
  // - Framework keyword ("what structure should I use")
  // - Action keyword + SEO keyword ("optimize my title")
  return (
    (hasActionKeyword && hasContentType) ||
    hasFrameworkKeyword ||
    (hasActionKeyword && hasSeoKeyword)
  );
}

function buildGeneralSystemPrompt(
  context?: ChatContext,
  ragFrameworks?: string,
): string {
  const basePrompt = `You are an expert SEO assistant helping users improve their search rankings and create optimized content. You are friendly, professional, and provide actionable advice.

Your capabilities include:
- Analyzing websites and competitors
- Finding keyword opportunities
- Creating SEO-optimized content
- Validating content quality and originality
- Providing strategic recommendations
- Guiding users through setup processes

You have access to 40+ SEO tools through the DataForSEO MCP server. These tools use simplified filter schemas optimized for LLM usage, making them easy to use. The tools cover:
- AI Optimization (ChatGPT, Claude, Perplexity analysis)
- Keyword Research (search volume, suggestions, difficulty)
- SERP Analysis (Google rankings, SERP features)
- Competitor Analysis (domain overlap, competitor discovery)
- Domain Analysis (traffic, keywords, rankings, technologies)
- On-Page Analysis (content parsing, Lighthouse audits)
- Content Generation (optimized content creation)

For high-quality article or blog post requests, use the 'generate_researched_content' tool. This specialized tool handles the entire workflow:
1. Deep research on the topic
2. RAG-based optimization using best practices
3. Content writing with "human-like" quality
4. Automated QA loop with Winston AI (detection) and Rytr (improvement)
5. Continuous learning loop

You also have access to content quality and generation tools:
- Winston AI: Plagiarism detection, AI content detection, SEO validation
- Rytr AI: SEO content generation, meta titles/descriptions, content improvement
- Firecrawl: Web scraping and content extraction
- Perplexity: Citation-based research with authoritative sources
- OpenAI: Chat completions and embeddings

When generating or validating content:
1. Use Rytr to generate SEO-optimized content with proper tone and keywords
2. Use Winston AI to validate content for plagiarism and AI detection
3. Ensure all content is original, engaging, and SEO-compliant
4. Provide recommendations for improving content quality

Be conversational and helpful. Ask clarifying questions when needed. Keep responses concise but informative.`;

  let prompt = basePrompt;

  // Inject RAG frameworks if available
  if (ragFrameworks && ragFrameworks.length > 0) {
    prompt += "\n\n" + ragFrameworks;
  }

  if (context) {
    prompt += `\n\nCurrent Context: ${JSON.stringify(context)}`;
  }

  return prompt;
}

async function saveChatMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  messages: ChatMessage[],
  onboardingContext?: OnboardingContext,
) {
  try {
    const lastMessage = messages[messages.length - 1];
    const content =
      lastMessage.parts?.find((p) => p.type === "text")?.text ||
      lastMessage.content ||
      "";
    const chatMessage = {
      user_id: userId,
      role: lastMessage.role,
      content: content,
      metadata: onboardingContext ? { onboarding: onboardingContext } : {},
    };

    await supabase.from("chat_messages").insert(chatMessage);
  } catch (error) {
    console.error("Error saving chat messages:", error);
  }
}

async function saveOnboardingProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: OnboardingData,
) {
  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    const profileData: Record<string, unknown> = {
      user_id: userId,
      website_url: data.websiteUrl || null,
      industry: data.industry || null,
      goals: data.goals || null,
      locations: data.location ? [data.location] : null,
      content_frequency: data.contentFrequency || null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("business_profiles")
        .update(profileData)
        .eq("user_id", userId);
    } else {
      await supabase.from("business_profiles").insert(profileData);
    }
  } catch (error) {
    console.error("Error saving onboarding progress:", error);
  }
}
