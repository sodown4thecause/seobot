import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** @deprecated Content Zone removed — use Content Mode chat and create_content_package */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Content Zone has been retired. Use dashboard chat in Content Mode to generate and save content packages.',
      redirect: '/dashboard?mode=content',
    },
    { status: 410 },
  )
}
