/**
 * SEO/AEO Chatbot Evaluation Questions
 * 
 * 20 test questions covering all major SEO/AEO functionality
 * Each question has expected tools that should be called
 */

export interface TestQuestion {
  id: number
  question: string
  expectedTools: string[]
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string // What this question is testing
}

export const testQuestions: TestQuestion[] = [
  // ============================================
  // Category 1: Traditional SEO - Keyword Research (4 questions)
  // ============================================
  {
    id: 1,
    question: "What's the search volume and competition for 'best CRM software for small business'? Also show me related long-tail keywords I could target.",
    expectedTools: ['keywords_data_google_ads_search_volume', 'labs_keyword_suggestions'],
    category: 'Traditional SEO - Keyword Research',
    difficulty: 'easy',
    description: 'Tests basic keyword volume lookup and suggestion tools'
  },
  {
    id: 2,
    question: "Find low-difficulty keywords in the 'project management software' niche that have high search volume but low competition.",
    expectedTools: ['labs_keyword_suggestions', 'keywords_data_google_ads_search_volume'],
    category: 'Traditional SEO - Keyword Research',
    difficulty: 'medium',
    description: 'Tests keyword difficulty analysis and filtering'
  },
  {
    id: 3,
    question: "What is the search intent behind 'buy email marketing software' and what are the related questions users ask?",
    expectedTools: ['labs_keyword_suggestions', 'serp_google_organic_live_advanced'],
    category: 'Traditional SEO - Keyword Research',
    difficulty: 'medium',
    description: 'Tests search intent analysis and PAA extraction'
  },
  {
    id: 4,
    question: "Compare the keyword 'SEO tools' vs 'keyword research tools' - which has better opportunity for a new SaaS product?",
    expectedTools: ['keywords_data_google_ads_search_volume', 'labs_keyword_suggestions'],
    category: 'Traditional SEO - Keyword Research',
    difficulty: 'medium',
    description: 'Tests keyword comparison and opportunity analysis'
  },

  // ============================================
  // Category 2: Traditional SEO - SERP Analysis (3 questions)
  // ============================================
  {
    id: 5,
    question: "Show me who's ranking on page 1 for 'AI writing assistant' and what their domain authority looks like.",
    expectedTools: ['serp_google_organic_live_advanced', 'backlinks_domain_pages_summary'],
    category: 'Traditional SEO - SERP Analysis',
    difficulty: 'medium',
    description: 'Tests SERP analysis and domain metrics'
  },
  {
    id: 6,
    question: "What keywords does jasper.ai rank for that ahrefs.com doesn't? Find the keyword gaps.",
    expectedTools: ['labs_domain_intersection', 'backlinks_domain_pages_summary'],
    category: 'Traditional SEO - SERP Analysis',
    difficulty: 'hard',
    description: 'Tests competitor keyword gap analysis'
  },
  {
    id: 7,
    question: "Analyze the featured snippets for 'how to improve SEO' - who owns them and what format are they?",
    expectedTools: ['serp_google_organic_live_advanced'],
    category: 'Traditional SEO - SERP Analysis',
    difficulty: 'medium',
    description: 'Tests featured snippet analysis'
  },

  // ============================================
  // Category 3: Traditional SEO - Technical Audit (3 questions)
  // ============================================
  {
    id: 8,
    question: "Run a technical SEO audit on https://example.com and identify any critical issues like broken links, missing meta tags, or page speed problems.",
    expectedTools: ['onpage_lighthouse', 'onpage_page_raw', 'jina_crawl_page'],
    category: 'Traditional SEO - Technical Audit',
    difficulty: 'hard',
    description: 'Tests comprehensive technical audit workflow'
  },
  {
    id: 9,
    question: "Check if https://mysite.com is mobile-friendly and identify any Core Web Vitals issues.",
    expectedTools: ['onpage_lighthouse', 'onpage_page_raw'],
    category: 'Traditional SEO - Technical Audit',
    difficulty: 'medium',
    description: 'Tests mobile and CWV analysis'
  },
  {
    id: 10,
    question: "Crawl https://example.com/blog and extract all the headings, meta descriptions, and internal links.",
    expectedTools: ['jina_crawl_page', 'onpage_page_raw'],
    category: 'Traditional SEO - Technical Audit',
    difficulty: 'easy',
    description: 'Tests page crawling and content extraction'
  },

  // ============================================
  // Category 4: Traditional SEO - Backlinks (2 questions)
  // ============================================
  {
    id: 11,
    question: "Analyze the backlink profile for hubspot.com. What are their top referring domains and anchor text distribution?",
    expectedTools: ['backlinks_backlinks', 'backlinks_referring_domains', 'backlinks_anchors'],
    category: 'Traditional SEO - Backlinks',
    difficulty: 'medium',
    description: 'Tests backlink profile analysis'
  },
  {
    id: 12,
    question: "Find toxic or spammy backlinks pointing to my competitor's site that I should avoid replicating.",
    expectedTools: ['backlinks_backlinks', 'backlinks_domain_pages_summary'],
    category: 'Traditional SEO - Backlinks',
    difficulty: 'hard',
    description: 'Tests toxic backlink detection'
  },

  // ============================================
  // Category 5: AEO - Citation Analysis (3 questions)
  // ============================================
  {
    id: 13,
    question: "Analyze what content gets cited by AI platforms for 'email marketing best practices' and identify citation opportunities for my brand.",
    expectedTools: ['ai_optimization_llm_responses', 'ai_optimization_llm_mentions'],
    category: 'AEO - Citation Analysis',
    difficulty: 'hard',
    description: 'Tests AI citation analysis and opportunity detection'
  },
  {
    id: 14,
    question: "How often is my brand 'Acme Corp' mentioned in ChatGPT and Perplexity responses? Track my AI visibility.",
    expectedTools: ['ai_optimization_llm_mentions', 'ai_optimization_llm_responses'],
    category: 'AEO - Citation Analysis',
    difficulty: 'medium',
    description: 'Tests brand mention tracking in AI responses'
  },
  {
    id: 15,
    question: "What sources does Perplexity cite when answering questions about 'content marketing ROI'? I want to get cited there.",
    expectedTools: ['ai_optimization_llm_responses', 'ai_optimization_llm_mentions'],
    category: 'AEO - Citation Analysis',
    difficulty: 'medium',
    description: 'Tests AI source citation analysis'
  },

  // ============================================
  // Category 6: AEO - Platform Optimization (2 questions)
  // ============================================
  {
    id: 16,
    question: "How do I optimize my content differently for ChatGPT vs Perplexity vs Claude? What are the platform-specific best practices?",
    expectedTools: ['ai_optimization_llm_responses', 'perplexity_search'],
    category: 'AEO - Platform Optimization',
    difficulty: 'medium',
    description: 'Tests multi-platform AEO optimization guidance'
  },
  {
    id: 17,
    question: "What makes content more likely to be cited by AI answer engines? Give me specific structural and content recommendations.",
    expectedTools: ['ai_optimization_llm_responses', 'perplexity_search'],
    category: 'AEO - Platform Optimization',
    difficulty: 'medium',
    description: 'Tests AEO best practices guidance'
  },

  // ============================================
  // Category 7: AEO - EEAT Signals (2 questions)
  // ============================================
  {
    id: 18,
    question: "Check if my article at https://mysite.com/blog/saas-pricing-guide has strong EEAT signals. What's missing for AI platform credibility?",
    expectedTools: ['jina_crawl_page', 'ai_optimization_llm_responses'],
    category: 'AEO - EEAT Signals',
    difficulty: 'hard',
    description: 'Tests EEAT signal detection and analysis'
  },
  {
    id: 19,
    question: "How can I add more author authority and trust signals to my content about 'medical device regulations'?",
    expectedTools: ['perplexity_search', 'ai_optimization_llm_responses'],
    category: 'AEO - EEAT Signals',
    difficulty: 'medium',
    description: 'Tests EEAT enhancement recommendations'
  },

  // ============================================
  // Category 8: Multi-Step Workflows (1 question)
  // ============================================
  {
    id: 20,
    question: "Run a complete SEO and AEO audit on my site https://example.com. I want keyword opportunities, technical issues, backlink analysis, and AI visibility assessment.",
    expectedTools: [
      'onpage_lighthouse',
      'backlinks_backlinks',
      'labs_keyword_suggestions',
      'ai_optimization_llm_responses',
      'jina_crawl_page'
    ],
    category: 'Multi-Step Workflows',
    difficulty: 'hard',
    description: 'Tests comprehensive multi-tool workflow orchestration'
  }
]

/**
 * Get questions by category
 */
export function getQuestionsByCategory(): Record<string, TestQuestion[]> {
  return testQuestions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = []
    acc[q.category].push(q)
    return acc
  }, {} as Record<string, TestQuestion[]>)
}

/**
 * Get questions by difficulty
 */
export function getQuestionsByDifficulty(): Record<string, TestQuestion[]> {
  return testQuestions.reduce((acc, q) => {
    if (!acc[q.difficulty]) acc[q.difficulty] = []
    acc[q.difficulty].push(q)
    return acc
  }, {} as Record<string, TestQuestion[]>)
}

/**
 * Get all expected tools across all questions
 */
export function getAllExpectedTools(): string[] {
  const tools = new Set<string>()
  testQuestions.forEach(q => q.expectedTools.forEach(t => tools.add(t)))
  return Array.from(tools).sort()
}

/**
 * Filter questions by IDs
 */
export function filterQuestions(ids: number[]): TestQuestion[] {
  return testQuestions.filter(q => ids.includes(q.id))
}
