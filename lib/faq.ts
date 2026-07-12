import { FLOWINTENT_ELEVATOR_PITCH } from '@/lib/product/elevator-pitch'

export type FaqLink = { label: string; href: string }
export type FaqItem = { q: string; a: string; links?: FaqLink[] }
export type FaqSection = { category: string; questions: FaqItem[] }

export const faqSections: FaqSection[] = [
  {
    category: 'LLM Mentions & Citations',
    questions: [
      {
        q: 'What are "LLM mentions" and "citations"?',
        a: 'A mention is when an AI assistant references your brand in its answer. A citation is when it links to your site as a source. Citations are ideal, but consistent mentions also build recall and preference.',
      },
      {
        q: 'Why do LLM mentions matter for growth?',
        a: 'AI answers are often zero-click. The winner is the brand named and cited in the response. Mentions influence trust, shortlist inclusion, and downstream conversions even when users never visit a SERP.',
      },
      {
        q: 'How do you measure mentions if there is no global counter?',
        a: 'You run a repeatable set of prompts by topic and intent, record who gets mentioned or cited, and track deltas over time. The goal is consistent improvement, not a perfect absolute number.',
      },
      {
        q: 'Where can I learn the full strategy?',
        a: 'Start with the guide, then run an AI Trust Audit to establish your baseline and prioritize fixes.',
        links: [
          { label: 'Read the blog', href: '/blog' },
          { label: 'Run an audit', href: '/audit' },
        ],
      },
    ],
  },
  {
    category: 'Answer Engine Optimization',
    questions: [
      {
        q: 'What is Answer Engine Optimization (AEO)?',
        a: 'Answer Engine Optimization is the practice of optimizing content to rank in AI-powered answer engines like ChatGPT, Perplexity, Claude, and Google Gemini. Unlike traditional SEO, AEO is about becoming the source AI systems cite when they answer questions.',
      },
      {
        q: 'How is AEO different from traditional SEO?',
        a: 'Traditional SEO focuses on ranking in search results pages to drive clicks and traffic. AEO focuses on being the cited source in AI-generated answers, which requires clearer structure, stronger entity signals, and more obvious EEAT markers.',
      },
      {
        q: 'Why do I need AEO if I already do SEO?',
        a: 'AI answer engines and Google AI Overviews are changing discovery behavior. More searches now end in an on-platform answer instead of a click, so strong Google rankings alone no longer guarantee visibility.',
      },
    ],
  },
  {
    category: 'Platform Modes',
    questions: [
      {
        q: 'What are SEO Mode, GEO / AEO Mode, Content Mode, and Social Mode?',
        a: 'FlowIntent runs four AI SDK 7 chat modes inside the paywalled dashboard. SEO Mode handles keyword research, SERP analysis, backlinks, and technical SEO with live DataForSEO data. GEO / AEO Mode covers generative and answer-engine optimization—whether ChatGPT, Perplexity, or Google AI Overviews mention or cite your brand (more engines as we scale). Content Mode is research-first publishing: drafts, hero images, thumbnails, and metadata saved to your workspace. Social Mode researches X/Twitter, Reddit, and social-web conversations for brand mentions, competitor reactions, audience pain points, and trend signals.',
      },
      {
        q: 'When should I use each mode?',
        a: 'Use SEO Mode for rankings data, competitor gaps, and technical SEO. Use GEO / AEO Mode when you care how AI answer engines talk about your brand versus competitors. Use Content Mode when you are ready to publish. Use Social Mode to understand conversations, audience pain points, and trend signals. A common path is SEO discover → GEO / AEO measure → Content publish, but you can use any mode in any order.',
      },
      {
        q: 'What are artifacts and workspace?',
        a: 'Artifacts are structured UI panels from AI SDK 7 tool calls in chat—keyword metrics, backlink tables, GEO visibility snapshots, content previews, and more. Any mode can produce them. Workspace is where you keep saved artifacts and library items (posts, briefs, exports) after the chat. Start with the free Reddit content gap audit; the full chat, artifacts, and workspace are in the paywalled dashboard.',
        links: [
          { label: 'Try Reddit audit', href: '/reddit-gap' },
          { label: 'Sign up', href: '/sign-up' },
        ],
      },
      {
        q: 'Why four modes instead of one chat?',
        a: 'SEO, GEO / AEO, content creation, and social intelligence need different tools and memory. Modes keep SEO questions from pulling GEO context (and vice versa) so answers stay accurate. FlowIntent began as DataForSEO-powered SEO chat; the current runtime uses AI SDK 7 across the SEO, GEO / AEO, Content, and Social lanes.',
      },
    ],
  },
  {
    category: 'FlowIntent Platform',
    questions: [
      {
        q: 'What does FlowIntent do?',
        a: FLOWINTENT_ELEVATOR_PITCH,
      },
      {
        q: 'What is an AI Trust Audit?',
        a: 'An AI Trust Audit shows how AI systems like ChatGPT and Perplexity currently represent your brand, products, and services. It surfaces hallucinations, gaps, and inaccurate claims so you can fix them before they hurt trust.',
      },
      {
        q: 'How does FlowIntent optimize content?',
        a: 'FlowIntent uses specialized AI agents plus 70+ DataForSEO endpoints to evaluate EEAT signals, identify content gaps, and improve pages so they perform in both Google and AI answer engines.',
      },
      {
        q: 'Do I need technical skills to use FlowIntent?',
        a: 'No. The product is designed for marketers, content teams, and founders. The interface is conversational, so you can run audits, research opportunities, and improve content without needing technical SEO expertise.',
      },
    ],
  },
  {
    category: 'Pricing & Plans',
    questions: [
      {
        q: 'How much does FlowIntent cost?',
        a: 'FlowIntent currently offers free beta access with usage limits. A paid Pro plan is planned with higher limits, priority support, and more advanced features. Enterprise options are available on request.',
      },
      {
        q: 'What happens when I hit my beta usage limit?',
        a: 'When you reach the beta limit, your account is paused for a short cooldown. If you need more capacity, email liam@flowintent.com and we can help.',
      },
      {
        q: 'Can I upgrade from the free beta?',
        a: 'Yes. Email liam@flowintent.com to discuss Pro or Enterprise access if you need higher limits or a custom setup.',
      },
    ],
  },
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I get started with FlowIntent?',
        a: 'Start with an AI Trust Audit. Enter your brand or website and FlowIntent will show how AI systems currently describe you. From there, you can move into content optimization, competitor analysis, and AEO strategy.',
      },
      {
        q: 'What data sources does FlowIntent use?',
        a: 'FlowIntent uses DataForSEO for SERP, keyword, and competitive data, plus live AI-search analysis and an internal EEAT scoring layer. The output is research-backed rather than generic AI copy.',
      },
      {
        q: 'Can FlowIntent help with my existing content?',
        a: 'Yes. It can audit and improve existing pages to strengthen structure, EEAT signals, and AI citation potential while still supporting traditional search performance.',
      },
    ],
  },
]

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqSections.flatMap((section) =>
    section.questions.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  ),
}
