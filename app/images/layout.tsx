import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'AI Image Generator | FlowIntent',
    description: 'Generate custom images for articles using AI.',
    path: '/images',
  }),
  robots: {
    index: false,
    follow: false,
  },
}

export default function ImagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
