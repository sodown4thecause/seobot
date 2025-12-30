import { streamText } from 'ai';
import { vercelGateway } from '@/lib/ai/gateway-provider';
import { z } from 'zod';
import { rateLimitMiddleware } from '@/lib/redis/rate-limit';
import { getUserId } from '@/lib/auth/clerk';
import { handleApiError } from '@/lib/errors/handlers';
import { createTelemetryConfig } from '@/lib/observability/langfuse';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Get user for rate limiting
    const userId = await getUserId();

    // Check rate limit for content generation
    const rateLimitResponse = await rateLimitMiddleware(req as any, 'CONTENT_GENERATION', userId || undefined);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { topic, type, tone, keywords } = await req.json();

    const systemPrompt = `You are an expert content writer specializing in SEO-optimized content.
    Topic: ${topic}
    Content Type: ${type}
    Tone: ${tone}
    Keywords: ${keywords?.join(', ')}
    
    Write a comprehensive, engaging, and well-structured piece of content.
    Use Markdown formatting.
    Include headings, bullet points, and short paragraphs.
    Optimize for the provided keywords naturally.`;

    // Generate a session ID for this content generation request
    const sessionId = `content-gen-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Generate content using Gemini via Gateway
    const result = streamText({
      model: vercelGateway.languageModel('google/gemini-1.5-flash'),
      prompt: systemPrompt,
      system: 'You are a professional content writer.',
      experimental_telemetry: createTelemetryConfig('content-generate-api', {
        userId,
        sessionId, // Langfuse session tracking for content generation
        topic,
        contentType: type,
        tone,
        keywords: keywords?.join(', '),
      }),
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Content Generation Error:', error);
    return handleApiError(error, 'Failed to generate content');
  }
}
