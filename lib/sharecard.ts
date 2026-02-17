export function generateShareCardSvg(args: {
  domain: string
  score: number
  category: string
  competitor?: string
}): string {
  const { domain, score, category, competitor } = args

  const scoreColor = score >= 70 ? '#49e0b8' : score >= 40 ? '#f59e0b' : '#ef4444'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 315" width="600" height="315">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a1f2b"/>
      <stop offset="100%" style="stop-color:#04231a"/>
    </linearGradient>
  </defs>
  <rect width="600" height="315" fill="url(#bg)" rx="16"/>
  <text x="40" y="50" font-family="system-ui,sans-serif" font-size="18" fill="#94a3b8">AI Visibility Score</text>
  <text x="40" y="115" font-family="system-ui,sans-serif" font-size="72" font-weight="700" fill="${scoreColor}">${score}</text>
  <text x="40" y="160" font-family="system-ui,sans-serif" font-size="20" fill="#e2e8f0">${domain}</text>
  <text x="40" y="195" font-family="system-ui,sans-serif" font-size="14" fill="#94a3b8">Perception: ${category}</text>
  ${competitor ? `<text x="40" y="220" font-family="system-ui,sans-serif" font-size="14" fill="#94a3b8">Competitor: ${competitor}</text>` : ''}
  <text x="580" y="285" font-family="system-ui,sans-serif" font-size="12" fill="#64748b" text-anchor="end">Powered by SEObot</text>
</svg>`
}

export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml,${encoded}`
}

export function buildXShareIntentUrl(args: {
  domain: string
  score: number
  category: string
  resultPath: string
}): string {
  const { domain, score, category, resultPath } = args
  const text = `My ${domain} AI Visibility Score: ${score}/100 (${category}). Check your site:`
  const url = `https://seobot.ai${resultPath}`
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}
