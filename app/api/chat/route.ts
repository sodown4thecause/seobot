import {
  streamText,
  convertToCoreMessages,
  tool,
  CoreMessage,
  stepCountIs,
} from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildOnboardingSystemPrompt } from "@/lib/onboarding/prompts";
import {
  type OnboardingData,
  type OnboardingStep,
} from "@/lib/onboarding/state";
import { getDataForSEOTools } from "@/lib/mcp/dataforseo-client";
import { getFirecrawlTools } from "@/lib/mcp/firecrawl-client";
import { getJinaTools } from "@/lib/mcp/jina-client";
import { getWinstonTools } from "@/lib/mcp/winston-client";
import { loadEssentialTools } from "@/lib/ai/tool-schema-validator-v6";
import { fixAllMCPTools } from "@/lib/mcp/schema-fixer";
import { getContentQualityTools } from "@/lib/ai/content-quality-tools";
import { getEnhancedContentQualityTools } from "@/lib/ai/content-quality-enhancements";
import { searchWithPerplexity } from "@/lib/external-apis/perplexity";
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { AgentRouter } from "@/lib/agents/agent-router";
import { vercelGateway } from "@/lib/ai/gateway-provider";
import { rateLimitMiddleware } from "@/lib/redis/rate-limit";
import { z } from "zod";
import { researchAgentTool, competitorAgentTool, frameworkRagTool } from "@/lib/agents/tools";

export const runtime = "edge";

// Using Claude Haiku 4.5 via Vercel Gateway
const CHAT_MODEL_ID = "anthropic/claude-haiku-4.5";

interface ChatContext {
  page?: string;
  onboarding?: {
    currentStep?: number;
    data?: OnboardingData;
  };
  [key: string]: unknown;
}

interface RequestBody {
  messages: any[];
  context?: ChatContext;
}

export async function POST(req: Request) {
  console.log('[Chat API] POST handler called');
  
  // Log request details
  const contentType = req.headers.get('content-type');
  console.log('[Chat API] Content-Type:', contentType);

  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(req as any, "CHAT");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = (await req.json()) as RequestBody;
    console.log('[Chat API] Request body:', JSON.stringify({
      messagesCount: body.messages?.length,
      hasContext: !!body.context,
      firstMessage: body.messages?.[0],
    }));
    
    const { messages, context } = body;

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
    const lastUserMessageContent = typeof lastUserMessage.content === 'string'
      ? lastUserMessage.content
      : Array.isArray(lastUserMessage.content)
        ? lastUserMessage.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('')
        : '';

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
    }

    // LOAD MCP TOOLS based on selected agent
    console.log(`[Chat API] Loading MCP tools for ${routingResult.agent} agent`);

    const allMCPTools: Record<string, any> = {};

    // Load DataForSEO tools for SEO/AEO agent
    if (routingResult.agent === 'seo-aeo' || routingResult.agent === 'content') {
      try {
        const dataforSEOTools = await getDataForSEOTools();
        const fixedSEOTools = fixAllMCPTools(dataforSEOTools);
        Object.assign(allMCPTools, fixedSEOTools);
      } catch (error) {
        console.error('[Chat API] Failed to load DataForSEO tools:', error);
      }
    }

    // Load Firecrawl tools for SEO/AEO and Content agents
    if (routingResult.agent === 'seo-aeo' || routingResult.agent === 'content') {
      try {
        const firecrawlMCPTools = await getFirecrawlTools();
        const fixedFirecrawlTools = fixAllMCPTools(firecrawlMCPTools);
        Object.assign(allMCPTools, fixedFirecrawlTools);
      } catch (error) {
        console.error('[Chat API] Failed to load Firecrawl tools:', error);
      }
    }

    // Load Jina tools for Content agent
    if (routingResult.agent === 'content') {
      try {
        const jinaMCPTools = await getJinaTools();
        const fixedJinaTools = fixAllMCPTools(jinaMCPTools);
        Object.assign(allMCPTools, fixedJinaTools);
      } catch (error) {
        console.error('[Chat API] Failed to load Jina tools:', error);
      }
    }

    // Load Winston tools for Content agent (RAG feedback loop)
    if (routingResult.agent === 'content') {
      try {
        const winstonTools = await getWinstonTools();
        const fixedWinstonTools = fixAllMCPTools(winstonTools);
        Object.assign(allMCPTools, fixedWinstonTools);
      } catch (error) {
        console.error('[Chat API] Failed to load Winston tools:', error);
      }
    }

    // Add content quality tools (Winston AI + Rytr) - Load based on agent type
    let contentQualityTools: Record<string, any> = {};
    let enhancedContentTools: Record<string, any> = {};

    if (routingResult.agent === 'content') {
      contentQualityTools = getContentQualityTools();
      enhancedContentTools = getEnhancedContentQualityTools();
    }

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
        execute: async (args) => {
          try {
            console.log('[Orchestrator Tool] 🚀 Starting execution with args:', args);

            // Pass userId for learning storage
            const result = await orchestrator.generateContent({
              ...args,
              userId: user?.id,
              targetPlatforms: ["chatgpt", "perplexity", "claude"], // Default targets
            });

            console.log('[Orchestrator Tool] ✓ Orchestrator completed successfully');

            // Return simple content string for AI SDK 6 tool result handling
            const contentResult = result.content || "Content generation completed but no content was returned.";

            return contentResult;
          } catch (error) {
            console.error("[Chat API] Orchestrator error:", error);
            return "Failed to generate content. Please try again.";
          }
        },
      }),
    };

    // Define Client UI Tool
    const clientUiTool = tool({
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
      execute: async ({ component }) => {
        return { displayed: true, component };
      },
    });

    // Construct Final Tool Set
    const allTools = {
      // Core Tools (Always available)
      ...orchestratorTool,
      client_ui: clientUiTool,
      
      // Best Practice: Specialized Agents as Tools
      research_agent: researchAgentTool,
      competitor_analysis: competitorAgentTool,
      consult_frameworks: frameworkRagTool,
      
      // Kept for backward compatibility/Router specific requests (can be refactored to use research_agent)
      // Perplexity specific tool for direct queries if requested by agent
      perplexity_search: tool({
          description: "Search the web using Perplexity AI via Vercel AI Gateway. Use this for specific research queries.",
          inputSchema: z.object({
            query: z.string().describe("The search query"),
          }),
          execute: async ({ query }) => {
            return await searchWithPerplexity({ query });
          },
      }),
      // Web search for competitors (legacy alias for AgentRouter compatibility)
      web_search_competitors: competitorAgentTool,

      // Agent Specific Tools
      ...(routingResult.agent === 'content' ? { ...contentQualityTools, ...enhancedContentTools } : {}),

      // MCP Tools (Filtered by loadEssentialTools)
      ...loadEssentialTools(allMCPTools),
    };

    // Filter out any undefined tools and ensure valid schema
    const validatedTools = Object.fromEntries(
      Object.entries(allTools).filter(([_, v]) => v !== undefined)
    );

    // Log final validated tools that will be used
    console.log('[Chat API] ✓ Final validated tools for streamText:', {
      count: Object.keys(validatedTools).length,
      tools: Object.keys(validatedTools)
    });

    // Debug incoming messages
    console.log('[Chat API] Incoming messages:', JSON.stringify(messages, null, 2));

    // Sanitize messages to ensure content is never undefined
    const sanitizedMessages = messages.map((msg: any) => ({
      ...msg,
      content: msg.content || '', // Ensure content is at least an empty string
      // If tool invocations exist, ensure they are preserved or handled
      toolInvocations: msg.toolInvocations || undefined,
    }));

    // Convert messages to CoreMessage format for AI SDK 6
    let coreMessages;
    try {
      coreMessages = convertToCoreMessages(sanitizedMessages);
    } catch (err) {
      console.error('[Chat API] convertToCoreMessages failed:', err);
      // Fallback to manual conversion if built-in fails
      coreMessages = sanitizedMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })) as CoreMessage[];
    }

    // Use AI SDK 6 with stopWhen conditions for tool loop control
    const resultOrPromise = streamText({
      model: vercelGateway.languageModel(CHAT_MODEL_ID),
      messages: coreMessages,
      system: systemPrompt,
      tools: validatedTools,
      toolChoice: 'auto',
      // AI SDK 6: Use stopWhen instead of maxSteps
      stopWhen: [
        stepCountIs(10), // Maximum 10 steps to prevent runaway costs
        ({ steps }) => steps.length > 0 && steps[steps.length - 1].toolCalls.length === 0, // Stop when no tools are called in the last step
      ],
      onError: (error) => {
        console.error('[Chat API] Streaming error:', error);
      },
      onFinish: async ({ response }) => {
        const { messages: finalMessages } = response;

        // Save messages after completion
        if (user && !authError) {
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
            }
          } catch (error) {
            console.error("Error saving chat messages:", error);
          }
        }
      },
    });

    // Handle potential Promise return (in case of version mismatch or async behavior)
    let result = resultOrPromise;
    if (resultOrPromise && typeof (resultOrPromise as any).then === 'function') {
      console.log('[Chat API] streamText returned a Promise. Awaiting...');
      result = await resultOrPromise;
    }

    console.log('[Chat API] streamText result keys:', Object.keys(result));

    // AI SDK v6: Use toUIMessageStreamResponse for proper chat transport compatibility
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