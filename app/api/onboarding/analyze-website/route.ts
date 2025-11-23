import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { url, content } = await req.json()

    if (!url || !content) {
      return new Response('Missing URL or content', { status: 400 })
    }

    // Analyze with Gemini AI via Gateway
    const prompt = `Analyze this website content and provide structured insights:
    
    URL: ${url}
    Content Preview: ${content.slice(0, 5000)}
    
    Return a JSON object with:
    1. industry: The primary industry
    2. topics: Array of main topics/keywords
    3. audience: Target audience description
    4. tone: Content tone (professional, casual, etc.)
    5. goals: Likely business goals based on CTAs
    
    Ensure valid JSON response.`

    const { text } = await generateText({
      model: vercelGateway.languageModel('google/gemini-2.0-pro-exp-02-05'),
      prompt: prompt,
      system: 'You are an expert business analyst. Output ONLY valid JSON.',
    })
    
    const cleanText = text.replace(/```json\n|\n```/g, '').replace(/```/g, '')
    const analysis = JSON.parse(cleanText)

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Website Analysis Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}