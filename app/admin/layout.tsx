import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { isAdmin } from '@/lib/auth/admin-check'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Check admin access using Clerk user
  const admin = await isAdmin(user.id)
  
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

