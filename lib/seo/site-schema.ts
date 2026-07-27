export const siteSchemaMarkup = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://flowintent.com/#website',
      name: 'FlowIntent',
      url: 'https://flowintent.com/',
      description: 'AI-powered intent marketing platform for answer engine optimization (AEO)',
      publisher: { '@id': 'https://flowintent.com/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://flowintent.com/#organization',
      name: 'FlowIntent',
      url: 'https://flowintent.com/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://flowintent.com/logo-new.png',
        width: 512,
        height: 512,
      },
      description: 'AI-powered intent marketing platform for Google and AI search engines',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'liam@flowintent.com',
      },
      sameAs: [
        'https://twitter.com/flowintent',
        'https://linkedin.com/company/flowintent',
      ],
    },
  ],
} as const
