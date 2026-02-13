/**
 * Instant Campaign: Answer This Question (AEO)
 * 
 * Streamlined 3-step workflow optimized for AI citation
 * Input: question → Output: content optimized for ChatGPT/Perplexity/Claude citations
 */

import { Workflow } from '../types'

export const instantAnswerQuestionWorkflow: Workflow = {
  id: 'instant-answer-question',
  name: 'Answer This Question (AEO)',
  description: 'Enter a question → Get content optimized for AI citations (ChatGPT, Perplexity, Claude)',
  icon: '🤖',
  category: 'instant',
  estimatedTime: '2-3 minutes',
  tags: ['Instant', 'AEO', 'AI Search', 'Citations', 'Question', 'ChatGPT'],
  requiredTools: [
    'perplexity_search',
    'serp_organic_live_advanced',
    'ai_optimization_keyword_data_search_volume',
    'generate_researched_content',
  ],
  requiredAPIs: ['dataforseo', 'perplexity'],

  parameters: {
    question: {
      type: 'string',
      description: 'The question your audience is asking',
      required: true,
      example: 'What is the best CRM for small businesses?',
    },
    includeImages: {
      type: 'boolean',
      description: 'Generate infographic-style hero image (default: true)',
      required: false,
      default: true,
    },
  },

  steps: [
    // STEP 1: QUESTION ANALYSIS (Target: 20 seconds)
    {
      id: 'instant-question-analysis',
      name: 'Analyze Question',
      description: 'Research how AI systems currently answer this question',
      agent: 'research',
      parallel: true,
      tools: [
        {
          name: 'perplexity_search',
          params: {
            query: '{{question}}',
            search_recency_filter: 'month',
            return_citations: true,
          },
          required: true,
        },
        {
          name: 'serp_organic_live_advanced',
          params: {
            keyword: '{{question}}',
            location_name: 'United States',
            language_code: 'en',
            depth: 5,
          },
          required: true,
        },
        {
          name: 'ai_optimization_keyword_data_search_volume',
          params: {
            keywords: ['{{question}}'],
            location_name: 'United States',
            language_code: 'en',
          },
          required: false,
        },
      ],
      systemPrompt: `You are an AEO (Answer Engine Optimization) research agent.

Your goal is to understand how AI systems currently answer this question:
1. Get Perplexity's current answer and cited sources
2. See what content ranks in Google for this question
3. Check AI search volume to gauge demand

Key insights to extract:
- What format do current answers use? (list, paragraph, comparison)
- What sources get cited?
- What's the typical answer length?
- What follow-up questions do people ask?

This data will inform how we structure our answer for maximum citation potential.`,
      outputFormat: 'json',
    },

    // STEP 2: ANSWER GENERATION (Target: 60 seconds)
    {
      id: 'instant-answer-generate',
      name: 'Generate Answer',
      description: 'Create citation-optimized content with direct answer and expanded content',
      agent: 'content',
      parallel: true,
      dependencies: ['instant-question-analysis'],
      tools: [
        {
          name: 'generate_direct_answer',
          params: {
            question: '{{question}}',
            targetLength: '40-60 words',
            style: 'authoritative_concise',
            includeKeyFact: true,
          },
          required: true,
        },
        {
          name: 'generate_researched_content',
          params: {
            topic: '{{question}}',
            keyword: '{{question}}',
            contentType: 'aeo-article',
            structure: 'question-first',
            includeDirectAnswer: true,
            directAnswerPosition: 'immediately_after_h1',
            researchData: '{{instant-question-analysis}}',
            optimizeForAEO: true,
            targetWordCount: 1500,
          },
          required: true,
        },
        {
          name: 'generate_faq_schema',
          params: {
            mainQuestion: '{{question}}',
            relatedQuestions: '{{instant-question-analysis.related_questions}}',
            generateAnswers: true,
          },
          required: true,
        },
        {
          name: 'generate_hero_image',
          params: {
            topic: '{{question}}',
            style: 'infographic',
            aspectRatio: '16:9',
            includeText: false,
          },
          required: false,
        },
      ],
      systemPrompt: `You are an AEO content specialist creating content optimized for AI citations.

CRITICAL: AI systems cite content that:
1. Provides a DIRECT ANSWER in 40-60 words immediately after the question
2. Is structured with the question as H1 or near the top
3. Expands with E-E-A-T signals (expertise, experience, authority, trust)
4. Includes related FAQs with concise answers
5. Uses authoritative citations

Content structure:
- H1: The exact question (or close variant)
- Paragraph 1: Direct answer (40-60 words) - THIS IS WHAT GETS CITED
- Section: Expanded explanation with expertise
- Section: Data/statistics with citations
- Section: Expert insights/experience
- FAQ: Related questions with 40-60 word answers each

Make the direct answer:
- Self-contained (makes sense without reading more)
- Factual and authoritative
- Specific (includes a key number or fact when possible)`,
      outputFormat: 'json',
    },

    // STEP 3: AEO OPTIMIZATION (Target: 30 seconds)
    {
      id: 'instant-aeo-optimize',
      name: 'AEO Optimize',
      description: 'Add speakable schema, validate citation-readiness, generate meta',
      agent: 'seo',
      parallel: true,
      dependencies: ['instant-answer-generate'],
      tools: [
        {
          name: 'generate_speakable_schema',
          params: {
            content: '{{instant-answer-generate.content}}',
            directAnswer: '{{instant-answer-generate.direct_answer}}',
            question: '{{question}}',
          },
          required: true,
        },
        {
          name: 'generate_qa_schema',
          params: {
            question: '{{question}}',
            answer: '{{instant-answer-generate.direct_answer}}',
          },
          required: true,
        },
        {
          name: 'validate_citation_readiness',
          params: {
            content: '{{instant-answer-generate.content}}',
            directAnswer: '{{instant-answer-generate.direct_answer}}',
            question: '{{question}}',
          },
          required: true,
        },
        {
          name: 'generate_meta_tags',
          params: {
            content: '{{instant-answer-generate.content}}',
            keyword: '{{question}}',
            format: 'question_answer',
            maxTitleLength: 60,
            maxDescriptionLength: 160,
          },
          required: true,
        },
      ],
      systemPrompt: `You are an AEO optimization specialist finalizing content for AI citations.

Final optimizations:
1. Add Speakable schema pointing to the direct answer section
2. Add QAPage schema with the question and answer
3. Validate citation-readiness:
   - Is direct answer 40-60 words? 
   - Is it immediately after the question?
   - Does it make sense standalone?
   - Does it include a key fact/number?
4. Create meta tags that mirror the question-answer format

Speakable schema is critical for voice search and AI assistants.
QAPage schema signals to Google this is a definitive answer.`,
      outputFormat: 'json',
    },
  ],

  output: {
    content: {
      type: 'string',
      description: 'The AEO-optimized content',
    },
    directAnswer: {
      type: 'string',
      description: 'The 40-60 word direct answer (citation-ready)',
    },
    heroImage: {
      type: 'object',
      description: 'Infographic-style hero image',
    },
    schema: {
      type: 'object',
      description: 'Combined schema (Speakable + QAPage + FAQPage)',
      properties: {
        speakable: { type: 'object' },
        qaPage: { type: 'object' },
        faqPage: { type: 'object' },
      },
    },
    meta: {
      type: 'object',
      description: 'Meta title and description',
    },
    citationReadiness: {
      type: 'object',
      description: 'Citation readiness validation results',
      properties: {
        score: { type: 'number' },
        directAnswerLength: { type: 'number' },
        hasKeyFact: { type: 'boolean' },
        isStandalone: { type: 'boolean' },
        suggestions: { type: 'array' },
      },
    },
    relatedQuestions: {
      type: 'array',
      description: 'Related questions with answers (for FAQ section)',
    },
    currentAIAnswers: {
      type: 'object',
      description: 'How AI systems currently answer this question (for reference)',
    },
  },
}
