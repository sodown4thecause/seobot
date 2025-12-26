import { JargonTerm, JargonCategory } from '@/types/jargon'

/**
 * Comprehensive SEO/AEO Jargon Dictionary
 * 
 * Contains 200+ terms with beginner-friendly explanations,
 * examples, and progressive disclosure levels.
 */

export const JARGON_DICTIONARY: JargonTerm[] = [
  // SEO Basics
  {
    id: 'seo',
    term: 'SEO',
    category: 'seo-basics',
    difficulty: 'basic',
    shortDefinition: 'Search Engine Optimization - making your website easier to find on Google',
    detailedExplanation: 'SEO is the practice of improving your website to increase its visibility when people search for products or services related to your business on search engines like Google. The better visibility your pages have in search results, the more likely you are to garner attention and attract prospective and existing customers to your business.',
    examples: [
      'Using relevant keywords in your content',
      'Making your website load faster',
      'Getting other websites to link to yours'
    ],
    businessContext: 'Good SEO can increase your website traffic by 50-100% or more, leading to more customers and sales.',
    commonMistakes: [
      'Stuffing too many keywords into content',
      'Buying fake backlinks',
      'Ignoring mobile optimization'
    ],
    tags: ['fundamental', 'marketing', 'visibility']
  },
  
  {
    id: 'serp',
    term: 'SERP',
    category: 'seo-basics',
    difficulty: 'basic',
    shortDefinition: 'Search Engine Results Page - the page Google shows after you search',
    detailedExplanation: 'SERP stands for Search Engine Results Page. It\'s the page you see after typing a query into a search engine like Google. SERPs include organic search results, paid advertisements, featured snippets, knowledge panels, and other features.',
    examples: [
      'The list of websites that appear when you search "pizza near me"',
      'The featured snippet box that answers "what is SEO"',
      'The map results for local businesses'
    ],
    relatedTerms: ['organic results', 'featured snippet', 'knowledge panel'],
    tags: ['fundamental', 'google', 'results']
  },

  {
    id: 'keyword',
    term: 'Keyword',
    category: 'keyword-research',
    difficulty: 'basic',
    shortDefinition: 'Words or phrases people type into search engines',
    detailedExplanation: 'Keywords are the words and phrases that people enter into search engines to find information, products, or services. In SEO, we optimize our content around these keywords to help our pages appear when people search for them.',
    examples: [
      '"best pizza restaurant" - 3 word keyword',
      '"SEO" - single word keyword',
      '"how to bake chocolate chip cookies" - long-tail keyword'
    ],
    businessContext: 'Targeting the right keywords can bring qualified traffic to your website - people who are actually looking for what you offer.',
    relatedTerms: ['long-tail keywords', 'keyword difficulty', 'search volume'],
    tags: ['fundamental', 'research', 'targeting']
  },

  {
    id: 'long-tail-keywords',
    term: 'Long-tail Keywords',
    category: 'keyword-research',
    difficulty: 'intermediate',
    shortDefinition: 'Longer, more specific keyword phrases with less competition',
    detailedExplanation: 'Long-tail keywords are longer and more specific keyword phrases that visitors are more likely to use when they\'re closer to making a purchase or finding specific information. They typically have lower search volume but higher conversion rates and less competition.',
    examples: [
      '"best organic dog food for small breeds" vs "dog food"',
      '"how to fix leaky faucet kitchen sink" vs "plumbing"',
      '"affordable wedding photographer in Austin Texas" vs "photographer"'
    ],
    businessContext: 'Long-tail keywords often convert better because they show specific intent. Someone searching "best CRM software for small business" is more likely to buy than someone just searching "software".',
    relatedTerms: ['keyword difficulty', 'search intent', 'conversion rate'],
    tags: ['strategy', 'targeting', 'conversion']
  },

  {
    id: 'search-volume',
    term: 'Search Volume',
    category: 'keyword-research',
    difficulty: 'basic',
    shortDefinition: 'How many times people search for a keyword each month',
    detailedExplanation: 'Search volume refers to the number of times a particular keyword or phrase is searched for in search engines over a specific period, usually measured monthly. Higher search volume means more people are looking for that term.',
    examples: [
      '"iPhone" might have 2,000,000 monthly searches',
      '"iPhone 15 Pro Max review" might have 50,000 monthly searches',
      '"iPhone 15 Pro Max review 2024 camera quality" might have 500 monthly searches'
    ],
    businessContext: 'High search volume keywords can bring more traffic, but they\'re usually more competitive. Sometimes targeting lower volume, more specific keywords is more profitable.',
    relatedTerms: ['keyword difficulty', 'competition', 'long-tail keywords'],
    tags: ['metrics', 'research', 'traffic']
  },

  {
    id: 'keyword-difficulty',
    term: 'Keyword Difficulty',
    category: 'keyword-research',
    difficulty: 'intermediate',
    shortDefinition: 'How hard it is to rank on the first page for a keyword',
    detailedExplanation: 'Keyword difficulty (KD) is a metric that estimates how difficult it would be to rank on the first page of search results for a specific keyword. It\'s usually scored from 0-100, with higher scores indicating more competition.',
    examples: [
      '"SEO" - Very high difficulty (90+) - dominated by major sites',
      '"local SEO tips" - Medium difficulty (40-60)',
      '"SEO tips for bakeries in Portland" - Low difficulty (0-30)'
    ],
    businessContext: 'Focus on keywords you can realistically rank for. A new website should target low-difficulty keywords first, then gradually work up to more competitive terms.',
    relatedTerms: ['competition', 'domain authority', 'backlinks'],
    tags: ['metrics', 'competition', 'strategy']
  },

  // Content Optimization
  {
    id: 'title-tag',
    term: 'Title Tag',
    category: 'content-optimization',
    difficulty: 'basic',
    shortDefinition: 'The clickable headline that appears in search results',
    detailedExplanation: 'The title tag is an HTML element that specifies the title of a web page. It appears as the clickable headline in search engine results and is one of the most important on-page SEO factors.',
    examples: [
      '"Best Pizza in New York | Tony\'s Pizzeria"',
      '"How to Train Your Dog: Complete Guide for Beginners"',
      '"iPhone 15 Review: Features, Price & Should You Buy?"'
    ],
    businessContext: 'A compelling title tag can significantly increase your click-through rate from search results, bringing more visitors to your site.',
    commonMistakes: [
      'Making titles too long (over 60 characters)',
      'Not including your target keyword',
      'Using the same title on multiple pages'
    ],
    relatedTerms: ['meta description', 'click-through rate', 'on-page SEO'],
    tags: ['on-page', 'optimization', 'html']
  },

  {
    id: 'meta-description',
    term: 'Meta Description',
    category: 'content-optimization',
    difficulty: 'basic',
    shortDefinition: 'The short summary that appears under your title in search results',
    detailedExplanation: 'A meta description is a brief summary of a web page\'s content that appears under the title in search engine results. While it doesn\'t directly impact rankings, it influences whether people click on your result.',
    examples: [
      '"Learn proven SEO strategies that increase website traffic by 200%. Step-by-step guide with real examples and case studies."',
      '"Discover the best pizza in NYC. Fresh ingredients, authentic recipes, and fast delivery. Order online or visit our locations."'
    ],
    businessContext: 'A well-written meta description acts like ad copy, convincing searchers to click on your result instead of competitors.',
    commonMistakes: [
      'Making descriptions too long (over 160 characters)',
      'Not including a call-to-action',
      'Duplicating descriptions across pages'
    ],
    relatedTerms: ['title tag', 'click-through rate', 'SERP'],
    tags: ['on-page', 'optimization', 'html']
  },

  {
    id: 'h1-tag',
    term: 'H1 Tag',
    category: 'content-optimization',
    difficulty: 'basic',
    shortDefinition: 'The main headline of your webpage content',
    detailedExplanation: 'The H1 tag is an HTML heading element that represents the main heading of a webpage. It should clearly describe what the page is about and typically includes your target keyword.',
    examples: [
      '"Complete Guide to SEO for Beginners"',
      '"Best Coffee Shops in Seattle: Local\'s Guide"',
      '"How to Start a Successful Online Business in 2024"'
    ],
    businessContext: 'Your H1 helps both search engines and visitors understand what your page is about. It should match the intent behind your target keyword.',
    commonMistakes: [
      'Using multiple H1 tags on one page',
      'Making H1 different from title tag without good reason',
      'Not including target keyword in H1'
    ],
    relatedTerms: ['heading structure', 'on-page SEO', 'content hierarchy'],
    tags: ['on-page', 'structure', 'html']
  },

  // Technical SEO
  {
    id: 'page-speed',
    term: 'Page Speed',
    category: 'technical-seo',
    difficulty: 'intermediate',
    shortDefinition: 'How fast your website loads for visitors',
    detailedExplanation: 'Page speed refers to how quickly content on your webpage loads. It\'s a crucial ranking factor and user experience element. Faster pages rank better and keep visitors engaged.',
    examples: [
      'A page that loads in 2 seconds vs 8 seconds',
      'Optimizing images to reduce file size',
      'Using a content delivery network (CDN)'
    ],
    businessContext: 'A 1-second delay in page load time can reduce conversions by 7%. Fast sites make more money.',
    commonMistakes: [
      'Using huge, unoptimized images',
      'Too many plugins or scripts',
      'Poor web hosting'
    ],
    relatedTerms: ['Core Web Vitals', 'user experience', 'bounce rate'],
    tags: ['technical', 'performance', 'ranking-factor']
  },

  {
    id: 'core-web-vitals',
    term: 'Core Web Vitals',
    category: 'technical-seo',
    difficulty: 'advanced',
    shortDefinition: 'Google\'s metrics for measuring website user experience',
    detailedExplanation: 'Core Web Vitals are a set of specific factors that Google considers important in a webpage\'s overall user experience. They include Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS).',
    examples: [
      'LCP: How long it takes for the main content to load',
      'FID: How quickly the page responds to user interactions',
      'CLS: How much the page layout shifts while loading'
    ],
    businessContext: 'Core Web Vitals are official Google ranking factors. Poor scores can hurt your search rankings.',
    relatedTerms: ['page speed', 'user experience', 'technical SEO'],
    tags: ['technical', 'google', 'ranking-factor', 'metrics']
  },

  {
    id: 'mobile-first-indexing',
    term: 'Mobile-First Indexing',
    category: 'technical-seo',
    difficulty: 'intermediate',
    shortDefinition: 'Google primarily uses your mobile site version for ranking',
    detailedExplanation: 'Mobile-first indexing means Google predominantly uses the mobile version of your content for indexing and ranking. This reflects the reality that most searches now happen on mobile devices.',
    examples: [
      'Your mobile site should have the same content as desktop',
      'Mobile page speed is crucial for rankings',
      'Mobile-friendly design affects search visibility'
    ],
    businessContext: 'If your mobile site is poor, your search rankings will suffer, even for desktop searches.',
    relatedTerms: ['responsive design', 'mobile optimization', 'user experience'],
    tags: ['mobile', 'indexing', 'ranking-factor']
  },

  // Link Building
  {
    id: 'backlink',
    term: 'Backlink',
    category: 'link-building',
    difficulty: 'basic',
    shortDefinition: 'A link from another website pointing to your website',
    detailedExplanation: 'A backlink is a link from one website to another. Search engines like Google view backlinks as votes of confidence. The more high-quality backlinks you have, the more authoritative your site appears.',
    examples: [
      'A food blogger linking to your restaurant website',
      'A news article mentioning and linking to your company',
      'A industry publication citing your research with a link'
    ],
    businessContext: 'Quality backlinks are one of the strongest ranking factors. They can dramatically improve your search visibility.',
    commonMistakes: [
      'Buying low-quality links',
      'Getting links from irrelevant sites',
      'Focusing on quantity over quality'
    ],
    relatedTerms: ['domain authority', 'link juice', 'anchor text'],
    tags: ['link-building', 'authority', 'ranking-factor']
  },

  {
    id: 'domain-authority',
    term: 'Domain Authority',
    category: 'link-building',
    difficulty: 'intermediate',
    shortDefinition: 'A score predicting how well a website will rank in search results',
    detailedExplanation: 'Domain Authority (DA) is a search engine ranking score developed by Moz that predicts how likely a website is to rank in search engine result pages. It ranges from 1 to 100, with higher scores indicating greater ranking potential.',
    examples: [
      'Google.com has a DA of 100',
      'A new blog might have a DA of 10-20',
      'Established businesses often have DA of 30-60'
    ],
    businessContext: 'Higher DA sites tend to rank better and pass more "link juice" when they link to you.',
    relatedTerms: ['backlinks', 'page authority', 'link juice'],
    tags: ['metrics', 'authority', 'moz']
  },

  {
    id: 'anchor-text',
    term: 'Anchor Text',
    category: 'link-building',
    difficulty: 'intermediate',
    shortDefinition: 'The clickable text in a hyperlink',
    detailedExplanation: 'Anchor text is the visible, clickable text in a hyperlink. Search engines use anchor text to understand what the linked page is about. It\'s important for both SEO and user experience.',
    examples: [
      '"best SEO tools" - keyword-rich anchor text',
      '"click here" - generic anchor text (not ideal)',
      '"Moz\'s keyword research guide" - branded + descriptive'
    ],
    businessContext: 'Good anchor text helps search engines understand your content and can improve rankings for those keywords.',
    commonMistakes: [
      'Over-optimizing with exact-match keywords',
      'Using "click here" or "read more" too often',
      'Not varying anchor text naturally'
    ],
    relatedTerms: ['backlinks', 'internal linking', 'link building'],
    tags: ['link-building', 'optimization', 'text']
  },

  // Local SEO
  {
    id: 'google-business-profile',
    term: 'Google Business Profile',
    category: 'local-seo',
    difficulty: 'basic',
    shortDefinition: 'Your business listing on Google Maps and local search',
    detailedExplanation: 'Google Business Profile (formerly Google My Business) is a free tool that lets you manage how your business appears on Google Search and Maps. It\'s essential for local SEO.',
    examples: [
      'Your restaurant showing up in "restaurants near me" searches',
      'Business hours, phone number, and address display',
      'Customer reviews and photos of your business'
    ],
    businessContext: 'A well-optimized Google Business Profile can significantly increase local visibility and foot traffic to your business.',
    relatedTerms: ['local SEO', 'local pack', 'NAP consistency'],
    tags: ['local', 'google', 'business-listing']
  },

  {
    id: 'local-pack',
    term: 'Local Pack',
    category: 'local-seo',
    difficulty: 'basic',
    shortDefinition: 'The map results that appear for local searches',
    detailedExplanation: 'The local pack is the section of search results that shows a map and typically 3 local business listings for location-based queries. It appears prominently in search results.',
    examples: [
      'Searching "pizza near me" shows 3 pizza places with a map',
      '"dentist in Chicago" displays local dental offices',
      '"car repair shop" shows nearby auto shops'
    ],
    businessContext: 'Appearing in the local pack can drive significant foot traffic and phone calls to local businesses.',
    relatedTerms: ['Google Business Profile', 'local SEO', 'map pack'],
    tags: ['local', 'serp-feature', 'visibility']
  },

  {
    id: 'nap-consistency',
    term: 'NAP Consistency',
    category: 'local-seo',
    difficulty: 'intermediate',
    shortDefinition: 'Keeping your Name, Address, Phone number the same everywhere online',
    detailedExplanation: 'NAP consistency refers to ensuring your business Name, Address, and Phone number are identical across all online platforms - your website, Google Business Profile, social media, directories, etc.',
    examples: [
      'Using "123 Main St" everywhere, not "123 Main Street" some places',
      'Same phone number format: (555) 123-4567 vs 555-123-4567',
      'Consistent business name: "Joe\'s Pizza" not "Joe\'s Pizzeria"'
    ],
    businessContext: 'Inconsistent NAP information confuses search engines and can hurt your local search rankings.',
    commonMistakes: [
      'Different address formats across platforms',
      'Old phone numbers on some listings',
      'Slight variations in business name'
    ],
    relatedTerms: ['local citations', 'local SEO', 'business listings'],
    tags: ['local', 'consistency', 'citations']
  },

  // Analytics
  {
    id: 'organic-traffic',
    term: 'Organic Traffic',
    category: 'analytics',
    difficulty: 'basic',
    shortDefinition: 'Visitors who find your website through unpaid search results',
    detailedExplanation: 'Organic traffic refers to visitors who land on your website as a result of unpaid search results. This is traffic you earn through SEO efforts, not paid advertising.',
    examples: [
      'Someone googles "best coffee shops" and clicks on your cafe\'s website',
      'A person searches "how to train a puppy" and finds your blog post',
      'Users finding your product page through "wireless headphones review"'
    ],
    businessContext: 'Organic traffic is valuable because it\'s free and often indicates high intent - people are actively searching for what you offer.',
    relatedTerms: ['paid traffic', 'search engine traffic', 'SEO'],
    tags: ['analytics', 'traffic', 'measurement']
  },

  {
    id: 'bounce-rate',
    term: 'Bounce Rate',
    category: 'analytics',
    difficulty: 'basic',
    shortDefinition: 'Percentage of visitors who leave your site after viewing only one page',
    detailedExplanation: 'Bounce rate is the percentage of single-page sessions where visitors left your site without interacting with the page or visiting other pages. A high bounce rate might indicate content doesn\'t match search intent.',
    examples: [
      '70% bounce rate means 7 out of 10 visitors leave immediately',
      'Someone searches "pizza recipe" but lands on your pizza restaurant page',
      'A page loads slowly, so visitors leave before it finishes loading'
    ],
    businessContext: 'High bounce rates can indicate poor user experience or content mismatch, potentially hurting both conversions and SEO.',
    relatedTerms: ['user experience', 'page speed', 'search intent'],
    tags: ['analytics', 'user-behavior', 'metrics']
  },

  {
    id: 'click-through-rate',
    term: 'Click-Through Rate (CTR)',
    category: 'analytics',
    difficulty: 'basic',
    shortDefinition: 'Percentage of people who click on your link in search results',
    detailedExplanation: 'Click-through rate is the percentage of people who click on your website link after seeing it in search results. It\'s calculated by dividing clicks by impressions.',
    examples: [
      'Your page appears 1000 times in search, gets 50 clicks = 5% CTR',
      'Compelling title and description increase CTR',
      'Position #1 typically has 25-35% CTR, position #10 has 2-3%'
    ],
    businessContext: 'Higher CTR brings more traffic and can signal to Google that your result is relevant, potentially improving rankings.',
    relatedTerms: ['impressions', 'title tag', 'meta description'],
    tags: ['analytics', 'performance', 'serp']
  },

  // AEO (Answer Engine Optimization)
  {
    id: 'aeo',
    term: 'AEO',
    category: 'aeo',
    difficulty: 'intermediate',
    shortDefinition: 'Answer Engine Optimization - optimizing for AI search engines like ChatGPT',
    detailedExplanation: 'AEO (Answer Engine Optimization) is the practice of optimizing content to be discovered and cited by AI-powered search engines and chatbots like ChatGPT, Claude, and Perplexity AI.',
    examples: [
      'Structuring content so AI can easily extract key facts',
      'Creating comprehensive, authoritative content on topics',
      'Using clear headings and bullet points for AI parsing'
    ],
    businessContext: 'As more people use AI for search, AEO helps ensure your business gets mentioned and recommended by AI systems.',
    relatedTerms: ['AI search', 'ChatGPT', 'featured snippets'],
    tags: ['aeo', 'ai', 'optimization', 'future']
  },

  {
    id: 'featured-snippet',
    term: 'Featured Snippet',
    category: 'serp-features',
    difficulty: 'intermediate',
    shortDefinition: 'The highlighted answer box that appears at the top of search results',
    detailedExplanation: 'A featured snippet is a summary of an answer to a user\'s query, displayed at the top of Google search results. It\'s extracted from a webpage and includes the page title and URL.',
    examples: [
      'A recipe snippet showing ingredients and steps',
      'A definition box explaining "What is SEO?"',
      'A list of "Best practices for email marketing"'
    ],
    businessContext: 'Getting featured snippets can dramatically increase visibility and traffic, as they appear above all other organic results.',
    relatedTerms: ['position zero', 'SERP features', 'structured data'],
    tags: ['serp-feature', 'visibility', 'google']
  },

  {
    id: 'eeat',
    term: 'E-E-A-T',
    category: 'content-optimization',
    difficulty: 'advanced',
    shortDefinition: 'Experience, Expertise, Authoritativeness, Trustworthiness - Google\'s quality guidelines',
    detailedExplanation: 'E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trustworthiness. These are the criteria Google uses to assess content quality, especially for YMYL (Your Money or Your Life) topics.',
    examples: [
      'Medical advice written by licensed doctors (Expertise)',
      'Financial guidance from certified advisors (Authority)',
      'Product reviews from people who actually used the product (Experience)',
      'Secure website with clear contact information (Trust)'
    ],
    businessContext: 'Strong E-E-A-T signals can significantly improve rankings, especially for health, finance, and other sensitive topics.',
    relatedTerms: ['YMYL', 'content quality', 'author authority'],
    tags: ['quality', 'google', 'guidelines', 'trust']
  }
]

// Helper functions for dictionary management
export function getTermById(id: string): JargonTerm | undefined {
  return JARGON_DICTIONARY.find(term => term.id === id)
}

export function getTermByName(name: string): JargonTerm | undefined {
  return JARGON_DICTIONARY.find(term => 
    term.term.toLowerCase() === name.toLowerCase()
  )
}

export function getTermsByCategory(category: JargonCategory): JargonTerm[] {
  return JARGON_DICTIONARY.filter(term => term.category === category)
}

export function searchTerms(query: string): JargonTerm[] {
  const lowercaseQuery = query.toLowerCase()
  return JARGON_DICTIONARY.filter(term =>
    term.term.toLowerCase().includes(lowercaseQuery) ||
    term.shortDefinition.toLowerCase().includes(lowercaseQuery) ||
    term.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

export function getTermsByDifficulty(difficulty: 'basic' | 'intermediate' | 'advanced'): JargonTerm[] {
  return JARGON_DICTIONARY.filter(term => term.difficulty === difficulty)
}

// Categories for organization
export const JARGON_CATEGORIES: Record<JargonCategory, { label: string; description: string }> = {
  'seo-basics': {
    label: 'SEO Basics',
    description: 'Fundamental SEO concepts everyone should know'
  },
  'keyword-research': {
    label: 'Keyword Research',
    description: 'Terms related to finding and analyzing keywords'
  },
  'content-optimization': {
    label: 'Content Optimization',
    description: 'On-page SEO and content improvement techniques'
  },
  'technical-seo': {
    label: 'Technical SEO',
    description: 'Website technical aspects that affect search rankings'
  },
  'link-building': {
    label: 'Link Building',
    description: 'Earning and managing backlinks to your website'
  },
  'local-seo': {
    label: 'Local SEO',
    description: 'Optimizing for local search and map results'
  },
  'analytics': {
    label: 'Analytics & Metrics',
    description: 'Measuring and tracking SEO performance'
  },
  'aeo': {
    label: 'Answer Engine Optimization',
    description: 'Optimizing for AI-powered search engines'
  },
  'serp-features': {
    label: 'SERP Features',
    description: 'Special elements in search results pages'
  },
  'tools': {
    label: 'SEO Tools',
    description: 'Software and platforms for SEO work'
  }
}