import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireSubscription } from '@/lib/billing/subscription-guard'
import { DashboardClientLayout } from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify subscription - redirects to /prices if not subscribed
  const subscription = await requireSubscription('/prices?requires_subscription=1')
  
  // Get current pathname for breadcrumbs (from headers since we're server-side)
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/dashboard'

  return (
    <DashboardClientLayout pathname={pathname}>
      {children}
    </DashboardClientLayout>
  )
}
