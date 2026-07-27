import { requireSubscription } from '@/lib/billing/subscription-guard'
import { DashboardClientLayout } from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSubscription()

  return (
    <DashboardClientLayout>
      {children}
    </DashboardClientLayout>
  )
}
