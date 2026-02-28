export interface FirecrawlTopicalTopic {
  topic: string
  evidenceDepth: number
  sourceUrl: string
  lastIndexedAt: string
}

export async function getFirecrawlTopicalTopics(_input: {
  domain: string
  brand: string
}): Promise<FirecrawlTopicalTopic[]> {
  return []
}
