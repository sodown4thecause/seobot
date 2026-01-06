import { defineField, defineType } from 'sanity'

export const resourceType = defineType({
    name: 'resource',
    title: 'Resource',
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
            name: 'category',
            type: 'string',
            options: {
                list: [
                    { title: 'Template', value: 'template' },
                    { title: 'Checklist', value: 'checklist' },
                    { title: 'Toolkit', value: 'toolkit' },
                    { title: 'Whitepaper', value: 'whitepaper' },
                    { title: 'Ebook', value: 'ebook' },
                    { title: 'Webinar', value: 'webinar' },
                    { title: 'Tool', value: 'tool' },
                ],
            },
        }),
        defineField({
            name: 'excerpt',
            title: 'Short Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'downloadUrl',
            title: 'Download URL',
            type: 'url',
            description: 'Optional link to downloadable resource',
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
            category: 'category',
            media: 'image',
        },
        prepare({ title, category, media }) {
            return {
                title,
                subtitle: category ? category.charAt(0).toUpperCase() + category.slice(1) : undefined,
                media,
            }
        },
    },
})
