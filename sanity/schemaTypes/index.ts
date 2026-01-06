import { type SchemaTypeDefinition } from 'sanity'
import { eventType } from './eventType'
import { postType } from './postType'
import { caseStudyType } from './caseStudyType'
import { resourceType } from './resourceType'
import { guideType } from './guideType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [eventType, postType, caseStudyType, resourceType, guideType],
}
