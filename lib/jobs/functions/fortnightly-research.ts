import { inngest } from '@/lib/jobs/inngest-client'
import { runFortnightlyIndustryResearch } from '@/lib/research/fortnightly-industry'

export const fortnightlyResearchJob = inngest.createFunction(
  { id: 'fortnightly-industry-research', name: 'Fortnightly Industry Research' },
  { cron: '0 0 1,15 * *' },
  async ({
    step,
  }: {
    step: { run: <R>(name: string, fn: () => Promise<R>) => Promise<R> }
  }) => {
    const modes = ['seo', 'geo', 'content', 'social'] as const

    const result = await step.run('run-research', async () => {
      console.log('[FortnightlyResearch] Starting fortnightly industry research', { modes })
      return await runFortnightlyIndustryResearch([...modes])
    })

    const successful = result.filter(r => r.status === 'complete').length
    const failed = result.filter(r => r.status === 'failed').length

    console.log('[FortnightlyResearch] Complete', {
      totalJobs: result.length,
      successful,
      failed,
    })

    return { totalJobs: result.length, successful, failed }
  }
)
