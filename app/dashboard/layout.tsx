import { DashboardClientLayout } from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardClientLayout>
      {children}
    </DashboardClientLayout>
  )
}
