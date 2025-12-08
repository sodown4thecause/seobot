import nlp from 'compromise'

export function applyStylisticPass(content: string): string {
  if (!content) return content

  const paragraphs = content.split(/\n{2,}/)
  let markerIndex = 0

  const rewritten = paragraphs.map((paragraph, paragraphIndex) => {
    const trimmed = paragraph.trim()
    if (!trimmed) return ''
    return rewriteParagraph(trimmed, paragraphIndex, markerIndex++)
  })

  return rewritten.filter(Boolean).join('\n\n')
}

export function applyLexicalVariation(content: string): string {
  if (!content) return content
  const swaps: Record<string, string[]> = {
    'optimize': ['tune', 'reshape', 'refine'],
    'optimiz': ['tune', 'reshape', 'refine'],
    'leverage': ['use', 'lean on', 'double down on'],
    'ensure': ['make certain', 'lock in', 'guarantee'],
    'strategy': ['playbook', 'game plan', 'approach'],
    'framework': ['blueprint', 'pattern', 'outline'],
    'AI': ['AI', 'machine intelligence', 'automation stack'],
    'answer engine': ['answer engine', 'AI overview panel', 'direct answer feed'],
  }

  let updated = content
  for (const [needle, variations] of Object.entries(swaps)) {
    const regex = new RegExp(`\\b${needle}\\w*\\b`, 'gi')
    updated = updated.replace(regex, (match) => {
      const variant = variations[Math.floor(Math.random() * variations.length)]
      return preserveCase(match, variant)
    })
  }

  return updated
}

function preserveCase(source: string, replacement: string): string {
  if (source.toUpperCase() === source) return replacement.toUpperCase()
  if (source.toLowerCase() === source) return replacement.toLowerCase()
  return replacement
}

function rewriteParagraph(paragraph: string, paragraphIndex: number, markerIndex: number): string {
  const sentences = splitIntoSentences(paragraph)
  if (!sentences.length) return paragraph

  const doc = nlp(paragraph)
  const entities = doc.nouns().toSingular().out('array').slice(0, 2)

  const rewrittenSentences = sentences.map((raw, idx) => {
    let updated = raw.replace(/\s+/g, ' ').trim()
    if (!updated) return ''

    // Apply contractions for more natural language
    const doc = nlp(updated)
    doc.contractions().expand() // First expand, then the text will be more natural
    updated = doc.text()
    updated = enforceBurstiness(updated, idx)

    if (idx % 5 === 2 && !updated.endsWith('?')) {
      updated = `${updated}. ${buildRhetoricalQuestion(paragraphIndex, idx, entities)}`
    }

    if (idx % 4 === 1) {
      updated = injectAnecdote(updated, paragraphIndex, idx)
    }

    return updated
  })

  if (paragraphIndex % 2 === 1) {
    rewrittenSentences.unshift(buildParagraphMarker(markerIndex, entities))
  }

  return rewrittenSentences.filter(Boolean).join(' ')
}

function splitIntoSentences(paragraph: string): string[] {
  const regex = /[^.!?]+[.!?]+|\S+$/g
  const matches = paragraph.match(regex)
  return matches ? matches.map((s) => s.trim()) : [paragraph]
}

function buildRhetoricalQuestion(paragraphIndex: number, sentenceIndex: number, entities: string[]): string {
  if (entities.length === 0) {
    return paragraphIndex % 2 === 0
      ? 'What does that signal if you are handling the content roadmap?'
      : 'Why should a search strategist care about that shift?'
  }
  const entity = entities[sentenceIndex % entities.length]
  return `How would ${entity} interpret that signal in real time?`
}

function buildParagraphMarker(markerIndex: number, entities: string[]): string {
  const markers = [
    "Here's the thing",
    'Let me be direct',
    'Think about it',
    'Now the twist',
    'In plain English',
  ]
  const marker = markers[markerIndex % markers.length]
  if (entities.length === 0) return `${marker},`
  const entity = entities[markerIndex % entities.length]
  return `${marker}, especially if you're watching ${entity} evolve`
}

function injectAnecdote(sentence: string, paragraphIndex: number, sentenceIndex: number): string {
  const anecdote =
    paragraphIndex % 2 === 0
      ? 'I watched a fintech content team reroute their entire Perplexity plan after a single week of tracking citations.'
      : 'One of our SaaS partners doubled their Claude exposure the moment they started weaving customer stories into every answer block.'
  return `${sentence} ${sentenceIndex % 2 === 0 ? anecdote : ''}`.trim()
}

function enforceBurstiness(sentence: string, sentenceIndex: number): string {
  if (sentenceIndex % 4 === 0) {
    return shortenToWords(sentence, 35)
  }
  if (sentenceIndex % 4 === 1) {
    return sentence
  }
  return sentenceIndex % 4 === 2 ? `${sentence} ${sentence}` : sentence
}

function shortenToWords(sentence: string, maxWords: number): string {
  const words = sentence.split(/\s+/)
  if (words.length <= maxWords) return sentence
  return words.slice(0, maxWords).join(' ') + '…'
}

