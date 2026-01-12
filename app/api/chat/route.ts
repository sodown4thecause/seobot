import {
  streamText,
  convertToCoreMessages,
  tool,
  CoreMessage,
  stepCountIs,
  createIdGenerator,
  type UIMessage,
} from "ai";
import { after } from "next/server";
import { trace } from "@opentelemetry/api";
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { serverEnv } from "@/lib/config/env";
import { getCurrentUser } from "@/lib/auth/clerk";
import { buildOnboardingSystemPrompt } from "@/lib/onboarding/prompts";
import {
  type OnboardingData,
  type OnboardingStep,
} from "@/lib/onboarding/state";
import { getDataForSEOTools } from "@/lib/mcp/dataforseo-client";
import { getFirecrawlTools } from "@/lib/mcp/firecrawl-client";
import { getJinaTools } from "@/lib/mcp/jina-client";
import { getWinstonTools } from "@/lib/mcp/winston-client";
import { loadToolsForAgent } from "@/lib/ai/tool-schema-validator-v6";
import { fixAllMCPTools } from "@/lib/mcp/schema-fixer";
import { getContentQualityTools } from "@/lib/ai/content-quality-tools";
import { getEnhancedContentQualityTools } from "@/lib/ai/content-quality-enhancements";
import { searchWithPerplexity } from "@/lib/external-apis/perplexity";
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { RAGWriterOrchestrator } from "@/lib/agents/rag-writer-orchestrator";
import { AgentRouter } from "@/lib/agents/agent-router";
import { vercelGateway } from "@/lib/ai/gateway-provider";
import { generateImageWithGatewayGemini } from "@/lib/ai/image-generation";
import { rateLimitMiddleware } from "@/lib/redis/rate-limit";
import { z } from "zod";
import { researchAgentTool, competitorAgentTool, frameworkRagTool } from "@/lib/agents/tools";
import { handleApiError } from "@/lib/errors/handlers";
import { createTelemetryConfig } from "@/lib/observability/langfuse";
// TODO: Re-enable credit limit checking once limit-check is implemented
// import { checkCreditLimit } from "@/lib/usage/limit-check";
import { BETA_LIMITS } from "@/lib/config/beta-limits";
import { NextRequest } from "next/server";
import {
  ensureConversationForUser,
  loadConversationMessages,
  normalizeUIMessage,
  saveConversationMessage,
  type GenericUIMessage,
} from "@/lib/chat/storage";

export const maxDuration = 300; // 5 minutes

// Using DeepSeek V3.2 Thinking - advanced reasoning model for chat
const CHAT_MODEL_ID = "deepseek/deepseek-reasoner";

interface ChatContext {
  page?: string;
  onboarding?: {
    currentStep?: number;
    data?: OnboardingData;
  };
  agentId?: string;
  agentType?: string;
  conversationId?: string;
  [key: string]: unknown;
}

interface RequestBody {
  messages?: UIMessage[]; // UIMessage[] from @ai-sdk/react useChat
  chatId?: string;
  conversationId?: string;
  agentId?: string;
  context?: ChatContext;
}

const handler = async (req: Request) => {
  console.log('[Chat API] POST handler called');

  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(req as any, "CHAT");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Log request details
  const contentType = req.headers.get('content-type');
  console.log('[Chat API] Content-Type:', contentType);

  try {
    const body = (await req.json()) as RequestBody;
    console.log('[Chat API] Request body:', JSON.stringify({
      messagesCount: body.messages?.length,
      hasContext: !!body.context,
      chatId: body.chatId,
    }));

    const { messages: incomingMessages, chatId, context } = body;
    const agentId = context?.agentId || 'general';

    // Extract onboarding context for system prompt building
    const onboardingContext = context?.onboarding;
    const isOnboarding = context?.page === 'onboarding' || !!onboardingContext;

    // Get current user from Clerk (for rate limiting and conversation management)
    const user = await getCurrentUser();

    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(
      req as unknown as import('next/server').NextRequest,
      'CHAT',
      user?.id
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check credit limit for authenticated users
    // TODO: Re-enable credit limit checking once limit-check is implemented
    // if (user?.id) {
    //   const limitCheck = await checkCreditLimit(user.id, req as unknown as NextRequest);
    //   if (!limitCheck.allowed) {
    //     return new Response(
    //       JSON.stringify({
    //         error: limitCheck.reason || BETA_LIMITS.UPGRADE_MESSAGE,
    //         code: 'CREDIT_LIMIT_EXCEEDED',
    //         isPaused: limitCheck.isPaused,
    //         pauseUntil: limitCheck.pauseUntil?.toISOString(),
    //       }),
    //       {
    //         status: 403,
    //         headers: { 'Content-Type': 'application/json' },
    //       }
    //     );
    //   }
    // }

    const requestedConversationId = chatId || context?.conversationId;
    const resolvedAgentType = agentId || context?.agentType || 'general';

    let conversationRecord: Awaited<ReturnType<typeof ensureConversationForUser>> | null = null;

    // If user is authenticated, ensure we have a conversation (create if needed)
    if (user) {
      try {
        conversationRecord = await ensureConversationForUser(
          user.id,
          resolvedAgentType // Use agent type as conversation title for now
        );
      } catch (error) {
        console.error('[Chat API] Conversation lookup/creation failed:', error);
        // Don't fail the request - allow it to proceed without conversation persistence
        // The conversation will be created on the next message if needed
      }
    }

    // Validate incoming messages - should be Message[] from useChat
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required and must not be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // TODO: Re-enable message normalization and storage once chat storage is migrated to Drizzle
    // The storage functions have incompatible signatures with the current AI SDK 6 types
    // const normalizedMessages = incomingMessages.map(msg => normalizeUIMessage(msg as any));
    // const lastUserMessage = normalizedMessages[normalizedMessages.length - 1];
    // if (lastUserMessage?.role === 'user' && conversationRecord) {
    //   await saveConversationMessage(conversationRecord.id, user?.id || '', 'user', lastUserMessage.content || '');
    // }

    // Ensure we always have a conversation ID for authenticated users
    let activeConversationId = conversationRecord?.id ?? requestedConversationId;

    // TODO: Re-enable conversation creation once chat storage is migrated
    // if (!activeConversationId && user) {
    //   try {
    //     const newConv = await ensureConversationForUser(user.id, resolvedAgentType);
    //     activeConversationId = newConv.id;
    //     conversationRecord = newConv;
    //   } catch (e) {
    //     console.error('[Chat API] Failed to create conversation:', e);
    //   }
    // }

    // Extract last user message content for intent detection
    // AI SDK 6 uses 'parts' array instead of 'content' string
    const lastMsg = incomingMessages[incomingMessages.length - 1] as any;
    const lastUserMessageContent = lastMsg?.content 
      ? String(lastMsg.content)
      : (Array.isArray(lastMsg?.parts) 
          ? lastMsg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') 
          : '');

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
      toolsCount: routingResult.tools.length,
      toolsSample: routingResult.tools.slice(0, 10) // Log first 10 tools
    });

    // Update Langfuse trace with conversation context and user input
    // (After routingResult is defined so we can include agentType in metadata)
    updateActiveObservation({
      input: lastUserMessageContent,
    });

    updateActiveTrace({
      name: "chat-message",
      sessionId: activeConversationId || undefined, // Groups related messages together
      userId: user?.id || undefined, // Track which user made the request
      input: lastUserMessageContent,
      metadata: {
        agentType: routingResult.agent,
        page: context?.page,
        isOnboarding: !!isOnboarding,
        onboardingStep: onboardingContext?.currentStep,
        workflowId: workflowId || undefined,
      },
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

    // Orchestrator Tool - Content Generation with RAG + EEAT Feedback Loop
    const orchestratorTool = {
      generate_researched_content: tool({
        description:
          "Generate high-quality, researched, and SEO-optimized content (blog posts, articles). This tool runs a comprehensive workflow: Research (Perplexity + RAG) -> Write -> DataForSEO Scoring -> EEAT QA Review -> Revision Feedback Loop.",
        inputSchema: z.object({
          topic: z.string().describe("The main topic of the content"),
          type: z
            .enum(["blog_post", "article", "social_media", "landing_page"])
            .describe("Type of content to generate"),
          keywords: z.array(z.string()).describe("Target keywords"),
          tone: z.string().optional().describe("Desired tone (e.g., professional, casual)"),
          wordCount: z.number().optional().describe("Target word count"),
          competitorUrls: z.array(z.string()).optional().describe("Optional competitor URLs for comparison"),
        }),
        execute: async (args) => {
          try {
            console.log('[RAG Writer Orchestrator Tool] 🚀 Starting execution with args:', args);

            // Check credit limit before expensive operation
            if (!user?.id) {
              return '❌ Authentication required. Please sign in to use this feature.';
            }

            // TODO: Re-enable credit limit checking once limit-check is implemented
            // const limitCheck = await checkCreditLimit(user.id, req as unknown as NextRequest);
            // if (!limitCheck.allowed) {
            //   return `❌ Credit limit exceeded. ${limitCheck.reason || `You've used $${limitCheck.currentSpendUsd.toFixed(2)} of your $${limitCheck.limitUsd.toFixed(2)} monthly limit.`} Please contact support or wait until ${limitCheck.resetDate?.toLocaleDateString() || 'next month'} for your credits to reset.`;
            // }

            // Use new RAG + EEAT feedback loop orchestrator
            const orchestrator = new RAGWriterOrchestrator();
            const result = await orchestrator.generateContent({
              ...args,
              userId: user?.id,
            });

            console.log('[RAG Writer Orchestrator Tool] ✓ Orchestrator completed successfully');
            console.log(`[RAG Writer Orchestrator Tool] Quality Scores - Overall: ${result.qualityScores.overall}, EEAT: ${result.qualityScores.eeat}, Depth: ${result.qualityScores.depth}`);

            // Format response with quality scores and QA insights
            let contentResult = result.content || "Content generation completed but no content was returned.";

            // Add quality score summary
            const scoreSummary = `
## Quality Scores
- **Overall Quality**: ${result.qualityScores.overall}/100
- **DataForSEO Score**: ${result.qualityScores.dataforseo}/100
- **EEAT Score**: ${result.qualityScores.eeat}/100
- **Content Depth**: ${result.qualityScores.depth}/100
- **Factual Accuracy**: ${result.qualityScores.factual}/100
- **Revision Rounds**: ${result.revisionCount}

${result.qaReport?.improvement_instructions && result.qaReport.improvement_instructions.length > 0 ? `\n## QA Review Notes\n${result.qaReport.improvement_instructions.slice(0, 3).map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n')}` : ''}
`;

            contentResult = contentResult + scoreSummary;

            return contentResult;
          } catch (error) {
            console.error("[Chat API] RAG Writer Orchestrator error:", error);
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

    const gatewayImageTool = tool({
      description: "Generate images with Google Gemini 2.5 Flash Image via Vercel AI Gateway. Use when the user asks for an image or wants edits/regenerations.",
      inputSchema: z.object({
        prompt: z.string().describe("Base prompt for the image"),
        previousPrompt: z.string().optional().describe("Previous prompt to refine from"),
        editInstructions: z.string().optional().describe("Refinements or edits requested by the user"),
        size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional(),
        aspectRatio: z.enum(["1:1", "4:3", "3:4", "16:9", "9:16"]).optional(),
        seed: z.number().optional().describe("Optional seed for deterministic output"),
        n: z.number().optional().describe("Number of images to request (default 1)"),
        abortTimeoutMs: z.number().optional().describe("Timeout in milliseconds for generation"),
      }),
      execute: async (args) => {
        try {
          console.log('[Chat API] Generating image with prompt:', args.prompt);

          const response = await generateImageWithGatewayGemini({
            prompt: args.prompt,
            previousPrompt: args.previousPrompt,
            editInstructions: args.editInstructions,
            size: args.size,
            aspectRatio: args.aspectRatio,
            seed: args.seed,
            n: args.n,
            abortTimeoutMs: args.abortTimeoutMs || 60000,
          });

          console.log('[Chat API] Image generated, returning base64 URLs...');

          // Return images as base64 data URLs (no external storage required)
          const uploadedImages: { url: string; name: string; mediaType: string }[] = response.images.map((img, idx) => ({
            url: img.dataUrl,
            name: `image-${idx + 1}.png`,
            mediaType: img.mediaType || 'image/png',
          }));

          const primary = uploadedImages[0];

          return {
            type: 'image',
            model: 'google/gemini-2.5-flash-image',
            prompt: response.prompt,
            size: args.size || '1024x1024',
            url: primary?.url,
            imageUrl: primary?.url,
            mediaType: primary?.mediaType,
            warnings: response.warnings,
            count: uploadedImages.length,
            files: uploadedImages.map(img => ({
              name: img.name,
              mediaType: img.mediaType,
              url: img.url,
            })),
            parts: uploadedImages.map(img => ({
              type: 'file',
              mimeType: img.mediaType,
              name: img.name,
              url: img.url,
            })),
            content: `Image generated successfully! [View Image](${primary?.url})`,
          };
        } catch (error: any) {
          console.error('[Chat API] Gateway image tool failed:', error);
          return {
            type: 'image',
            model: 'google/gemini-2.5-flash-image',
            status: 'error',
            errorMessage: error?.message || 'Image generation failed',
          };
        }
      }
    });

    // N8N Backlinks Tool - Fetch backlinks via n8n webhook (provides backlinks functionality not available in DataForSEO MCP)
    const n8nBacklinksTool = tool({
      description: "Fetch backlinks data for a domain using the n8n webhook integration. Use this when the user asks for backlinks, referring domains, link profile, or link building opportunities for a specific domain or website.",
      inputSchema: z.object({
        domain: z.string().describe("The domain to fetch backlinks for (e.g., 'example.com' or 'flowintent.com')"),
      }),
      execute: async ({ domain }) => {
        try {
          console.log('[Chat API] Fetching backlinks for domain via n8n:', domain);

          const response = await fetch('https://n8n-production-43e3.up.railway.app/webhook/get-backlinks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ domain }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Chat API] N8N backlinks webhook error:', response.status, errorText);
            return {
              status: 'error',
              errorMessage: `Failed to fetch backlinks: ${response.status} ${response.statusText}`,
            };
          }

          const data = await response.json();
          console.log('[Chat API] N8N backlinks response received:', {
            domain,
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : []
          });

          return {
            status: 'success',
            domain,
            ...data,
          };
        } catch (error: any) {
          console.error('[Chat API] N8N backlinks tool failed:', error);
          return {
            status: 'error',
            domain,
            errorMessage: error?.message || 'Failed to fetch backlinks data',
          };
        }
      }
    });

    // Construct Final Tool Set
    const allTools = {
      // Core Tools (Always available)
      ...orchestratorTool,
      client_ui: clientUiTool,
      gateway_image: gatewayImageTool,

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

      // N8N Backlinks - Only for SEO/AEO agent (provides backlinks via n8n webhook)
      ...(routingResult.agent === 'seo-aeo' ? { n8n_backlinks: n8nBacklinksTool } : {}),

      // MCP Tools (Loaded based on agent type)
      ...loadToolsForAgent(routingResult.agent, allMCPTools),
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
    console.log('[Chat API] Incoming messages count:', incomingMessages.length);

    const serverMessageIdGenerator = createIdGenerator({ prefix: 'msg', size: 16 });

    // Convert Message[] from useChat to CoreMessage[] for streamText
    // convertToCoreMessages handles the conversion properly, preserving parts and toolInvocations
    let coreMessages: CoreMessage[];
    try {
      coreMessages = convertToCoreMessages(incomingMessages);
      console.log('[Chat API] Converted to CoreMessage[], count:', coreMessages.length);
    } catch (err) {
      console.error('[Chat API] convertToCoreMessages failed:', err);
      // Fallback: try again with type assertion (AI SDK 6 compatibility)
      coreMessages = convertToCoreMessages(incomingMessages as any);
    }

    // Use AI SDK 6 with stopWhen conditions for tool loop control
    const resultOrPromise = streamText({
      model: vercelGateway.languageModel(CHAT_MODEL_ID),
      messages: coreMessages,
      system: systemPrompt,
      tools: validatedTools,
      toolChoice: 'auto',
      // AI SDK 6: Model fallbacks via Vercel AI Gateway
      providerOptions: {
        gateway: {
          models: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'], // Fallback models
        },
      },
      // AI SDK 6: Use stopWhen instead of maxSteps
      stopWhen: [
        stepCountIs(10), // Maximum 10 steps to prevent runaway costs
      ],
      experimental_telemetry: createTelemetryConfig('chat-stream', {
        userId: user?.id,
        sessionId: activeConversationId || context?.conversationId, // Langfuse session tracking
        agentType: routingResult.agent,
        page: context?.page,
        isOnboarding: !!isOnboarding,
        onboardingStep: onboardingContext?.currentStep,
        workflowId: workflowId || undefined,
        toolsCount: Object.keys(validatedTools).length,
        conversationId: activeConversationId, // Keep for backward compatibility
        // MCP tools enabled as individual boolean flags (objects not allowed in telemetry)
        mcpDataforseoEnabled: routingResult.agent === 'seo-aeo' || routingResult.agent === 'content',
        mcpFirecrawlEnabled: routingResult.agent === 'seo-aeo' || routingResult.agent === 'content',
        mcpJinaEnabled: routingResult.agent === 'content',
        mcpWinstonEnabled: routingResult.agent === 'content',
      }),
      onFinish: async ({ response, usage }) => {
        const { messages: finalMessages } = response;

        // Log AI usage
        // TODO: Re-enable usage logging once usage-logger is implemented
        // if (user && !authError) {
        //   try {
        //     const { logAIUsage } = await import('@/lib/analytics/usage-logger');
        //     await logAIUsage({
        //       userId: user.id,
        //       conversationId: activeConversationId || context?.conversationId,
        //       agentType: 'general',
        //       model: CHAT_MODEL_ID,
        //       promptTokens: usage?.inputTokens || 0,
        //       completionTokens: usage?.outputTokens || 0,
        //       toolCalls: (response as any).steps?.reduce(
        //         (sum: number, step: any) => sum + (step.toolCalls?.length || 0),
        //         0,
        //       ) || 0,
        //       metadata: {
        //         onboarding: !!onboardingContext,
        //       },
        //     });
        //   } catch (error) {
        //     console.error('[Chat API] Error logging usage:', error);
        //   }
        // }

        // Note: Assistant messages are saved in toUIMessageStreamResponse onFinish callback
        // to the correct 'messages' table with proper conversation_id
      },
    });

    // Handle potential Promise return (in case of version mismatch or async behavior)
    let result = resultOrPromise;
    if (resultOrPromise && typeof (resultOrPromise as any).then === 'function') {
      console.log('[Chat API] streamText returned a Promise. Awaiting...');
      result = await resultOrPromise;
    }

    console.log('[Chat API] streamText result keys:', Object.keys(result));

    // Critical for serverless: flush traces before function terminates
    // Get langfuseSpanProcessor from global (set in instrumentation.ts)
    const langfuseSpanProcessor = (global as any).langfuseSpanProcessor;
    if (langfuseSpanProcessor) {
      after(async () => await langfuseSpanProcessor.forceFlush());
    }

    // AI SDK v6: Use toUIMessageStreamResponse for proper chat transport compatibility
    // Pass originalMessages to prevent duplicate assistant messages (see troubleshooting guide)
    // Wrap the stream to enforce beta character limit
    const originalStream = result.toUIMessageStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      originalMessages: incomingMessages, // Use original Message[] from useChat
      generateMessageId: serverMessageIdGenerator,
      onFinish: async ({ messages: uiMessages }) => {
        console.log('[Chat API] toUIMessageStreamResponse onFinish:', {
          hasMessages: !!uiMessages?.length,
          messageCount: uiMessages?.length || 0,
          activeConversationId,
          hasUser: !!user,
        });

        if (!uiMessages?.length || !activeConversationId || !user) {
          console.warn('[Chat API] Skipping assistant message save - missing required data:', {
            hasMessages: !!uiMessages?.length,
            activeConversationId,
            hasUser: !!user,
          });
          return;
        }

        const finalAssistantMessage = uiMessages[uiMessages.length - 1];
        if (finalAssistantMessage?.role !== 'assistant') {
          console.warn('[Chat API] Last message is not assistant, skipping save');
          return;
        }

        // Log tool invocations for debugging image generation (AI SDK 6 uses parts)
        const toolParts = finalAssistantMessage.parts?.filter((p: any) => p.type === 'tool-invocation') || [];
        if (toolParts.length > 0) {
          console.log('[Chat API] Final assistant message tool invocations:', {
            count: toolParts.length,
            tools: toolParts.map((t: any) => ({
              toolName: t.toolInvocation?.toolName,
              hasResult: !!t.toolInvocation?.result,
              resultKeys: t.toolInvocation?.result ? Object.keys(t.toolInvocation.result) : [],
            })),
          });

          // Log image tool results specifically
          const imageTools = toolParts.filter(
            (t: any) => t.toolInvocation?.toolName === 'gateway_image' && t.toolInvocation?.state === 'result'
          );
          if (imageTools.length > 0) {
            console.log('[Chat API] Image tool results:', imageTools.map((t: any) => ({
              // Safety check for result properties
              hasFiles: t.toolInvocation?.result && Array.isArray(t.toolInvocation.result.files),
              filesCount: t.toolInvocation?.result?.files?.length || 0,
              hasParts: t.toolInvocation?.result && Array.isArray(t.toolInvocation.result.parts),
              partsCount: t.toolInvocation?.result?.parts?.length || 0,
              hasUrl: !!t.toolInvocation?.result?.url,
            })));
          }
        }

        // TODO: Re-enable assistant message persistence once chat storage is migrated to Drizzle
        // The storage functions have incompatible signatures with AI SDK 6 types
        // try {
        //   const normalizedMessage = normalizeUIMessage(finalAssistantMessage as any);
        //   await saveConversationMessage(
        //     activeConversationId || '',
        //     user?.id || '',
        //     'assistant',
        //     normalizedMessage.content || ''
        //   );
        //   console.log('[Chat API] ✓ Assistant message saved successfully');
        // } catch (error) {
        //   console.error('[Chat API] Failed to persist assistant message:', error);
        // }
      },
    });

    // Return the stream directly - beta character limiting was breaking AI SDK v6 streaming
    // The wrapper incorrectly parsed SSE format and used wrong property names (textDelta vs delta)
    // TODO: Re-implement character limiting properly if needed in the future
    return originalStream;

  } catch (error) {
    console.error("Chat API error:", error);

    // Update trace with error before returning
    updateActiveObservation({
      output: error instanceof Error ? error.message : String(error),
      level: "ERROR"
    });
    updateActiveTrace({
      output: error instanceof Error ? error.message : String(error),
    });
    trace.getActiveSpan()?.end();

    // Use standardized error handler
    return handleApiError(error, "Failed to process chat request");
  }
};

// Wrap handler with observe() to create a Langfuse trace
export const POST = observe(handler, {
  name: "handle-chat-message",
  endOnExit: false, // Don't end observation until stream finishes
});