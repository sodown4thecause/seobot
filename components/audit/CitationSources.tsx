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
    <Card>
      <CardHeader>
        <CardTitle>What AI Is Reading Instead of Your Website</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          These are the pages Perplexity cited while answering buyer-intent queries in your niche.
        </p>
        {urls.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No citation URLs were returned in this run. Try again later for fresh source coverage.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {urls.map((url) => (
              <li key={url} className="rounded-md border p-2">
                {isSafeUrl(url) ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {url}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{url}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
