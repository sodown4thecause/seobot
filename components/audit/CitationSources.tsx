import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CitationSourcesProps {
  urls: string[]
}

function isSafeUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function CitationSources({ urls }: CitationSourcesProps) {
  return (
    <Card className="glass-card rounded-[1.75rem] border-white/8 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-xl text-white">Source landscape</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-zinc-300">
          These are the sources AI systems leaned on in this run. If your domain is not here yet, this becomes a clear blueprint for the kind of evidence they already trust.
        </p>
        {urls.length === 0 ? (
          <p className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-300">
            No citation URLs were returned in this run. That usually means this category still has room for stronger source patterns, which makes fresh proof assets even more valuable.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {urls.map((url) => (
              <li key={url} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                {isSafeUrl(url) ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-cyan-200 hover:text-cyan-100 hover:underline">
                    {url}
                  </a>
                ) : (
                  <span className="text-zinc-400">{url}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
