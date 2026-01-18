/**
 * Clerk Webhook Handler
 * 
 * Syncs Clerk user events to the local database.
 * Handles user.created, user.updated, and user.deleted events.
 * 
 * Setup in Clerk Dashboard:
 * 1. Go to Webhooks in your Clerk Dashboard
 * 2. Create a new endpoint pointing to: https://yourdomain.com/api/webhooks/clerk
 * 3. Select events: user.created, user.updated, user.deleted
 * 4. Copy the signing secret to CLERK_WEBHOOK_SECRET environment variable
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Clerk webhook event types
type WebhookEventType = 'user.created' | 'user.updated' | 'user.deleted'

interface ClerkUserData {
    id: string
    email_addresses: Array<{
        id: string
        email_address: string
    }>
    first_name: string | null
    last_name: string | null
    image_url: string | null
    created_at: number
    updated_at: number
}

interface WebhookEvent {
    type: WebhookEventType
    data: ClerkUserData
    object: 'event'
    timestamp: number
}

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not set')
        return NextResponse.json(
            { error: 'Webhook secret not configured' },
            { status: 500 }
        )
    }

    // Get Svix headers for verification
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('[Clerk Webhook] Missing svix headers')
        return NextResponse.json(
            { error: 'Missing svix headers' },
            { status: 400 }
        )
    }

    // Get raw body for verification
    const payload = await req.text()

    // Verify webhook signature
    const wh = new Webhook(WEBHOOK_SECRET)
    let event: WebhookEvent

    try {
        event = wh.verify(payload, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('[Clerk Webhook] Verification failed:', err)
        return NextResponse.json(
            { error: 'Webhook verification failed' },
            { status: 400 }
        )
    }

    // Handle the event
    const { type, data } = event
    const primaryEmail = data.email_addresses?.[0]?.email_address

    console.log(`[Clerk Webhook] Processing ${type} for user ${data.id}`)

    try {
        switch (type) {
            case 'user.created': {
                // Insert new user
                await db.insert(users).values({
                    clerkId: data.id,
                    email: primaryEmail || '',
                    firstName: data.first_name,
                    lastName: data.last_name,
                    imageUrl: data.image_url,
                }).onConflictDoNothing()

                console.log(`[Clerk Webhook] Created user: ${data.id}`)
                break
            }

            case 'user.updated': {
                // Update existing user
                await db
                    .update(users)
                    .set({
                        email: primaryEmail || '',
                        firstName: data.first_name,
                        lastName: data.last_name,
                        imageUrl: data.image_url,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.clerkId, data.id))

                console.log(`[Clerk Webhook] Updated user: ${data.id}`)
                break
            }

            case 'user.deleted': {
                // Soft delete user (set deleted_at timestamp)
                await db
                    .update(users)
                    .set({
                        deletedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(users.clerkId, data.id))

                console.log(`[Clerk Webhook] Deleted user: ${data.id}`)
                break
            }

            default:
                console.log(`[Clerk Webhook] Unhandled event type: ${type}`)
        }

        return NextResponse.json({ success: true, type })
    } catch (error) {
        console.error(`[Clerk Webhook] Database error for ${type}:`, error)
        return NextResponse.json(
            { error: 'Database operation failed' },
            { status: 500 }
        )
    }
}
