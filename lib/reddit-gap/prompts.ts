import type { SubredditDiscovery, ThreadAnalysis, ContentGap } from './types'

export function buildSubredditDiscoveryPrompt(topic: string): string {
  return `You are a Reddit community research expert. Given the topic "${topic}", identify which subreddits are most relevant for content gap analysis.

Consider:
- Communities where people actively ask questions about this topic
- Subreddits with high engagement rates (comments per post)
- Communities where buying intent discussions happen
- Both mainstream and niche subreddits

Return a JSON array of subreddit names ranked by relevance, e.g.:
["webdev", "SEO", "entrepreneur", "smallbusiness"]`
}

export function buildGapAnalysisPrompt(
  topic: string,
  threads: ThreadAnalysis[],
  subreddits: SubredditDiscovery[]
): string {
  const threadSummaries = threads
    .slice(0, 30)
    .map((t) => {
      const questions = t.questions
        .slice(0, 5)
        .map((q) => `- "${q.question}" (${q.upvotes} upvotes)`)
        .join('\n')
      return `Thread: "${t.title}" (r/${t.subreddit}, ${t.score} upvotes, ${t.numComments} comments)
Questions found:
${questions}`
    })
    .join('\n\n')

  const subredditList = subreddits
    .map((s) => `r/${s.name} (${s.subscribers} subscribers, relevance: ${s.relevanceScore}/100)`)
    .join(', ')

  return `You are a content strategy expert specializing in SEO and audience research.

TOPIC: "${topic}"

SUBREDDITS ANALYZED: ${subredditList}

REDDIT THREADS ANALYZED:
${threadSummaries}

Based on the Reddit discussions above, identify the TOP 5-8 specific content gaps — questions people are asking that competitors are NOT adequately answering.

For EACH content gap, provide:
1. "question": The exact question users are asking (in their words)
2. "context": Brief context about why this matters (1-2 sentences)
3. "commercialIntent": One of: "high", "medium", "low" (is someone likely to buy/proceed based on this?)
4. "competitionLevel": One of: "low", "medium", "high" (how many good answers already exist?)
5. "recommendedContentType": One of: "blog_post", "guide", "faq", "comparison", "tutorial"
6. "estimatedSearchVolume": One of: "high", "medium", "low"

Return ONLY a valid JSON array. No markdown fences. No explanation. Example:
[{"question":"How do I...","context":"Users struggle with...","commercialIntent":"high","competitionLevel":"low","recommendedContentType":"guide","estimatedSearchVolume":"medium"}]`
}

export function buildScorecardPrompt(
  topic: string,
  gaps: ContentGap[],
  totalThreads: number,
  totalQuestions: number
): string {
  const gapSummaries = gaps
    .map(
      (g) =>
        `- "${g.question}" (engagement: ${g.engagementScore}, intent: ${g.commercialIntent}, competition: ${g.competitionLevel}, frequency: ${g.frequency})`
    )
    .join('\n')

  return `You are an SEO and content strategy auditor. Based on the Reddit content gap analysis below, generate a comprehensive scorecard.

TOPIC: "${topic}"
THREADS ANALYZED: ${totalThreads}
TOTAL QUESTIONS FOUND: ${totalQuestions}

CONTENT GAPS IDENTIFIED:
${gapSummaries}

Generate a JSON object with these fields:
{
  "overallGapScore": number 0-100 (higher = bigger opportunity),
  "opportunityScore": number 0-100,
  "engagementDensity": number 0-100,
  "questionCoverage": number 0-100,
  "competitiveAdvantage": number 0-100,
  "momentumCategory": {
    "key": one of "ripe-opportunity" | "emerging-demand" | "contested-space" | "niche-access" | "saturated-market",
    "label": human-readable label,
    "summary": 1-2 sentence explanation
  },
  "benchmarkBand": {
    "label": short label like "High Opportunity",
    "summary": brief explanation
  },
  "strengths": [{"title": "...", "detail": "..."}] (2-3 items),
  "opportunities": [{"id": "gap-1", "title": "...", "detail": "...", "action": "...", "effort": "Low"|"Medium"|"High", "timeframe": "7 days"|"30 days"|"90 days", "expectedLift": "+X% traffic estimate"}],
  "fastestWin": {"id": "gap-1", "title": "...", "detail": "...", "action": "...", "effort": "Low", "timeframe": "7 days", "expectedLift": "..."},
  "biggestOpportunity": {"id": "gap-1", "title": "...", "detail": "...", "action": "...", "effort": "Medium", "timeframe": "30 days", "expectedLift": "..."},
  "actionPlan": {
    "next7Days": ["Action item 1", "Action item 2"],
    "next30Days": ["Action item 1", "Action item 2"],
    "next90Days": ["Action item 1", "Action item 2"]
  }
}

Return ONLY valid JSON. No markdown fences. No explanation.`
}