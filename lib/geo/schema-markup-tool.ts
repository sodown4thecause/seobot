/**
 * Schema markup generator — produces ready-to-paste JSON-LD without DB persistence.
 */

import { tool } from 'ai'
import { z } from 'zod'

export type SchemaMarkupType = 'Organization' | 'Product' | 'FAQPage'

export interface FaqEntry {
  question: string
  answer: string
}

export interface SchemaMarkupInput {
  schemaType: SchemaMarkupType
  name: string
  url: string
  description?: string
  logo?: string
  sameAs?: string[]
  faqs?: FaqEntry[]
  price?: string
  priceCurrency?: string
  brand?: string
}

export interface SchemaMarkupOutput {
  success: boolean
  schemaType: SchemaMarkupType
  jsonLd: Record<string, unknown>
  scriptTag: string
  validation: { isValid: boolean; errors: string[] }
  implementationNotes: string[]
}

function validateJsonLd(jsonLd: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (jsonLd['@context'] !== 'https://schema.org') {
    errors.push('@context should be "https://schema.org"')
  }
  if (!jsonLd['@type']) {
    errors.push('Missing @type property')
  }

  const type = jsonLd['@type']
  if (type === 'Organization') {
    if (!jsonLd.name) errors.push('Organization requires name')
    if (!jsonLd.url) errors.push('Organization requires url')
  }
  if (type === 'Product') {
    if (!jsonLd.name) errors.push('Product requires name')
    if (!jsonLd.offers) errors.push('Product requires offers')
  }
  if (type === 'FAQPage') {
    const entities = jsonLd.mainEntity
    if (!Array.isArray(entities) || entities.length === 0) {
      errors.push('FAQPage requires at least one Question in mainEntity')
    }
  }

  return { isValid: errors.length === 0, errors }
}

export function buildSchemaJsonLd(input: SchemaMarkupInput): Record<string, unknown> {
  const { schemaType, name, url, description, logo, sameAs, faqs, price, priceCurrency, brand } =
    input

  switch (schemaType) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        ...(description ? { description } : {}),
        ...(logo ? { logo: { '@type': 'ImageObject', url: logo } } : {}),
        ...(sameAs?.length ? { sameAs } : {}),
      }

    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        url,
        ...(description ? { description } : {}),
        ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
        offers: {
          '@type': 'Offer',
          url,
          price: price ?? '0',
          priceCurrency: priceCurrency ?? 'USD',
          availability: 'https://schema.org/InStock',
        },
      }

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (faqs ?? []).map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }

    default:
      return {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name,
        url,
      }
  }
}

export function wrapJsonLdScript(jsonLd: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2).replace(/</g, '\\u003c')}\n</script>`
}

export function generateSchemaMarkup(input: SchemaMarkupInput): SchemaMarkupOutput {
  const jsonLd = buildSchemaJsonLd(input)
  const validation = validateJsonLd(jsonLd)
  const scriptTag = wrapJsonLdScript(jsonLd)

  const implementationNotes: string[] = [
    'Paste the script tag inside the <head> of the target page or inject via your CMS template.',
    'Validate with Google Rich Results Test after publishing.',
  ]

  if (input.schemaType === 'FAQPage') {
    implementationNotes.push(
      'FAQ schema works best when visible FAQ content on the page matches the structured data exactly.'
    )
  }
  if (input.schemaType === 'Organization') {
    implementationNotes.push(
      'Add sameAs links to LinkedIn, G2, Crunchbase, and Wikipedia to strengthen entity recognition in AI answers.'
    )
  }

  return {
    success: true,
    schemaType: input.schemaType,
    jsonLd,
    scriptTag,
    validation,
    implementationNotes,
  }
}

export function createSchemaMarkupTool() {
  return tool({
    description:
      'Generate ready-to-paste JSON-LD schema markup (Organization, Product, or FAQPage). ' +
      'Use when the user needs structured data for AI visibility, rich results, or entity clarity. ' +
      'Returns the JSON-LD object and a complete script tag for implementation.',
    inputSchema: z.object({
      schemaType: z
        .enum(['Organization', 'Product', 'FAQPage'])
        .describe('Schema.org type to generate'),
      name: z.string().describe('Brand, product, or page name'),
      url: z.string().describe('Canonical URL for the entity or page'),
      description: z.string().optional().describe('Short description'),
      logo: z.string().optional().describe('Logo URL (Organization)'),
      sameAs: z
        .array(z.string())
        .optional()
        .describe('Social/profile URLs for Organization sameAs'),
      faqs: z
        .array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        )
        .optional()
        .describe('FAQ pairs (required for FAQPage)'),
      price: z.string().optional().describe('Product price'),
      priceCurrency: z.string().optional().describe('ISO currency code (default USD)'),
      brand: z.string().optional().describe('Brand name for Product schema'),
    }),
    execute: async (input) => {
      if (input.schemaType === 'FAQPage' && (!input.faqs || input.faqs.length === 0)) {
        return {
          success: false,
          error: 'FAQPage schema requires at least one FAQ pair in the faqs array.',
        }
      }

      return generateSchemaMarkup(input)
    },
  })
}
