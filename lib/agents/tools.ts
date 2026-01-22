import { tool, generateText } from 'ai';
import { z } from 'zod';
import { perplexity } from '@ai-sdk/perplexity';
import { findRelevantFrameworks, formatFrameworksForPrompt, batchIncrementUsage } from '@/lib/ai/rag-service';
import { createTelemetryConfig } from '@/lib/observability/langfuse';

/**
 * Research Agent Tool
 * Conducts deep research using Perplexity to answer technical or complex questions.
 * Returns a synthesized answer with citations.
 */
export const researchAgentTool = tool({
  description: 'A researcher that searches the web and knowledge base for technical answers, facts, and deep insights. Use this for questions requiring up-to-date information or deep research.',
  inputSchema: z.object({
    query: z.string().describe('The search query to run'),
    depth: z.enum(['quick', 'standard', 'deep']).optional().describe('Depth of research'),
  }),
  execute: async ({ query, depth = 'standard' }: { query: string; depth?: 'quick' | 'standard' | 'deep' }) => {
    console.log(`[Research Tool] Executing for: ${query} (depth: ${depth})`);
    
    try {
      const { text } = await generateText({
        model: perplexity('sonar-pro'),
        prompt: `Research the topic: "${query}"

Provide:
1. A comprehensive summary
2. Key points and insights
3. Current trends and developments
4. Relevant statistics and data
5. Expert perspectives

Focus on information that would be valuable for creating SEO/AEO optimized content.`,
        temperature: 0.3,
        experimental_telemetry: createTelemetryConfig('research-tool', {
          query,
          depth,
          provider: 'perplexity',
          model: 'sonar-pro',
        }),
      });
      
      return text;
    } catch (error) {
      console.error('[Research Tool] Error:', error);
      return "I encountered an error while researching this topic. Please try again.";
    }
  },
});

/**
 * Competitor Analysis Tool
 * Searches for competitor information.
 */
export const competitorAgentTool = tool({
  description: "Search for competitor analysis and market research information. Use this when users ask about competitors in the SEO/AEO space.",
  inputSchema: z.object({
    query: z.string().describe("Search query for competitor or industry information"),
  }),
  execute: async ({ query }: { query: string }) => {
    console.log(`[Competitor Tool] Executing for: ${query}`);

    // This logic was moved from route.ts
    // In a real implementation, this might call DataForSEO or a real search API
    // For now, it provides a high-quality static analysis for the demo context
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

    console.log(`[Competitor Tool] Completed successfully`);
    return analysis;
  },
});

/**
 * RAG Framework Tool
 * Retrieves writing frameworks and best practices.
 */
export const frameworkRagTool = tool({
  description: "Consults the internal knowledge base for writing frameworks, templates, and best practices. Use this when the user asks about structure, format, or how to write specific types of content (blogs, ads, emails, etc.).",
  inputSchema: z.object({
    query: z.string().describe("The type of content or framework to search for (e.g., 'blog post', 'landing page', 'email sequence')"),
  }),
  execute: async ({ query }: { query: string }) => {
    console.log(`[Framework Tool] Searching for: ${query}`);
    
    try {
      const frameworks = await findRelevantFrameworks(query, { maxResults: 3 });
      
      if (frameworks.length === 0) {
        return "I couldn't find any specific frameworks for that content type. However, I can help you structure it based on general best practices.";
      }
      
      const formatted = formatFrameworksForPrompt(frameworks);
      
      // Track usage
      const frameworkIds = frameworks.map(f => f.id);
      batchIncrementUsage(frameworkIds).catch(err => 
        console.warn("[Framework Tool] Failed to track usage:", err)
      );
      
      return formatted;
    } catch (error) {
      console.error("[Framework Tool] Error:", error);
      return "I encountered an error retrieving frameworks.";
    }
  },
});
