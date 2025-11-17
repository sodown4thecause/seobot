import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  tool,
  stepCountIs,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
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
import { getWinstonTools } from "@/lib/mcp/winston-client";
import { getContentQualityTools } from "@/lib/ai/content-quality-tools";
import { getEnhancedContentQualityTools } from "@/lib/ai/content-quality-enhancements";
import { getAEOTools } from "@/lib/ai/aeo-tools";
import { getAEOPlatformTools } from "@/lib/ai/aeo-platform-tools";
import { scrapeWithJina } from "@/lib/external-apis/jina";
import { searchWithPerplexity } from "@/lib/external-apis/perplexity";
import {
  buildCodemodeToolRegistryFromExisting,
  createCodemodeTool,
} from "@/lib/ai/codemode";
import { rateLimitMiddleware } from "@/lib/redis/rate-limit";
import { createProfiler, timeAsync } from "@/lib/ai/profiler";
import {
  getCachedDataForSEOTools,
  getCachedFirecrawlTools,
  getCachedWinstonTools,
  prewarmToolCaches,
} from "@/lib/ai/tool-cache";
import { z } from "zod";

// Lazy prewarm flag - triggers prewarm on first request
let prewarmTriggered = false;
let prewarmPromise: Promise<void> | null = null;

// Changed from "edge" to "nodejs" to support codemode's dynamic code execution
// Edge Runtime doesn't allow new Function() or eval() for security reasons
export const runtime = "nodejs";

// Feature flag: when true, codemode becomes the primary interface for MCP/API tools
// and those tools will not be exposed directly to the agent. This makes it easy
// to roll back to the previous mixed mode if needed.
const USE_CODEMODE_PRIMARY = serverEnv.ENABLE_CODEMODE_PRIMARY === "true";

// Using OpenAI GPT-4o-mini for chat interface with tool calling support
// GPT-4o-mini offers excellent tool calling at lower cost than GPT-4o
const CHAT_MODEL_ID = "gpt-4o-mini";
const openai = createOpenAI({
  apiKey: serverEnv.OPENAI_API_KEY,
});

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
  messages: ChatMessage[];
  context?: ChatContext;
}

export async function POST(req: Request) {
  // Lazy prewarm on first request (non-blocking)
  if (!prewarmTriggered) {
    prewarmTriggered = true;
    // Start prewarm in background (don't await)
    prewarmPromise = prewarmToolCaches().catch((err) => {
      console.warn("[Chat API] Prewarm failed (non-critical):", err);
    });
  }

  // Initialize profiler
  const profiler = createProfiler();
  profiler.start("total");

  // Check rate limit
  profiler.start("rateLimit");
  const rateLimitResponse = await rateLimitMiddleware(req as any, "CHAT");
  profiler.end("rateLimit");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    profiler.start("parseRequest");
    const body = (await req.json()) as RequestBody;
    const { messages, context } = body;
    profiler.end("parseRequest");

    // Debug logging
    console.log("[Chat API] Received request:", {
      messageCount: messages?.length || 0,
      lastMessage: messages?.[messages.length - 1],
      hasContext: !!context,
    });

    profiler.start("auth");
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    profiler.end("auth");

    // Extract onboarding context if present
    const onboardingContext = context?.onboarding;
    const isOnboarding = context?.page === "onboarding";

    // Extract message content - handle both AI SDK v5 format (parts) and legacy format (content)
    const extractMessageContent = (msg: ChatMessage): string => {
      if (msg.parts && Array.isArray(msg.parts)) {
        // AI SDK v5 format
        const textPart = msg.parts.find((p) => p.type === "text");
        return textPart?.text || "";
      }
      return msg.content || "";
    };

    // Extract last user message
    const lastUserMessage = messages[messages.length - 1];
    const lastUserMessageContent = extractMessageContent(lastUserMessage);

    // Detect if user wants codemode (lazy loading optimization in legacy mode)
    const wantsCodemode =
      lastUserMessageContent.toLowerCase().includes("codemode") ||
      lastUserMessageContent.toLowerCase().includes("use code") ||
      lastUserMessageContent.toLowerCase().includes("execute code") ||
      lastUserMessageContent.toLowerCase().includes("chain multiple") ||
      lastUserMessageContent.toLowerCase().includes("orchestrate");

    // In primary mode, codemode is always available. In legacy mode, we only
    // load codemode when the user explicitly asks for it to avoid unnecessary
    // overhead on simple queries.
    const shouldUseCodemode = USE_CODEMODE_PRIMARY || wantsCodemode;

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
        profiler.start("rag");
        const frameworks = await findRelevantFrameworks(
          lastUserMessageContent,
          {
            maxResults: 3,
          },
        );

        if (frameworks.length > 0) {
          retrievedFrameworks = formatFrameworksForPrompt(frameworks);
          frameworkIds = frameworks.map((f) => f.id);
        }
        profiler.end("rag");
        console.log(
          `[Chat] RAG retrieved ${frameworks.length} frameworks in ${profiler.getDuration("rag")}ms`,
        );
      } catch (error) {
        profiler.end("rag");
        // Graceful degradation: continue without RAG if retrieval fails
        console.warn(
          "[Chat] RAG retrieval failed, continuing without frameworks:",
          error,
        );
      }
    }

    // Build system prompt based on context
    profiler.start("buildPrompt");
    let systemPrompt: string;
    if (isOnboarding && onboardingContext) {
      const currentStep = onboardingContext.currentStep || 1;
      const onboardingData = onboardingContext.data || {};
      systemPrompt = buildOnboardingSystemPrompt(
        currentStep as OnboardingStep,
        onboardingData as OnboardingData,
      );
    } else {
      systemPrompt = buildGeneralSystemPrompt(
        context,
        retrievedFrameworks,
        USE_CODEMODE_PRIMARY,
      );
    }
    profiler.end("buildPrompt");

    // Convert messages to AI SDK v5 format
    const systemMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];
    const conversationMessages: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];

    // Add system prompt
    systemMessages.push({ role: "system", content: systemPrompt });

    // Convert user messages
    messages.forEach((msg) => {
      const content = extractMessageContent(msg);
      if (content) {
        if (msg.role === "user") {
          conversationMessages.push({ role: "user", content });
        } else if (msg.role === "assistant") {
          conversationMessages.push({ role: "assistant", content });
        }
      }
    });

    // Load all tools in parallel using cached getters
    profiler.start("loadTools");

    // Helper function to create fallback SEO tools
    const createFallbackSEOTools = () => ({
      ai_keyword_search_volume: tool({
        description:
          "Get search volume for keywords in AI platforms like ChatGPT, Claude, Perplexity. Use for GEO (Generative Engine Optimization) analysis.",
        inputSchema: z.object({
          keywords: z
            .array(z.string())
            .describe("Keywords to analyze in AI platforms"),
          location: z
            .string()
            .optional()
            .describe('Location (e.g., "United States", "United Kingdom")'),
        }),
        execute: async (args: {
          keywords: string[];
          location?: string;
        }) => {
          return await handleDataForSEOFunctionCall(
            "ai_keyword_search_volume",
            args,
          );
        },
      }),
      keyword_search_volume: tool({
        description:
          "Get Google search volume, CPC, and competition for keywords. Core keyword research tool.",
        inputSchema: z.object({
          keywords: z
            .array(z.string())
            .describe("Keywords to analyze (max 100)"),
          location: z.string().optional().describe("Location for data"),
        }),
        execute: async (args: {
          keywords: string[];
          location?: string;
        }) => {
          return await handleDataForSEOFunctionCall(
            "keyword_search_volume",
            args,
          );
        },
      }),
      google_rankings: tool({
        description:
          "Get current Google SERP results for a keyword including position, URL, title, and SERP features.",
        inputSchema: z.object({
          keyword: z.string().describe("Keyword to check rankings for"),
          location: z
            .string()
            .optional()
            .describe("Location for SERP results"),
        }),
        execute: async (args: { keyword: string; location?: string }) => {
          return await handleDataForSEOFunctionCall(
            "google_rankings",
            args,
          );
        },
      }),
      domain_overview: tool({
        description:
          "Get comprehensive SEO metrics for a domain: traffic, keywords, rankings, visibility. This is an expensive operation that requires user approval.",
        inputSchema: z.object({
          domain: z
            .string()
            .describe("Domain to analyze (without http://)"),
          location: z.string().optional().describe("Location for metrics"),
        }),
        needsApproval: true,
        execute: async (args: { domain: string; location?: string }) => {
          return await handleDataForSEOFunctionCall(
            "domain_overview",
            args,
          );
        },
      }),
    });

    // Load MCP tools in parallel. Codemode will reuse these loaded tools so we
    // don't need a separate codemode registry load here.
    const toolLoadPromises: Promise<any>[] = [
      timeAsync("loadDataForSEOTools", () => getCachedDataForSEOTools(), profiler),
      timeAsync("loadFirecrawlTools", () => getCachedFirecrawlTools(), profiler),
      timeAsync("loadWinstonTools", () => getCachedWinstonTools(), profiler),
    ];

    const toolResults = await Promise.allSettled(toolLoadPromises);
    const [
      seoToolsResult,
      firecrawlToolsResult,
      winstonToolsResult,
    ] = toolResults;

    // Helper function to validate and filter tools with valid schemas
    const validateTool = (toolName: string, tool: any): boolean => {
      if (!tool || typeof tool !== 'object') {
        return false;
      }

      // Check if tool has required properties
      if (typeof tool.execute !== 'function') {
        return false;
      }

      // Validate inputSchema - must be a Zod schema object
      if (tool.inputSchema) {
        // Check if it's a Zod schema (has _def property or is a ZodObject)
        const isZodSchema =
          tool.inputSchema._def !== undefined ||
          tool.inputSchema.parse !== undefined ||
          typeof tool.inputSchema === 'function';

        if (!isZodSchema) {
          console.warn(`[Chat API] Tool ${toolName} has invalid inputSchema, skipping`);
          return false;
        }
      }

      return true;
    };

    // Process DataForSEO tools
    let seoTools: Record<string, any>;
    let mcpConnected = false;
    if (seoToolsResult.status === "fulfilled" && seoToolsResult.value && Object.keys(seoToolsResult.value).length > 0) {
      mcpConnected = true;
      const rawTools = seoToolsResult.value;

      // Filter out invalid tools
      const validTools: Record<string, any> = {};
      let invalidCount = 0;

      for (const [toolName, tool] of Object.entries(rawTools)) {
        if (validateTool(toolName, tool)) {
          validTools[toolName] = tool;
        } else {
          invalidCount++;
        }
      }

      seoTools = validTools;

      if (invalidCount > 0) {
        console.warn(`[Chat API] Filtered out ${invalidCount} invalid DataForSEO tools`);
      }

      console.log(
        `[Chat API] Successfully loaded ${Object.keys(seoTools).length} valid tools from MCP server`,
      );
      console.log(
        "[Chat API] Sample MCP tools:",
        Object.keys(seoTools).slice(0, 5),
      );

      // Use fallback if no valid tools
      if (Object.keys(seoTools).length === 0) {
        console.log("[Chat API] No valid tools from MCP server, using fallback");
        mcpConnected = false;
        seoTools = createFallbackSEOTools();
      }
    } else {
      console.log(
        "[Chat API] No tools returned from MCP server, using fallback",
      );
      mcpConnected = false;
      seoTools = createFallbackSEOTools();
      console.log(
        `[Chat API] Using fallback: ${Object.keys(seoTools).length} direct API tools`,
      );
    }

    // Process Firecrawl tools
    let firecrawlTools: Record<string, any> = {};
    if (firecrawlToolsResult.status === "fulfilled" && firecrawlToolsResult.value) {
      const rawTools = firecrawlToolsResult.value;
      const validTools: Record<string, any> = {};

      for (const [toolName, tool] of Object.entries(rawTools)) {
        if (validateTool(toolName, tool)) {
          validTools[toolName] = tool;
        }
      }

      firecrawlTools = validTools;
      console.log("[Chat API] Loaded Firecrawl MCP tools:", Object.keys(firecrawlTools).length);
    } else if (firecrawlToolsResult.status === "rejected") {
      console.warn("[Chat API] Failed to load Firecrawl MCP tools:", firecrawlToolsResult.reason);
    }

    // Process Winston tools
    let winstonMCPTools: Record<string, any> = {};
    if (winstonToolsResult.status === "fulfilled" && winstonToolsResult.value) {
      const rawTools = winstonToolsResult.value;
      const validTools: Record<string, any> = {};

      for (const [toolName, tool] of Object.entries(rawTools)) {
        if (validateTool(toolName, tool)) {
          validTools[toolName] = tool;
        }
      }

      winstonMCPTools = validTools;
      console.log("[Chat API] Loaded Winston MCP tools:", Object.keys(winstonMCPTools).length);
    } else if (winstonToolsResult.status === "rejected") {
      const reason = winstonToolsResult.reason;
      console.warn("[Chat API] ⚠️ Winston MCP unavailable (continuing without it):", reason instanceof Error ? reason.message : String(reason));
    }

    profiler.end("loadTools");

    // Add content quality tools (Winston AI + Rytr) - NOW ENABLED with AI SDK 6 compatible schemas
    const contentQualityTools = getContentQualityTools();
    console.log("[Chat API] Loaded content quality tools:", Object.keys(contentQualityTools).length);

    // Add enhanced content quality tools (SEO analysis, readability, fact-checking) - NOW ENABLED
    const enhancedContentTools = getEnhancedContentQualityTools();
    console.log("[Chat API] Loaded enhanced content tools:", Object.keys(enhancedContentTools).length);

    // Add AEO (Answer Engine Optimization) tools - NEW in Phase 2
    const aeoTools = getAEOTools();
    console.log("[Chat API] Loaded AEO tools:", Object.keys(aeoTools).length);

    // Add AEO platform-specific tools - NEW in Phase 2
    const aeoPlatformTools = getAEOPlatformTools();
    console.log("[Chat API] Loaded AEO platform tools:", Object.keys(aeoPlatformTools).length);

    // Add Jina and Perplexity tools
    const jinaPerplexityTools = {
      jina_scrape: tool({
        description: 'Scrape and extract clean markdown content from any URL. Use this to analyze competitor content or extract information from web pages.',
        inputSchema: z.object({
          url: z.string().describe('The URL to scrape'),
          timeout: z.number().optional().describe('Timeout in milliseconds (default: 30000)'),
        }),
        execute: async ({ url, timeout }) => {
          const result = await scrapeWithJina({ url, timeout });
          if (!result.success) {
            throw new Error(result.error || 'Failed to scrape URL');
          }
          return {
            title: result.title,
            content: result.markdown || result.content,
            metadata: result.metadata,
            summary: `✅ Scraped ${result.title || url} (${result.metadata?.wordCount || 0} words)`,
          };
        },
      }),
      perplexity_research: tool({
        description: 'Search for authoritative information with citations using Perplexity AI. Use this for fact-checking, research, and finding credible sources.',
        inputSchema: z.object({
          query: z.string().describe('The research query or question'),
          searchRecencyFilter: z.enum(['month', 'week', 'day', 'hour']).optional().describe('Filter by recency (default: month)'),
          returnCitations: z.boolean().optional().describe('Return citations (default: true)'),
        }),
        execute: async ({ query, searchRecencyFilter, returnCitations }) => {
          const result = await searchWithPerplexity({
            query,
            searchRecencyFilter,
            returnCitations: returnCitations !== false,
          });
          if (!result.success) {
            throw new Error(result.error || 'Perplexity search failed');
          }
          return {
            answer: result.answer,
            citations: result.citations,
            citationCount: result.citations.length,
            summary: `✅ Found ${result.citations.length} authoritative sources for "${query}"`,
          };
        },
      }),
    };

    // Build codemode tool (only when enabled for this request). We reuse the
    // already loaded MCP tools to avoid any extra network calls when building
    // the codemode registry.
    profiler.start("buildCodemodeTool");
    let codemodeTool: ReturnType<typeof createCodemodeTool> | null = null;
    if (shouldUseCodemode) {
      try {
        const codemodeRegistry = await buildCodemodeToolRegistryFromExisting({
          dataForSEOTools: seoTools,
          firecrawlTools,
          winstonTools: winstonMCPTools,
        });
        codemodeTool = createCodemodeTool(codemodeRegistry);
        console.log(
          "[Chat API] Codemode tool created with",
          Object.keys(codemodeRegistry).length,
          "tools in registry",
        );
      } catch (error) {
        console.warn("[Chat API] Failed to build codemode registry:", error);
      }
    } else {
      console.log("[Chat API] Codemode disabled for this request");
    }
    profiler.end("buildCodemodeTool");

    // In codemode-primary mode, we expose only a minimal set of direct tools
    // and route all MCP/API operations through the codemode tool. In legacy
    // mode, we keep exposing all tools directly for backwards compatibility.
    let allTools: Record<string, any>;
    if (USE_CODEMODE_PRIMARY) {
      const minimalDirectTools = {
        ...contentQualityTools,
        ...enhancedContentTools,
        ...aeoTools,
        ...aeoPlatformTools,
      };

      allTools = {
        ...minimalDirectTools,
        ...(codemodeTool ? { codemode: codemodeTool } : {}),
      };
    } else {
      allTools = {
        ...seoTools,
        ...firecrawlTools,
        ...winstonMCPTools,
        ...contentQualityTools,
        ...enhancedContentTools,
        ...aeoTools,
        ...aeoPlatformTools,
        ...jinaPerplexityTools,
        ...(codemodeTool ? { codemode: codemodeTool } : {}),
      };
    }

    // Debug logging
    console.log("[Chat API] Streaming with:", {
      conversationMessageCount: conversationMessages.length,
      systemPromptLength: systemPrompt.length,
      dataForSEOToolsCount: Object.keys(seoTools).length,
      firecrawlToolsCount: Object.keys(firecrawlTools).length,
      winstonMCPToolsCount: Object.keys(winstonMCPTools).length,
      contentQualityToolsCount: Object.keys(contentQualityTools).length,
      enhancedContentToolsCount: Object.keys(enhancedContentTools).length,
      aeoToolsCount: Object.keys(aeoTools).length,
      aeoPlatformToolsCount: Object.keys(aeoPlatformTools).length,
      jinaPerplexityToolsCount: Object.keys(jinaPerplexityTools).length,
      codemodeEnabled: codemodeTool !== null,
      codemodeMode: USE_CODEMODE_PRIMARY ? "codemode-primary" : "legacy-mixed",
      totalToolsCount: Object.keys(allTools).length,
      mcpConnected: mcpConnected,
      mcpUrl: serverEnv.DATAFORSEO_MCP_URL || "not set (using default)",
    });

    // Create ToolLoopAgent for automatic multi-step tool calling (AI SDK 6)
    const agent = new ToolLoopAgent({
      model: openai(CHAT_MODEL_ID),
      instructions: systemPrompt, // AI SDK 6 uses 'instructions' parameter for system prompt
      tools: allTools,
      // Stop after 5 steps OR when no tools are called (prevents runaway costs)
      // In AI SDK 6, stopWhen conditions are evaluated when the last step contains tool results
      stopWhen: [
        stepCountIs(5), // Stop after 5 steps max
        ({ steps }) => {
          // Stop if the last step had no tool calls
          const lastStep = steps[steps.length - 1];
          return lastStep?.toolCalls?.length === 0;
        },
      ],
      // Enable telemetry for monitoring
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chat-api",
          metadata: {
            environment: process.env.NODE_ENV || "development",
            runtime: "edge",
            model: CHAT_MODEL_ID,
            provider: "openai",
          },
      },
    });

    // Convert messages to UIMessage format expected by AI SDK 6
    const uiMessages = conversationMessages.map((m) => ({
      id:
        (globalThis as any).crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: m.role,
      parts: [{ type: "text" as const, text: m.content }],
    }));

    profiler.end("total");

    // Log performance timings
    profiler.logTimings("Chat API");

    console.log("[Chat API] Starting agent stream response...");
    console.log("[Chat API] Passing to agent:", {
      messageCount: uiMessages.length,
      lastMessage: uiMessages[uiMessages.length - 1]?.parts[0]?.text?.slice(
        0,
        100,
      ),
      toolCount: Object.keys(seoTools).length,
    });

    // Stream UI messages using the agent
    return createAgentUIStreamResponse({
      agent,
      messages: uiMessages,
      onFinish: async ({
        messages: finalMessages,
        responseMessage,
        isAborted,
      }) => {
        console.log("[Chat API] Agent finished:", {
          messageCount: finalMessages.length,
          isAborted,
          responseMessageId: responseMessage.id,
        });

        // Save messages after completion
        if (user && !authError) {
          await saveChatMessages(
            supabase,
            user.id,
            messages,
            isOnboarding ? onboardingContext : undefined,
          );
          if (isOnboarding && onboardingContext?.data && user.id) {
            await saveOnboardingProgress(
              supabase,
              user.id,
              onboardingContext.data,
            );
          }
        }

        // Track framework usage
        if (frameworkIds.length > 0) {
          batchIncrementUsage(frameworkIds).catch((err) =>
            console.warn("[Chat] Failed to track framework usage:", err),
          );
        }
      },
      onError: (error) => {
        const err = error as Error;
        console.error("[Chat API] Stream error:", {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
        });

        // Return user-friendly error message
        const errorMessage =
          "An error occurred while processing your request. Please try again.";
        return process.env.NODE_ENV === "development" && err?.message
          ? `${errorMessage} (${err.message})`
          : errorMessage;
      },
    });
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
  useCodemodePrimary: boolean = false,
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

You also have access to content quality and generation tools:
- Winston AI: Plagiarism detection, AI content detection, SEO validation
- Rytr AI: SEO content generation, meta titles/descriptions, content improvement
- Firecrawl: Web scraping and content extraction
- Perplexity: Citation-based research with authoritative sources
- OpenAI: Chat completions and embeddings

CODEMODE: You have access to a powerful codemode tool that allows you to write JavaScript code to orchestrate multiple tool calls, handle errors, and perform complex workflows. Use codemode when you need to:
- Chain multiple operations together
- Handle conditional logic based on tool results
- Implement retry logic or error handling
- Combine data from multiple sources
- Perform complex data transformations

When generating or validating content:
1. Use Rytr to generate SEO-optimized content with proper tone and keywords
2. Use Winston AI to validate content for plagiarism and AI detection
3. Ensure all content is original, engaging, and SEO-compliant
4. Provide recommendations for improving content quality

Be conversational and helpful. Ask clarifying questions when needed. Keep responses concise but informative.`;

  let prompt = basePrompt;

  if (useCodemodePrimary) {
    prompt += `\n\nIMPORTANT: Tool usage policy for this conversation (codemode-primary mode):\n- All MCP and external API tools (DataForSEO, Firecrawl, Winston, Perplexity, Jina, Rytr) must be accessed ONLY via the "codemode" tool.\n- Do NOT attempt to call these tools directly. Instead, always write JavaScript code and execute it via the codemode tool.\n- Use the codemode.<toolName>(...) namespace to call tools (for example, codemode.dataforseo_google_rankings(...) or codemode.perplexity_search(...)).\n- Prefer codemode whenever you need to chain multiple tool calls, perform conditional logic, or orchestrate complex SEO workflows.\n`;
  } else {
    // Legacy mixed mode: codemode is available but tools may also be called directly.
    // Codemode is still recommended for multi-step workflows and complex orchestration.
    prompt += `\n\nTool usage policy (legacy mixed mode):\n- You MAY call DataForSEO, Firecrawl, Winston, Perplexity, Jina, and Rytr tools directly when appropriate.\n- Prefer the codemode tool when you need to orchestrate multiple calls, add control flow, or reduce the number of tool steps.\n`;
  }

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
