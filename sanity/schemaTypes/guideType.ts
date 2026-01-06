import { defineField, defineType } from 'sanity'

export const guideType = defineType({
    name: 'guide',
    title: 'Guide',
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
            name: 'difficulty',
            type: 'string',
            options: {
                list: [
                    { title: 'Beginner', value: 'beginner' },
                    { title: 'Intermediate', value: 'intermediate' },
                    { title: 'Advanced', value: 'advanced' },
                ],
            },
        }),
        defineField({
            name: 'readTime',
            title: 'Read Time (minutes)',
            type: 'number',
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
            difficulty: 'difficulty',
            media: 'image',
        },
        prepare({ title, difficulty, media }) {
            return {
                title,
                subtitle: difficulty ? `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Guide` : 'Guide',
                media,
            }
        },
    },
})
