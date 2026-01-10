import { type UIMessage } from "ai";
import { after } from "next/server";
import { trace } from "@opentelemetry/api";
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { getCurrentUser } from "@/lib/auth/clerk";
import { rateLimitMiddleware } from "@/lib/redis/rate-limit";
import { handleApiError } from "@/lib/errors/handlers";
import {
  ensureConversationForUser,
  saveConversationMessage,
} from "@/lib/chat/storage";
import { guidedWorkflowEngine } from "@/lib/proactive";

// Import refactored modules
import {
  classifyUserIntent,
  buildAgentSystemPrompt,
  type AgentType,
} from "@/lib/chat/intent-classifier";
import {
  assembleTools,
} from "@/lib/chat/tool-assembler";
import {
  extractLastUserMessageContent,
  convertToCore,
  validateMessages,
  extractMessageContent,
  type RequestBody,
  type ChatContext,
} from "@/lib/chat/message-handler";
import {
  buildStreamResponse,
  getCoreTools,
} from "@/lib/chat/stream-builder";

export const maxDuration = 300; // 5 minutes

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
    const agentId = (context as ChatContext)?.agentId || 'general';

    // Extract onboarding context for system prompt building
    const onboardingContext = context?.onboarding;
    const isOnboarding = context?.page === 'onboarding' || !!onboardingContext;

    // Get current user (needed for rate limiting)
    let user = null;

    try {
      user = await getCurrentUser();
    } catch (err) {
      console.warn('[Chat API] Auth check failed (safe to ignore for anon usage):', err);
      user = null;
    }

    // Apply rate limiting with user context
    const userRateLimitResponse = await rateLimitMiddleware(
      req as unknown as import('next/server').NextRequest,
      'CHAT',
      user?.id
    );
    if (userRateLimitResponse) {
      return userRateLimitResponse;
    }

    const requestedConversationId = chatId || context?.conversationId;
    const resolvedAgentType = agentId || context?.agentType || 'general';

    let conversationRecord: Awaited<ReturnType<typeof ensureConversationForUser>> | null = null;

    // If user is authenticated, ensure we have a conversation (create if needed)
    if (user) {
      try {
        conversationRecord = await ensureConversationForUser(
          user.id,
          resolvedAgentType
        );
      } catch (error) {
        console.error('[Chat API] Conversation lookup/creation failed:', error);
      }
    }

    // Validate incoming messages
    const validationError = validateMessages(incomingMessages);
    if (validationError) {
      return validationError;
    }

    // TypeScript now knows incomingMessages is valid
    const messages = incomingMessages as UIMessage[];

    // Save user messages to database
    try {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'user' && conversationRecord) {
        const userContent = extractMessageContent(lastMsg);
        await saveConversationMessage(
          conversationRecord.id,
          user?.id || '',
          'user',
          userContent,
          {
            parts: (lastMsg as any)?.parts,
            toolInvocations: (lastMsg as any)?.toolInvocations,
          }
        );
        console.log('[Chat API] User message saved successfully');
      }
    } catch (error) {
      console.error('[Chat API] Failed to save user message:', error);
    }

    // Ensure we always have a conversation ID for authenticated users
    const activeConversationId = conversationRecord?.id ?? requestedConversationId;

    // Extract last user message content for intent detection
    const lastUserMessageContent = extractLastUserMessageContent(messages);

    // WORKFLOW DETECTION: Check if user wants to run a workflow
    const { detectWorkflow, isWorkflowRequest, extractWorkflowId } =
      await import("@/lib/workflows");
    const detectedWorkflowId = detectWorkflow(lastUserMessageContent);
    const isExplicitWorkflowRequest = isWorkflowRequest(lastUserMessageContent);
    const explicitWorkflowId = extractWorkflowId(lastUserMessageContent);

    const workflowId = explicitWorkflowId || detectedWorkflowId;

    if (workflowId) {
      console.log("[Chat API] Workflow detected:", workflowId);
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

    // INTENT CLASSIFICATION: Use LLM-based classification with keyword fallback
    const classificationResult = await classifyUserIntent({
      query: lastUserMessageContent,
      context,
    });

    console.log('[Chat API] Final agent selection:', {
      agent: classificationResult.agent,
      confidence: classificationResult.confidence,
      reasoning: classificationResult.reasoning,
      toolsCount: classificationResult.tools.length,
    });

    // Update Langfuse trace with conversation context and user input
    updateActiveObservation({
      input: lastUserMessageContent,
    });

    updateActiveTrace({
      name: "chat-message",
      sessionId: activeConversationId || undefined,
      userId: user?.id || undefined,
      input: lastUserMessageContent,
      metadata: {
        agentType: classificationResult.agent,
        page: context?.page,
        isOnboarding: !!isOnboarding,
        onboardingStep: onboardingContext?.currentStep,
        workflowId: workflowId || undefined,
        intentClassification: classificationResult.classification?.primaryIntent,
      },
    });

    // Build system prompt for the selected agent
    const systemPrompt = buildAgentSystemPrompt(
      classificationResult.agent,
      context,
      classificationResult.allIntents
    );

    // ASSEMBLE TOOLS based on agent and intent classification
    const assembledTools = await assembleTools({
      agent: classificationResult.agent,
      intentTools: classificationResult.tools,
      userId: user?.id,
      request: req,
    });

    // Merge with core tools
    const coreTools = getCoreTools(user?.id);
    const allTools = {
      ...coreTools,
      ...assembledTools,
    };

    console.log('[Chat API] Final validated tools for streamText:', {
      count: Object.keys(allTools).length,
      tools: Object.keys(allTools),
    });

    // Convert messages to CoreMessage format
    const coreMessages = convertToCore(messages);

    // Build and return streaming response
    const streamResponse = await buildStreamResponse({
      coreMessages,
      systemPrompt,
      tools: allTools,
      userId: user?.id,
      conversationId: activeConversationId,
      agentType: classificationResult.agent,
      context: context as Record<string, unknown>,
      originalMessages: messages,
      onFinish: async ({ messages: uiMessages }) => {
        console.log('[Chat API] Stream onFinish:', {
          hasMessages: !!uiMessages?.length,
          messageCount: uiMessages?.length || 0,
          activeConversationId,
          hasUser: !!user,
        });

        if (!uiMessages?.length || !activeConversationId || !user) {
          console.warn('[Chat API] Skipping assistant message save - missing required data');
          return;
        }

        const finalAssistantMessage = uiMessages[uiMessages.length - 1];
        if (finalAssistantMessage?.role !== 'assistant') {
          console.warn('[Chat API] Last message is not assistant, skipping save');
          return;
        }

        // Save assistant message to database
        try {
          const assistantContent = extractMessageContent(finalAssistantMessage);

          await saveConversationMessage(
            activeConversationId,
            user?.id || '',
            'assistant',
            assistantContent,
            {
              parts: (finalAssistantMessage as any)?.parts,
              toolInvocations: (finalAssistantMessage as any)?.toolInvocations,
            }
          );
          console.log('[Chat API] Assistant message saved successfully');

          // Generate proactive suggestions for next steps
          try {
            const suggestions = await guidedWorkflowEngine.generateSuggestions({
              userId: user.id,
              conversationId: activeConversationId,
              assistantResponse: assistantContent,
            });
            console.log('[Chat API] Generated proactive suggestions:', {
              count: suggestions.suggestions.length,
              pillar: suggestions.currentPillar,
            });

            // Collect memories for persistence
            try {
              await guidedWorkflowEngine.collectMemories(
                user.id,
                activeConversationId,
                messages || []
              );
              console.log('[Chat API] Memories collected successfully');
            } catch (memoryError) {
              console.warn('[Chat API] Failed to collect memories:', memoryError);
            }
          } catch (suggestionError) {
            console.warn('[Chat API] Failed to generate suggestions:', suggestionError);
          }
        } catch (error) {
          console.error('[Chat API] Failed to persist assistant message:', error);
        }
      },
    });

    // Critical for serverless: flush traces before function terminates
    const langfuseSpanProcessor = (global as any).langfuseSpanProcessor;
    if (langfuseSpanProcessor) {
      after(async () => await langfuseSpanProcessor.forceFlush());
    }

    return streamResponse;

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
