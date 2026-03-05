import { type SchemaTypeDefinition } from 'sanity'
import { eventType } from './eventType'
import { postType } from './postType'
import { caseStudyType } from './caseStudyType'
import { resourceType } from './resourceType'
import { guideType } from './guideType'
import { seoPolicyType } from './seoPolicyType'
import { seoRecoveryPlanType } from './seoRecoveryPlanType'
import { seoUrlAuditRowType } from './seoUrlAuditRowType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    eventType,
    postType,
    caseStudyType,
    resourceType,
    guideType,
    seoPolicyType,
    seoRecoveryPlanType,
    seoUrlAuditRowType,
  ],
}
