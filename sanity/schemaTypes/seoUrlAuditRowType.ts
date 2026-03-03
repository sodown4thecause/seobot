import { defineField, defineType } from 'sanity'

export const seoUrlAuditRowType = defineType({
  name: 'seoUrlAuditRow',
  title: 'SEO URL Audit Row',
  type: 'document',
  fields: [
    defineField({
      name: 'url',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'statusCode',
      type: 'number',
    }),
    defineField({
      name: 'canonicalPresent',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'canonicalTarget',
      type: 'url',
    }),
    defineField({
      name: 'robotsMeta',
      type: 'string',
    }),
    defineField({
      name: 'includedInSitemap',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'indexedInGsc',
      title: 'Indexed in GSC',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'titleLength',
      type: 'number',
    }),
    defineField({
      name: 'metaDescriptionLength',
      type: 'number',
    }),
    defineField({
      name: 'issues',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'priority',
      type: 'string',
      options: {
        list: [
          { title: 'High', value: 'high' },
          { title: 'Medium', value: 'medium' },
          { title: 'Low', value: 'low' },
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: [
          { title: 'Open', value: 'open' },
          { title: 'In Progress', value: 'in-progress' },
          { title: 'Resolved', value: 'resolved' },
        ],
      },
      initialValue: 'open',
    }),
    defineField({
      name: 'owner',
      type: 'string',
    }),
    defineField({
      name: 'lastChecked',
      type: 'datetime',
    }),
    defineField({
      name: 'notes',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: {
      title: 'url',
      subtitle: 'status',
    },
  },
})
