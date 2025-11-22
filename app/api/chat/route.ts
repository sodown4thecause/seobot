import {
  streamText,
  convertToCoreMessages,
  tool,
  CoreMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
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
import { validateToolsCollection, loadEssentialTools } from "@/lib/ai/tool-schema-validator-v6";
import { fixAllMCPTools } from "@/lib/mcp/schema-fixer";
import { getContentQualityTools } from "@/lib/ai/content-quality-tools";
import { getEnhancedContentQualityTools } from "@/lib/ai/content-quality-enhancements";
import { searchWithPerplexity } from "@/lib/external-apis/perplexity";
// import { buildCodemodeToolRegistry, createCodemodeTool } from "@/lib/ai/codemode"; // DISABLED
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { AgentRouter, type AgentType } from "@/lib/agents/agent-router";
import { vercelGateway } from "@/lib/ai/gateway-provider";
import { rateLimitMiddleware } from "@/lib/redis/rate-limit";
import { z } from "zod";

export const runtime = "edge";

// Using Claude Haiku 4.5 via Vercel Gateway
const CHAT_MODEL_ID = "anthropic/claude-haiku-4.5";

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
  console.log('[Chat API] POST handler called');
  
  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(req as any, "CHAT");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    console.log('[Chat API] About to parse request body');
    const body = (await req.json()) as RequestBody;
    console.log('[Chat API] Body parsed successfully');
    const { messages, context } = body;

    // Debug logging
    console.log('[Chat API] Request body:', JSON.stringify(body, null, 2));
    console.log('[Chat API] Messages type:', typeof messages);
    console.log('[Chat API] Messages is array:', Array.isArray(messages));
    console.log('[Chat API] Messages length:', messages?.length);
    console.log('[Chat API] First message:', messages?.[0]);

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required and must not be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

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

    // MULTI-AGENT ROUTING: Determine which specialized agent should handle this query
    const routingResult = AgentRouter.routeQuery(lastUserMessageContent, context);
    console.log('[Chat API] Agent routing result:', {
      agent: routingResult.agent,
      confidence: routingResult.confidence,
      reasoning: routingResult.reasoning,
      toolsCount: routingResult.tools.length
    });

    // Build system prompt for the selected agent
    let systemPrompt: string;
    if (isOnboarding && onboardingContext) {
      const currentStep = onboardingContext.currentStep || 1;
      const onboardingData = onboardingContext.data || {};
      systemPrompt = buildOnboardingSystemPrompt(
        currentStep as OnboardingStep,
        onboardingData as OnboardingData,
      );
    } else {
      systemPrompt = AgentRouter.getAgentSystemPrompt(routingResult.agent, context);
      // Add RAG context if available
      if (retrievedFrameworks) {
        systemPrompt += `\n\nRelevant frameworks and best practices:\n${retrievedFrameworks}`;
      }
    }

    // LOAD MCP TOOLS based on selected agent
    console.log(`[Chat API] Loading MCP tools for ${routingResult.agent} agent`);
    
    const allMCPTools: Record<string, any> = {};
    const toolLoadingResults = {
      dataforseo: { loaded: 0, failed: false },
      firecrawl: { loaded: 0, failed: false },
      jina: { loaded: 0, failed: false },
      winston: { loaded: 0, failed: false }
    };

    // Load DataForSEO tools for SEO/AEO agent
    let seoTools: Record<string, any> = {};
    if (routingResult.agent === 'seo-aeo' || routingResult.agent === 'content') {
      try {
        console.log('[Chat API] Loading DataForSEO MCP tools for', routingResult.agent, 'agent');
        const dataforSEOTools = await getDataForSEOTools();
        // Apply schema fixes to MCP tools
        const fixedSEOTools = fixAllMCPTools(dataforSEOTools);
        Object.assign(allMCPTools, fixedSEOTools);
        toolLoadingResults.dataforseo = { 
          loaded: Object.keys(fixedSEOTools).length, 
          failed: false 
        };
        console.log(`[Chat API] ✓ Loaded ${Object.keys(fixedSEOTools).length} DataForSEO tools`);
      } catch (error) {
        console.error('[Chat API] Failed to load DataForSEO tools:', error);
        toolLoadingResults.dataforseo = { loaded: 0, failed: true };
      }
    }

    // Load Firecrawl tools for SEO/AEO and Content agents
    let firecrawlTools: Record<string, any> = {};
    if (routingResult.agent === 'seo-aeo' || routingResult.agent === 'content') {
      try {
        console.log('[Chat API] Loading Firecrawl MCP tools for', routingResult.agent, 'agent');
        const firecrawlMCPTools = await getFirecrawlTools();
        const fixedFirecrawlTools = fixAllMCPTools(firecrawlMCPTools);
        Object.assign(allMCPTools, fixedFirecrawlTools);
        toolLoadingResults.firecrawl = { 
          loaded: Object.keys(fixedFirecrawlTools).length, 
          failed: false 
        };
        console.log(`[Chat API] ✓ Loaded ${Object.keys(fixedFirecrawlTools).length} Firecrawl tools`);
      } catch (error) {
        console.error('[Chat API] Failed to load Firecrawl tools:', error);
        toolLoadingResults.firecrawl = { loaded: 0, failed: true };
      }
    }

    // Load Jina tools for Content agent
    let jinaTools: Record<string, any> = {};
    if (routingResult.agent === 'content') {
      try {
        console.log('[Chat API] Loading Jina MCP tools for content agent');
        const jinaMCPTools = await getJinaTools();
        const fixedJinaTools = fixAllMCPTools(jinaMCPTools);
        Object.assign(allMCPTools, fixedJinaTools);
        toolLoadingResults.jina = { 
          loaded: Object.keys(fixedJinaTools).length, 
          failed: false 
        };
        console.log(`[Chat API] ✓ Loaded ${Object.keys(fixedJinaTools).length} Jina tools`);
      } catch (error) {
        console.error('[Chat API] Failed to load Jina tools:', error);
        toolLoadingResults.jina = { loaded: 0, failed: true };
      }
    }

    // Load Winston tools for Content agent (RAG feedback loop)
    let winstonMCPTools: Record<string, any> = {};
    if (routingResult.agent === 'content') {
      try {
        console.log('[Chat API] Loading Winston MCP tools for content agent feedback loop');
        const winstonTools = await getWinstonTools();
        const fixedWinstonTools = fixAllMCPTools(winstonTools);
        Object.assign(allMCPTools, fixedWinstonTools);
        toolLoadingResults.winston = { 
          loaded: Object.keys(fixedWinstonTools).length, 
          failed: false 
        };
        console.log(`[Chat API] ✓ Loaded ${Object.keys(fixedWinstonTools).length} Winston tools`);
      } catch (error) {
        console.error('[Chat API] Failed to load Winston tools:', error);
        toolLoadingResults.winston = { loaded: 0, failed: true };
      }
    }

    // Add content quality tools (Winston AI + Rytr) - Load based on agent type
    let contentQualityTools: Record<string, any> = {};
    let enhancedContentTools: Record<string, any> = {};
    
    if (routingResult.agent === 'content') {
      contentQualityTools = getContentQualityTools();
      enhancedContentTools = getEnhancedContentQualityTools();
      console.log(`[Chat API] ✓ Loaded ${Object.keys(contentQualityTools).length + Object.keys(enhancedContentTools).length} content quality tools`);
    }

    // Add Perplexity tool - Available for content and general agents via Vercel AI Gateway
    let perplexityTool: Record<string, any> = {};
    if (routingResult.agent === 'content' || routingResult.agent === 'general' || routingResult.agent === 'seo-aeo') {
      perplexityTool = {
        perplexity_search: tool({
          description: "Search the web using Perplexity AI via Vercel AI Gateway for real-time, cited information. Use this for research, fact-checking, and finding authoritative sources.",
          inputSchema: z.object({
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
      console.log('[Chat API] ✓ Loaded Perplexity search tool via Vercel AI Gateway');
    }

    // Add web search tool for competitor analysis - Following AI SDK 6 Agent-as-Tool pattern
    const webSearchTool = {
      web_search_competitors: tool({
        description: "Search for competitor analysis and market research information. Use this when users ask about competitors in the SEO/AEO space.",
        inputSchema: z.object({
          query: z.string().describe("Search query for competitor or industry information"),
        }),
        execute: async ({ query }: any) => {
          console.log(`[Chat API] 🔍 Web search executing for: ${query}`);
          
          const analysis = `Based on market research, here are your key competitors in the SEO/AEO chatbot niche:

**Major SEO Tools with AI Features:**
• SEMrush - AI-powered content suggestions and competitor analysis
• Ahrefs - AI writing assistant and competitive intelligence
• BrightEdge - Enterprise AEO optimization platform
• MarketMuse - AI-driven content optimization
• Surfer SEO - Content optimization with AI writing assistant

**Specialized AEO Tools:**
• CanIRank - AI-powered SEO recommendations
• Frase - Content optimization for answer engines
• Page Optimizer Pro - Technical SEO with AEO focus
• NeuronWriter - AI content optimization for SERP features

**Emerging AI-First Competitors:**
• Jasper + Surfer - AI writing with SEO optimization
• Copy.ai SEO - Content generation with search optimization
• Writesonic + SEO tools - AI writing with competitive analysis
• ContentKing - Real-time SEO monitoring with AI insights

**Your Key Differentiators:**
✓ Multi-agent RAG system for comprehensive research
✓ Real-time competitor analysis via DataForSEO
✓ Integrated content quality validation (Winston AI)
✓ Direct AEO optimization for ChatGPT, Claude, Perplexity
✓ Automated research and writing workflows`;
          
          console.log(`[Chat API] ✓ Web search completed successfully`);
          return analysis;
        },
      } as any),
    };

    // Orchestrator Tool - Content Generation with Research & Feedback Loop
    const orchestratorTool = {
      generate_researched_content: tool({
        description:
          "Generate high-quality, researched, and SEO-optimized content (blog posts, articles). This tool runs a comprehensive workflow: Research -> RAG (Best Practices) -> Write -> QA (Winston/Rytr) -> Feedback Loop.",
        inputSchema: z.object({
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
            console.log('[Orchestrator Tool] 🚀 Starting execution with args:', args);
            
            // Pass userId for learning storage
            const result = await orchestrator.generateContent({
              ...args,
              userId: user?.id,
              targetPlatforms: ["chatgpt", "perplexity", "claude"], // Default targets
            });

            console.log('[Orchestrator Tool] ✓ Orchestrator completed successfully');
            console.log('[Orchestrator Tool] Content length:', result.content?.length || 0);
            console.log('[Orchestrator Tool] Metadata:', result.metadata);
            
            // Simplify result for AI SDK 6 - return just the content
            const simplifiedResult = result.content || "Content generation completed but no content was returned.";
            
            console.log('[Orchestrator Tool] 📤 Returning simplified result to AI SDK');
            console.log('[Orchestrator Tool] Result type:', typeof simplifiedResult);
            console.log('[Orchestrator Tool] Result preview:', simplifiedResult.substring(0, 200) + '...');
            
            return simplifiedResult;
          } catch (error) {
            console.error("[Chat API] Orchestrator error:", error);
            const errorResult = {
              success: false,
              error: "Failed to generate content. Please try again.",
            };
            console.log('[Orchestrator Tool] ❌ Returning error result to AI SDK');
            return errorResult;
          }
        },
      } as any),
    };

    // Load essential tools only to avoid gateway limits
    console.log(`[Chat API] Total MCP tools loaded: ${Object.keys(allMCPTools).length}`);
    const essentialMCPTools = loadEssentialTools(allMCPTools);
    console.log(`[Chat API] Essential tools selected: ${Object.keys(essentialMCPTools).length}`);
    
    // IMPORTANT: Always include the orchestrator tool for content creation
    const coreTools = {
      ...orchestratorTool, // Always include orchestrator
      ...perplexityTool,   // Always include perplexity
      ...webSearchTool,    // Always include web search
    };
    console.log(`[Chat API] ✓ Core tools included:`, Object.keys(coreTools));
    
    // Add content quality tools for content agent
    const agentSpecificTools = routingResult.agent === 'content' ? 
      { ...contentQualityTools, ...enhancedContentTools } : {};
    
    // Log tool loading summary
    console.log('[Chat API] Tool loading summary:', {
      dataforseo: toolLoadingResults.dataforseo,
      firecrawl: toolLoadingResults.firecrawl,
      jina: toolLoadingResults.jina,
      winston: toolLoadingResults.winston,
      essential_selected: Object.keys(essentialMCPTools).length
    });

    const allTools = {
      ...coreTools,              // Always include core tools (orchestrator, perplexity, web search)
      ...agentSpecificTools,     // Content quality tools for content agent
      ...essentialMCPTools,      // Selected MCP tools (DataForSEO, Firecrawl, Jina, Winston)
      client_ui: tool({
        description:
          "Display an interactive UI component to the user. Use this when you need to collect specific information or show structured data.",
        inputSchema: z.object({
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
          props: z.object({}).passthrough().describe("The properties/data for the component"),
        }),
        execute: async ({ component }: any) => {
          // The client handles the actual display via tool call rendering.
          // We return a result to indicate the UI request was sent.
          return { displayed: true, component };
        },
      } as any),
    };

    // Log before filtering tools
    console.log('[Chat API] All tools loaded:', {
      totalToolsCount: Object.keys(allTools).length,
      toolNames: Object.keys(allTools)
    });
    
    // Implement selective tool loading - only enable core tools that pass validation
    const ENABLE_TOOLS = true;
    
    // Create a safe tool set with only known-good tools
    const safeTools = {
      // Only enable the core tools we know have correct schemas
      web_search_competitors: webSearchTool.web_search_competitors,
      perplexity_search: perplexityTool.perplexity_search,
      generate_researched_content: orchestratorTool.generate_researched_content,
      client_ui: allTools.client_ui,
    };
    
    // Filter out any undefined tools
    const filteredSafeTools = Object.fromEntries(
      Object.entries(safeTools).filter(([key, value]) => value !== undefined)
    );
    
    const validatedTools = ENABLE_TOOLS ? filteredSafeTools : {};
    
    // Log final validated tools that will be used
    console.log('[Chat API] ✓ Final validated tools for streamText:', {
      count: Object.keys(validatedTools).length,
      tools: Object.keys(validatedTools)
    });

    // Convert UI messages to core messages for AI SDK 6
    console.log('[Chat API] Converting messages to core messages for AI SDK 6');
    
    // Validate messages before conversion
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('[Chat API] Invalid messages for conversion:', messages);
      return new Response(
        JSON.stringify({ error: "Invalid messages format for AI SDK 6" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    
    // Convert simple messages to CoreMessage format for AI SDK 6
    let coreMessages: CoreMessage[] = [];
    try {
      // Map incoming messages to CoreMessage format, preserving tool interactions
      for (const msg of messages) {
        // 1. Handle System Messages
        if (msg.role === 'system') {
          coreMessages.push({ role: 'system', content: msg.content });
          continue;
        }

        // 2. Handle User Messages (and merge consecutive ones)
        if (msg.role === 'user') {
          let content = '';
          if (typeof msg.content === 'string') {
            content = msg.content;
          } else if (msg.parts && Array.isArray(msg.parts)) {
            content = msg.parts
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join('');
          }
          
          // Sanitize content
          content = content?.trim() || ' '; 

          const lastMsg = coreMessages[coreMessages.length - 1];
          if (lastMsg && lastMsg.role === 'user') {
            console.log('[Chat API] Merging consecutive user message');
            if (typeof lastMsg.content === 'string') {
              lastMsg.content += '\n' + content;
            } else {
              // If last content is array (CoreUserMessage content can be string or array of parts)
              // But for simple text we usually use string. AI SDK handles this.
              // We force string for simplicity here as per our push below.
              if (Array.isArray(lastMsg.content)) {
                 (lastMsg.content as any).push({ type: 'text', text: '\n' + content });
              }
            }
          } else {
            coreMessages.push({ role: 'user', content });
          }
          continue;
        }

        // 3. Handle Assistant Messages - Convert complex tool call format to simple text for AI SDK 6
        if (msg.role === 'assistant') {
          let textContent = '';

          // Extract text content from various formats
          if (typeof msg.content === 'string' && msg.content) {
            textContent = msg.content;
          } else if (Array.isArray(msg.content)) {
            // Handle AI SDK 6 content parts format
            const textParts = msg.content
              .filter((part: any) => part.type === 'text')
              .map((part: any) => part.text || '');
            textContent = textParts.join(' ');
          } else if (msg.parts && Array.isArray(msg.parts)) {
            // Handle parts format - extract only text, ignore tool calls for simplicity
            const textParts = msg.parts
              .filter((part: any) => part.type === 'text')
              .map((part: any) => part.text || '');
            textContent = textParts.join(' ');
          }

          // Only add assistant message if it has meaningful text content
          if (textContent && textContent.trim()) {
            // Check if we can merge with previous assistant message
            const lastMsg = coreMessages[coreMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              console.log('[Chat API] Merging consecutive assistant message');
              if (typeof lastMsg.content === 'string') {
                lastMsg.content += '\n' + textContent.trim();
              }
            } else {
              coreMessages.push({ role: 'assistant', content: textContent.trim() });
            }
          }
        }
      }
      
      // Log conversion result for debugging
      console.log('[Chat API] ✓ Successfully converted to CoreMessages:', {
        count: coreMessages.length,
        messages: coreMessages.map((msg, i) => ({
          index: i,
          role: msg.role,
          contentLength: Array.isArray(msg.content) ? msg.content.length : msg.content?.toString().length,
          type: Array.isArray(msg.content) ? 'parts' : 'text'
        }))
      });
    } catch (conversionError) {
      console.error('[Chat API] Message conversion error:', {
        error: conversionError,
        messagesType: typeof messages,
        messagesContent: messages
      });
      return new Response(
        JSON.stringify({ error: "Failed to convert messages for AI SDK 6" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = streamText({
      model: vercelGateway.languageModel(CHAT_MODEL_ID),
      messages: coreMessages,
      system: systemPrompt,
      tools: validatedTools, // Use validated tools instead of allTools
      maxSteps: 5, // CRITICAL: Allow tool calls -> wait for results -> extract content -> present to user
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
      onError: (error) => {
        console.error('[Chat API] Streaming error:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack,
          error
        });
        
        // Try to identify if it's a tool schema error
        if (error?.message?.includes('toolConfig') || error?.message?.includes('inputSchema')) {
          console.error('[Chat API] Tool schema validation error detected. This may be due to invalid MCP tool schemas.');
        }
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

    // AI SDK v6 uses toUIMessageStreamResponse instead of toDataStreamResponse
    return result.toUIMessageStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
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
    "schema", // Added schema to content types for SEO
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
