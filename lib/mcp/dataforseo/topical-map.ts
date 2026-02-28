export interface DataforseoTopicalTopic {
  topic: string
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational'
  youCoverage: number
  competitorCoverage: number
  evidenceDepth: number
  sourceUrl: string
}

export async function getDataforseoTopicalTopics(_input: {
  domain: string
  brand: string
  category: string
}): Promise<DataforseoTopicalTopic[]> {
  return []
}
