import type { Metadata } from 'next'
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from '@/lib/seo/site'

type OpenGraphType = 'website' | 'article'

type BuildPageMetadataOptions = {
  title: string
  description: string
  path: string
  type?: OpenGraphType
  imagePath?: string
  keywords?: string[]
  noIndex?: boolean
}

export function buildPageMetadata({
  title,
  description,
  path,
  type = 'website',
  imagePath = DEFAULT_OG_IMAGE_PATH,
  keywords,
  noIndex = false,
}: BuildPageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path)
  const imageUrl = absoluteUrl(imagePath)

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical },
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}
