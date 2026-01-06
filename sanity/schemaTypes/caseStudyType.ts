import { defineField, defineType } from 'sanity'

export const caseStudyType = defineType({
    name: 'caseStudy',
    title: 'Case Study',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            type: 'slug',
            options: { source: 'title' },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'publishedAt',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'client',
            title: 'Client Name',
            type: 'string',
        }),
        defineField({
            name: 'industry',
            type: 'string',
            options: {
                list: [
                    { title: 'E-commerce', value: 'ecommerce' },
                    { title: 'SaaS', value: 'saas' },
                    { title: 'Healthcare', value: 'healthcare' },
                    { title: 'Finance', value: 'finance' },
                    { title: 'Education', value: 'education' },
                    { title: 'Real Estate', value: 'real-estate' },
                    { title: 'Other', value: 'other' },
                ],
            },
        }),
        defineField({
            name: 'results',
            title: 'Key Results',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'Key metrics/results achieved (e.g., "300% increase in organic traffic")',
        }),
        defineField({
            name: 'excerpt',
            title: 'Short Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'body',
            type: 'array',
            of: [{ type: 'block' }, { type: 'image' }],
        }),
    ],
    preview: {
        select: {
            title: 'title',
            client: 'client',
            media: 'image',
        },
        prepare({ title, client, media }) {
            return {
                title,
                subtitle: client ? `Client: ${client}` : undefined,
                media,
            }
        },
    },
})
