/**
 * IP Block Check Utility
 * Checks if an IP address is blocked from creating new accounts
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

/**
 * Extract IP address from request
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'unknown'
}

/**
 * Check if an IP address is blocked
 */
export async function isIpBlocked(ipAddress: string): Promise<{
  blocked: boolean
  reason?: string
  blockedAt?: Date
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('blocked_ips')
      .select('reason, blocked_at')
      .eq('ip_address', ipAddress)
      .single()

    if (error && error.code === 'PGRST116') {
      // No record found - IP is not blocked
      return { blocked: false }
    }

    if (error) {
      console.error('[IP Block Check] Error checking IP:', error)
      // On error, allow the request (fail open)
      return { blocked: false }
    }

    if (data) {
      return {
        blocked: true,
        reason: data.reason,
        blockedAt: data.blocked_at ? new Date(data.blocked_at) : undefined,
      }
    }

    return { blocked: false }
  } catch (error) {
    console.error('[IP Block Check] Error checking IP block:', error)
    // On error, allow the request (fail open)
    return { blocked: false }
  }
}

/**
 * Block an IP address
 */
export async function blockIp(
  ipAddress: string,
  reason: string,
  userId?: string | null
): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Use upsert to handle duplicate IPs gracefully
    const { error } = await supabase
      .from('blocked_ips')
      .upsert({
        ip_address: ipAddress,
        reason,
        user_id: userId || null,
        blocked_at: new Date().toISOString(),
      }, {
        onConflict: 'ip_address',
      })

    if (error) {
      console.error('[IP Block Check] Error blocking IP:', error)
      return false
    }

    console.log(`[IP Block Check] ✓ Blocked IP: ${ipAddress} (reason: ${reason})`)
    return true
  } catch (error) {
    console.error('[IP Block Check] Error blocking IP:', error)
    return false
  }
}

