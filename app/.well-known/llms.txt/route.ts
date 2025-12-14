import { redirect } from 'next/navigation'

export async function GET() {
  // Redirect to root llms.txt for future-proofing
  // Current spec (2025) places llms.txt at root, but .well-known is under discussion
  redirect('/llms.txt')
}

