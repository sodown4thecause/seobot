/**
 * IP Block Check Utility
 * Checks if an IP address is blocked from creating new accounts
 */

import { db, blockedIps } from '@/lib/db'
import { eq } from 'drizzle-orm'
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
    const [record] = await db
      .select()
      .from(blockedIps)
      .where(eq(blockedIps.ipAddress, ipAddress))
      .limit(1)

    if (!record) {
      // No record found - IP is not blocked
      return { blocked: false }
    }

    return {
      blocked: true,
      reason: record.reason,
      blockedAt: record.blockedAt,
    }
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
    // Use upsert to handle duplicate IPs gracefully
    await db
      .insert(blockedIps)
      .values({
        ipAddress,
        reason,
        userId: userId || null,
        blockedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [blockedIps.ipAddress],
        set: {
          reason,
          userId: userId || null,
          blockedAt: new Date(),
        }
      })

    console.log(`[IP Block Check] ✓ Blocked IP: ${ipAddress} (reason: ${reason})`)
    return true
  } catch (error) {
    console.error('[IP Block Check] Error blocking IP:', error)
    return false
  }
}

