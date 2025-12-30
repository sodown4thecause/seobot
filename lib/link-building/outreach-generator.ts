/**
 * Outreach Email Generator
 * 
 * Personalized email pitch generation for different link building strategies.
 * Supports multiple templates, follow-up sequences, and brand voice personalization.
 */

import type {
  OutreachEmailParams,
  OutreachEmail,
  OutreachEmailType,
  EmailPersonalization
} from './types'

export class OutreachEmailGenerator {
  
  /**
   * Generate personalized outreach email
   */
  async generateEmail(params: OutreachEmailParams): Promise<OutreachEmail> {
    const {
      prospectInfo,
      opportunityType,
      yourAsset,
      brandVoice
    } = params

    // Get appropriate template based on opportunity type
    const template = this.getTemplateForType(opportunityType)
    
    // Fill template variables
    const variables = this.buildTemplateVariables(
      prospectInfo,
      yourAsset,
      brandVoice
    )

    // Generate email body by replacing variables
    const body = this.fillTemplate(template.body, variables)
    const subject = this.fillTemplate(template.subject, variables)

    // Generate follow-up sequence
    const followUpSequence = this.generateFollowUpSequence(
      opportunityType,
      variables
    )

    // Build personalization object with essential fields
    const personalization = {
      prospectName: variables.prospectName,
      siteName: variables.siteName,
      specificValue: variables.specificValue || yourAsset.uniqueValue || ''
    }

    return {
      id: `email-${Date.now()}`,
      type: opportunityType,
      subject,
      body,
      personalization,
      followUpSequence,
      templateVariables: this.toTemplateVariables(variables)
    }
  }

  /**
   * Convert EmailPersonalization to template variables record
   */
  private toTemplateVariables(vars: EmailPersonalization): Record<string, string> {
    return {
      prospectName: vars.prospectName,
      siteName: vars.siteName,
      yourName: vars.yourName,
      yourTitle: vars.yourTitle,
      yourCompany: vars.yourCompany,
      yourUrl: vars.yourUrl,
      yourDescription: vars.yourDescription || '',
      specificValue: vars.specificValue || '',
      recentArticle: vars.recentArticle || '',
      recentTopics: Array.isArray(vars.recentTopics) ? vars.recentTopics.join(', ') : '',
      yourTone: vars.yourTone,
      todayDate: vars.todayDate,
      topic: vars.topic || '',
      mentionContext: vars.mentionContext || '',
      pageWithBrokenLink: vars.pageWithBrokenLink || '',
      brokenUrl: vars.brokenUrl || '',
      previousSubject: vars.previousSubject || ''
    }
  }

  /**
   * Get email template based on opportunity type
   */
  private getTemplateForType(type: OutreachEmailType): { subject: string; body: string } {
    const templates: Record<OutreachEmailType, { subject: string; body: string }> = {
      guest_post_pitch: {
        subject: 'Content idea for {siteName}',
        body: this.getGuestPostTemplate()
      },
      resource_link_pitch: {
        subject: 'Resource suggestion for {siteName}',
        body: this.getResourceLinkTemplate()
      },
      broken_link_pitch: {
        subject: 'Quick fix for broken link on {siteName}',
        body: this.getBrokenLinkTemplate()
      },
      unlinked_mention_pitch: {
        subject: 'Quick question about {siteName}',
        body: this.getUnlinkedMentionTemplate()
      },
      expert_roundup_pitch: {
        subject: 'Expert input request: {topic}',
        body: this.getExpertRoundupTemplate()
      },
      follow_up_1: {
        subject: 'Following up: {previousSubject}',
        body: this.getFollowUpTemplate(1)
      },
      follow_up_2: {
        subject: 'Re: {previousSubject}',
        body: this.getFollowUpTemplate(2)
      },
      final_follow_up: {
        subject: 'Final follow-up: {previousSubject}',
        body: this.getFollowUpTemplate(3)
      }
    }

    return templates[type]
  }

  /**
   * Build template variables from context
   */
  private buildTemplateVariables(
    prospectInfo: OutreachEmailParams['prospectInfo'],
    yourAsset: OutreachEmailParams['yourAsset'],
    brandVoice?: OutreachEmailParams['brandVoice']
  ): EmailPersonalization {
    const {
      siteUrl,
      siteName = this.extractSiteName(siteUrl),
      contactName,
      recentContent = [],
      siteTopics = []
    } = prospectInfo

    const {
      companyName = brandVoice?.companyName || 'Your Company',
      senderName = brandVoice?.senderName || 'Your Name',
      senderTitle = brandVoice?.senderTitle
    } = brandVoice || {}

    const tone = this.getToneStyle(brandVoice?.tone)
    const recentArticle = this.getMostRecentArticle(recentContent)
    const recentTopics = this.getMostRecentTopics(siteTopics)

    return {
      prospectName: contactName || 'there',
      siteName,
      yourName: senderName,
      yourTitle: senderTitle || 'SEO Specialist',
      yourCompany: companyName,
      yourUrl: yourAsset.url,
      yourDescription: yourAsset.description,
      specificValue: yourAsset.uniqueValue,
      recentArticle,
      recentTopics,
      topic: yourAsset.title,
      yourTone: tone,
      todayDate: new Date().toLocaleDateString()
    }
  }

  /**
   * Generate follow-up email sequence
   */
  private generateFollowUpSequence(
    baseType: OutreachEmailType,
    variables: EmailPersonalization
  ): OutreachEmail[] {
    const followUps: OutreachEmail[] = []

    // First follow-up (3 days later)
    if (baseType !== 'follow_up_1' && baseType !== 'follow_up_2' && baseType !== 'final_follow_up') {
      const followUp1: EmailPersonalization = {
        ...variables,
        previousSubject: variables.topic || 'my previous email'
      }
      followUps.push({
        id: `followup-1-${Date.now()}`,
        type: 'follow_up_1' as OutreachEmailType,
        subject: this.fillTemplate('Following up: {previousSubject}', followUp1),
        body: this.fillTemplate(this.getFollowUpTemplate(1), followUp1),
        personalization: { 
          prospectName: variables.prospectName, 
          siteName: variables.siteName,
          specificValue: variables.specificValue || ''
        },
        templateVariables: this.toTemplateVariables(followUp1)
      })
    }

    // Second follow-up (7 days later)
    const followUp2: EmailPersonalization = {
      ...variables,
      previousSubject: variables.topic || 'my previous email'
    }
    followUps.push({
      id: `followup-2-${Date.now()}`,
      type: 'follow_up_2' as OutreachEmailType,
      subject: this.fillTemplate('Re: {previousSubject}', followUp2),
      body: this.fillTemplate(this.getFollowUpTemplate(2), followUp2),
      personalization: { 
        prospectName: variables.prospectName, 
        siteName: variables.siteName,
        specificValue: variables.specificValue || ''
      },
      templateVariables: this.toTemplateVariables(followUp2)
    })

    // Final follow-up (14 days later)
    const finalFollowUp: EmailPersonalization = {
      ...variables,
      previousSubject: variables.topic || 'my previous email'
    }
    followUps.push({
      id: `followup-final-${Date.now()}`,
      type: 'final_follow_up' as OutreachEmailType,
      subject: this.fillTemplate('Final follow-up: {previousSubject}', finalFollowUp),
      body: this.fillTemplate(this.getFollowUpTemplate(3), finalFollowUp),
      personalization: { 
        prospectName: variables.prospectName, 
        siteName: variables.siteName,
        specificValue: variables.specificValue || ''
      },
      templateVariables: this.toTemplateVariables(finalFollowUp)
    })

    return followUps
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  private getGuestPostTemplate(): string {
    return `Hi {prospectName},

I've been following {siteName}'s content and came across your recent article on {recentArticle}. Great piece!

I noticed you cover topics around {recentTopics} and thought you might be interested in a comprehensive guide I've just published:

{yourTitle}

{yourUrl}

Key points this covers:
- In-depth analysis backed by recent data
- Practical examples your readers would find valuable
- Unique angles not covered by competitors in your space

This aligns perfectly with your content strategy and would provide significant value to your audience. I can adjust tone, length, and examples to match your style preferences.

Would you be open to reviewing this for potential inclusion in {siteName}?

Looking forward to your thoughts.

Best,
{yourName}
{yourTitle}
{yourCompany}`
  }

  private getResourceLinkTemplate(): string {
    return `Hi {prospectName},

I was browsing your excellent resources page at {siteUrl} and noticed it's a comprehensive, well-curated list of tools in {recentTopics} space.

I recently created a resource that would be a perfect addition:

{yourTitle}

{yourUrl}

Here's why I think it would fit well:
{specificValue}

Your readers would find this valuable, and I believe it would enhance your already great collection.

Would you consider adding it? Happy to provide any additional information you'd need.

Best regards,
{yourName}
{yourTitle}
{yourCompany}`
  }

  private getBrokenLinkTemplate(): string {
    return `Hi {prospectName},

I was reading your informative article "{pageWithBrokenLink}" on {siteName} and noticed something that could be improved.

There's a broken link pointing to {brokenUrl} which appears to be offline. 

I've actually created a comprehensive resource on this exact topic that your readers would find valuable:

{yourTitle}

{yourUrl}

Would you be interested in replacing the broken link with this resource? It would ensure your readers always have access to current, accurate information.

Either way, thought you'd want to know about the broken link so you can fix it.

Best,
{yourName}
{yourTitle}
{yourCompany}`
  }

  private getUnlinkedMentionTemplate(): string {
    return `Hi {prospectName},

I was doing some research and came across a mention of {siteName} in your recent content.

Specifically, you mentioned us: "{mentionContext}"

I wanted to reach out and say thank you for the recognition! We always appreciate when our brand is mentioned in the industry.

However, I noticed the mention doesn't include a link back to our site. Would you be open to adding one? It would help your readers who want to learn more about us directly from your article.

Either way, thanks again for the shout-out. Keep up the great work!

Best,
{yourName}
{yourTitle}
{yourCompany}`
  }

  private getExpertRoundupTemplate(): string {
    return `Hi {prospectName},

I hope this email finds you well.

I'm curating an expert roundup article on {topic} for {siteName} and would love to get your insights.

{yourUrl}

Specifically, I'd appreciate your thoughts on:
1. What do you see as the top {topic} trends for 2024?
2. What's one piece of advice you'd give to someone new to this space?
3. What are common misconceptions people have about {topic}?
4. What's an underrated opportunity in this area most people miss?

Feel free to answer as many or as few as you'd like. I'll make sure to credit you properly when I publish.

If you prefer, I could also arrange a quick 15-minute call to discuss further.

Looking forward to hearing from you!

Best,
{yourName}
{yourTitle}
{yourCompany}`
  }

  private getFollowUpTemplate(number: number): string {
    const messages: Record<number, string> = {
      1: `Hi {prospectName},

Just wanted to follow up on my previous email about your article "{previousSubject}".

Did you get a chance to review it? Do you have any questions or need any additional information?

I think this could be a great addition to {siteName}, and I'm happy to adjust based on your feedback.

Looking forward to hearing from you.

Best,
{yourName}
{yourTitle}
{yourCompany}`,

      2: `Hi {prospectName},

Just checking in on the email I sent last week about "{previousSubject}".

I know you're busy, but wanted to see if this is still of interest. If the timing isn't right, I understand completely.

Let me know your thoughts when you have a moment.

Best,
{yourName}
{yourTitle}
{yourCompany}`,

      3: `Hi {prospectName},

Following up one last time about resource I shared ("{previousSubject}").

I'll be moving forward with other opportunities soon, so wanted to give you a final chance if you're interested.

No pressure at all - just wanted to keep you in the loop.

Best of luck with everything at {siteName}!

Best,
{yourName}
{yourTitle}
{yourCompany}`
    }

    return messages[number]
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private fillTemplate(template: string, variables: EmailPersonalization): string {
    let result = template
    
    // Direct property replacement for type safety
    result = result.replace(/{prospectName}/g, variables.prospectName)
    result = result.replace(/{siteName}/g, variables.siteName)
    result = result.replace(/{yourName}/g, variables.yourName)
    result = result.replace(/{yourTitle}/g, variables.yourTitle)
    result = result.replace(/{yourCompany}/g, variables.yourCompany)
    result = result.replace(/{yourUrl}/g, variables.yourUrl)
    result = result.replace(/{yourDescription}/g, variables.yourDescription || '')
    result = result.replace(/{specificValue}/g, variables.specificValue || '')
    result = result.replace(/{recentArticle}/g, variables.recentArticle || '')
    result = result.replace(/{recentTopics}/g, Array.isArray(variables.recentTopics) ? variables.recentTopics.join(', ') : '')
    result = result.replace(/{topic}/g, variables.topic || '')
    result = result.replace(/{tone}/g, variables.yourTone || '')
    result = result.replace(/{todayDate}/g, variables.todayDate)
    result = result.replace(/{mentionContext}/g, variables.mentionContext || '')
    result = result.replace(/{pageWithBrokenLink}/g, variables.pageWithBrokenLink || '')
    result = result.replace(/{brokenUrl}/g, variables.brokenUrl || '')
    result = result.replace(/{previousSubject}/g, variables.previousSubject || '')
    
    return result
  }

  private extractSiteName(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    }
  }

  private getMostRecentArticle(articles: string[]): string {
    if (!articles || articles.length === 0) return 'your recent content'
    const lastArticle = articles[articles.length - 1]
    return lastArticle ? lastArticle : 'your recent work'
  }

  private getToneStyle(tone?: string): string {
    const styles: Record<string, string> = {
      professional: 'maintains a professional, business-like tone throughout',
      friendly: 'warm and approachable, building connection first',
      casual: 'relaxed and conversational, like talking to a colleague'
    }
    return (tone && styles[tone]) || 'balanced mix of professional and friendly'
  }

  private getMostRecentTopics(topics: string[]): string[] {
    if (!topics || topics.length === 0) return ['your topics']
    return topics.slice(0, 3)
  }
}

// Export singleton instance
export const outreachEmailGenerator = new OutreachEmailGenerator()
