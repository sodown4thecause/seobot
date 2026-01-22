import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { posts } = await req.json()

    if (!posts || !Array.isArray(posts)) {
      return new Response('Invalid posts data', { status: 400 })
    }

    // Analyze with Gemini AI via Gateway
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postsText = posts.slice(0, 50).map((p: any) => p.text).join('\n\n---\n\n')
    const prompt = `Analyze these social media posts and extract the brand voice characteristics.
    
    Posts:
    ${postsText}
    
    Return a JSON object with the following structure:
    {
      "tone": ["adjective", "adjective"],
      "style": ["adjective", "adjective"],
      "keywords": ["keyword", "keyword"],
      "dos": ["guideline", "guideline"],
      "donts": ["guideline", "guideline"],
      "summary": "A brief summary of the brand voice."
    }
    
    Ensure the response is valid JSON.`

    const { text } = await generateText({
      model: vercelGateway.languageModel('google/gemini-2.0-pro-exp-02-05'),
      prompt: prompt,
      system: 'You are an expert brand strategist. Output ONLY valid JSON.',
    })
    
    const cleanText = text.replace(/```json\n|\n```/g, '').replace(/```/g, '')
    const analysis = JSON.parse(cleanText)

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Brand Voice Extraction Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}