/**
 * Admin Role Checker
 * Checks if a user has admin privileges via Clerk
 */

import { currentUser } from '@clerk/nextjs/server'

/**
 * Check if the current user is an admin
 * Checks is_admin or is_super_admin flags in Clerk's publicMetadata
 */
export async function isAdmin(userId?: string | null): Promise<boolean> {
  try {
    const user = await currentUser()
    
    if (!user) {
      return false
    }

    // If userId is provided, verify it matches the current user (security check)
    if (userId && user.id !== userId) {
      return false
    }

    // Check admin flags in publicMetadata
    // Clerk stores custom user data in publicMetadata, privateMetadata, or unsafeMetadata
    // For admin roles, we use publicMetadata which is readable by the frontend
    const publicMetadata = user.publicMetadata as { 
      is_admin?: boolean
      is_super_admin?: boolean 
    }
    
    if (publicMetadata?.is_admin === true || publicMetadata?.is_super_admin === true) {
      return true
    }

    // Also check privateMetadata (server-side only, more secure)
    const privateMetadata = user.privateMetadata as { 
      is_admin?: boolean
      is_super_admin?: boolean 
    }
    
    if (privateMetadata?.is_admin === true || privateMetadata?.is_super_admin === true) {
      return true
    }

    return false
  } catch (error) {
    console.error('[Admin Check] Error checking admin status:', error)
    return false
  }
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin(userId: string | null | undefined): Promise<void> {
  const admin = await isAdmin(userId)
  if (!admin) {
    throw new Error('Admin access required')
  }
}

