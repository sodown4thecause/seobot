/**
 * Admin Role Checker
 * Checks if a user has admin privileges
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Check if the current user is an admin
 * Checks is_super_admin flag in auth.users table
 */
export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) {
    return false
  }

  try {
    const supabase = await createClient()
    
    // Check is_super_admin flag in auth.users
    const { data: user, error } = await supabase.auth.getUser()
    
    if (error || !user.user) {
      return false
    }

    // Check if user's ID matches the requested userId (security check)
    if (user.user.id !== userId) {
      return false
    }

    // Check is_super_admin flag
    // Note: We need to query auth.users directly via RPC or check user metadata
    // Since we can't directly query auth.users from client, we'll check user metadata
    // or use a service role query
    
    // Try checking user metadata first (if admin flag is stored there)
    const adminFromMetadata = user.user.user_metadata?.is_admin || user.user.user_metadata?.is_super_admin
    
    if (adminFromMetadata === true) {
      return true
    }

    // Check via RPC function that queries auth.users.is_super_admin
    const { data: adminCheck, error: checkError } = await supabase.rpc('check_is_admin', {
      user_id: userId
    })

    if (!checkError && adminCheck === true) {
      return true
    }

    // Return false if not admin
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

