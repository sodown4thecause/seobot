import { streamText } from 'ai';
import { vercelGateway } from '@/lib/ai/gateway-provider';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
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

    // Generate content using Gemini via Gateway
    const result = streamText({
      model: vercelGateway.languageModel('google/gemini-1.5-flash'),
      prompt: systemPrompt,
      system: 'You are a professional content writer.',
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Content Generation Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
