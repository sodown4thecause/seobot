import { requireSubscription } from '@/lib/billing/subscription-guard'
import { DashboardClientLayout } from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify subscription - redirects to /prices if not subscribed
  await requireSubscription('/prices?requires_subscription=1')

  return (
    <DashboardClientLayout>
      {children}
    </DashboardClientLayout>
  )
}
