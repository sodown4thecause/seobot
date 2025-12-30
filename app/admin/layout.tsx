import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { requireUserId } from '@/lib/auth/clerk'
import { isAdmin } from '@/lib/auth/admin-check'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await requireUserId()

  // Check admin access
  const admin = await isAdmin(userId)
  
  if (!admin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#1a1a1a]">
          {children}
        </main>
      </div>
    </div>
  )
}

