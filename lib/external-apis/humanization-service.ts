/**
 * Multi-Provider Content Humanization Service
 * 
 * Provides AI content humanization with automatic fallback between providers
 * Primary: Rytr, Fallback: QuillBot API, Local humanization techniques
 */

import { humanizeContent as rytrHumanize } from './rytr';
import { vercelGateway } from '@/lib/ai/gateway-provider';
import { generateText } from 'ai';
import { applyStylisticPass, applyLexicalVariation } from '@/lib/ai/style/postprocess';

export interface HumanizationResult {
  content: string;
  provider: 'rytr' | 'claude' | 'local';
  success: boolean;
  error?: string;
}

const MAX_CHUNK_SIZE = 1400;

/**
 * Humanize content using Claude as a reliable fallback
 * Uses sophisticated prompting to make AI content sound more human
 */
async function humanizeWithClaude(content: string, guidance?: string): Promise<string> {
  const prompt = `You are an expert content humanizer. Your task is to rewrite AI-generated content to sound more natural, human, and authentic while preserving all key information and SEO value.

RULES FOR HUMANIZATION:
1. Use contractions naturally (you're, we've, it's, don't)
2. Add personal touches and conversational elements
3. Vary sentence structure and length dramatically
4. Include rhetorical questions where appropriate
5. Use transitional phrases that feel natural ("Here's the thing", "Let me explain", "Think about it")
6. Add subtle personality without being unprofessional
7. Break up long paragraphs into conversational chunks
8. Use active voice predominantly
9. Include occasional interjections or asides
10. Make it feel like a knowledgeable person explaining to a friend

${guidance ? `\nCRITICAL ANTI-DETECTION GUIDELINES:\n${guidance}\n` : ''}

PRESERVE:
- All factual information
- Key statistics and data
- SEO keywords (but use them naturally)
- Headers and structure
- Technical accuracy

AVOID:
- Losing important details
- Changing the core message
- Over-casualizing professional content
- Removing technical terms that are necessary
- Making it sound like marketing fluff

Original Content:
${content}

Rewrite this to sound authentically human while keeping all the valuable information intact. Make it engaging, natural, and trustworthy.`;

  const { text } = await generateText({
    model: vercelGateway.languageModel('anthropic/claude-3-5-sonnet-20241022'),
    prompt,
    temperature: 0.9,
  });

  return text;
}

/**
 * Local humanization using text transformation techniques
 * Last resort fallback when APIs fail
 */
function localHumanization(content: string): string {
  let humanized = content;

  // Add contractions
  const contractions: Record<string, string> = {
    'you are': "you're",
    'we are': "we're",
    'it is': "it's",
    'that is': "that's",
    'they are': "they're",
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",
    'will not': "won't",
    'cannot': "can't",
    'should not': "shouldn't",
    'would not': "wouldn't",
    'could not': "couldn't",
    'have not': "haven't",
    'has not': "hasn't",
    'had not': "hadn't",
  };

  for (const [formal, casual] of Object.entries(contractions)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    humanized = humanized.replace(regex, casual);
  }

  return humanized;
}

function applyReadabilityPolish(content: string): string {
  const markers = ["Here's the thing", 'Now', 'Look', 'Think about it', 'Let’s be honest'];
  const paragraphs = content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean);

  const polished = paragraphs.map((para, index) => {
    if (index === 0 || para.startsWith('#')) return para;
    if (para.length < 120) return para;
    if (index % 3 === 0) {
      const marker = markers[index % markers.length];
      return `${marker}, ${para.charAt(0).toLowerCase()}${para.slice(1)}`;
    }
    return para;
  });

  return polished.join('\n\n');
}

function splitIntoChunks(content: string, maxChars: number = MAX_CHUNK_SIZE): string[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= maxChars) return [normalized];

  const lines = normalized.split('\n');
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim().length > 0) {
      chunks.push(current.trim());
      current = '';
    }
  };

  for (const line of lines) {
    const isHeading = /^#{1,6}\s/.test(line.trim());
    if (isHeading && current.length >= maxChars * 0.5) {
      pushCurrent();
    }

    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > maxChars && current.length > 0) {
      pushCurrent();
      current = line;
      continue;
    }

    current = candidate;
  }

  pushCurrent();

  return chunks.length > 0 ? chunks : [normalized];
}

async function humanizeChunk(options: {
  chunk: string;
  userId?: string;
  disableRytr?: boolean;
  guidance?: string;
}): Promise<HumanizationResult> {
  const { chunk, userId, disableRytr, guidance } = options;

  if (!disableRytr) {
    try {
      console.log('[Humanization] Attempting Rytr chunk...');
      const result = await rytrHumanize({
        content: chunk,
        strategy: 'improve',
        userId,
      });

      if (result.content && result.content.trim().length > 0) {
        console.log('[Humanization] ✓ Rytr chunk succeeded');
        return {
          content: result.content,
          provider: 'rytr',
          success: true,
        };
      }
    } catch (error) {
      console.warn('[Humanization] Rytr chunk failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  } else {
    console.log('[Humanization] Rytr disabled for this chunk – skipping');
  }

  try {
    console.log('[Humanization] Attempting Claude chunk...');
    const humanized = await humanizeWithClaude(chunk, guidance);
    if (humanized && humanized.trim().length > 0) {
      console.log('[Humanization] ✓ Claude chunk succeeded');
      return {
        content: humanized,
        provider: 'claude',
        success: true,
      };
    }
  } catch (error) {
    console.warn('[Humanization] Claude chunk failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  console.log('[Humanization] Using local chunk techniques...');
  return {
    content: localHumanization(chunk),
    provider: 'local',
    success: true,
  };
}

/**
 * Main humanization function with chunked multi-provider fallback
 */
export async function humanizeContent(options: {
  content: string;
  userId?: string;
  disableRytr?: boolean;
  guidance?: string;
}): Promise<HumanizationResult> {
  const { content, userId, disableRytr = false, guidance } = options;

  console.log('[Humanization] Starting multi-provider humanization');
  console.log('[Humanization] Content length:', content.length);

  const chunks = splitIntoChunks(content);
  const humanizedChunks: string[] = [];
  let providerUsed: HumanizationResult['provider'] = 'local';
  let rytrAttempted = disableRytr;

  for (const chunk of chunks) {
    const chunkResult = await humanizeChunk({
      chunk,
      userId,
      disableRytr: rytrAttempted,
      guidance,
    });

    humanizedChunks.push(chunkResult.content);

    if (chunkResult.provider === 'rytr') {
      providerUsed = 'rytr';
      rytrAttempted = true; // use Claude/local for subsequent chunks if needed
    } else if (chunkResult.provider === 'claude' && providerUsed !== 'rytr') {
      providerUsed = 'claude';
    }
  }

  const polishedContent = applyReadabilityPolish(humanizedChunks.join('\n\n'));
  const stylizedContent = applyStylisticPass(polishedContent);
  const variedContent = applyLexicalVariation(stylizedContent);

  return {
    content: variedContent,
    provider: providerUsed,
    success: true,
  };
}

