import { defineField, defineType } from 'sanity'

export const seoPolicyType = defineType({
  name: 'seoPolicy',
  title: 'SEO Policy',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      initialValue: 'FlowIntent Canonical and Indexability Policy',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'protocol',
      type: 'string',
      options: {
        list: [
          { title: 'HTTPS', value: 'https' },
          { title: 'HTTP', value: 'http' },
        ],
      },
      initialValue: 'https',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'preferredHost',
      type: 'string',
      initialValue: 'flowintent.com',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'trailingSlash',
      type: 'string',
      options: {
        list: [
          { title: 'No trailing slash', value: 'never' },
          { title: 'Trailing slash', value: 'always' },
        ],
      },
      initialValue: 'never',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'indexableRouteGroups',
      title: 'Indexable Route Groups',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'noindexRouteGroups',
      title: 'Noindex Route Groups',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'deprecatedRoutes',
      title: 'Deprecated Routes',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'notes',
      type: 'text',
      rows: 6,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'preferredHost',
    },
  },
})
