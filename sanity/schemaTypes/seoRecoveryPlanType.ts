import { defineField, defineType } from 'sanity'

export const seoRecoveryPlanType = defineType({
  name: 'seoRecoveryPlan',
  title: 'SEO Recovery Plan',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'property',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sourceData',
      type: 'string',
    }),
    defineField({
      name: 'currentPhase',
      type: 'string',
      options: {
        list: [
          { title: 'Phase 0', value: 'phase-0' },
          { title: 'Phase 1', value: 'phase-1' },
          { title: 'Phase 2', value: 'phase-2' },
          { title: 'Phase 3', value: 'phase-3' },
          { title: 'Phase 4', value: 'phase-4' },
        ],
      },
      initialValue: 'phase-0',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'phaseScope',
      title: 'In Scope Phases',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'executiveSnapshot',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'planMarkdown',
      type: 'text',
      rows: 24,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'property',
    },
  },
})
