import { NextRequest, NextResponse } from 'next/server'
import { WebhookVerificationError, validateEvent } from '@polar-sh/sdk/webhooks'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    const body = await req.text()
    const headers = req.headers
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET

    if (!webhookSecret) {
        console.error('POLAR_WEBHOOK_SECRET is not set')
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    let event
    try {
        // Verify the webhook signature and parse the event
        const headersObject: Record<string, string> = {}
        headers.forEach((value, key) => {
            headersObject[key] = value
        })

        event = validateEvent(body, headersObject, webhookSecret)
    } catch (error) {
        if (error instanceof WebhookVerificationError) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }
        console.error('Webhook processing error:', error)
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    try {
        // Handle all event types
        switch (event.type) {
            case 'subscription.created':
            case 'subscription.updated':
            case 'subscription.active':
            case 'subscription.past_due':
                await handleSubscriptionUpdate(event.data)
                break
            
            case 'subscription.revoked':
            case 'subscription.canceled':
            case 'subscription.uncanceled':
                 await handleSubscriptionRevoked(event.data, event.type)
                 break

            case 'checkout.created':
            case 'checkout.updated':
                console.log(`Checkout event received: ${event.type}`, event.data.id)
                break

            case 'order.created':
            case 'order.updated':
            case 'order.paid':
            case 'order.refunded':
                await handleOrderEvent(event.data, event.type)
                break

            case 'customer.created':
            case 'customer.updated':
            case 'customer.deleted':
            case 'customer.state_changed':
                // We typically handle customer data via subscription updates, but logging here helps debugging
                console.log(`Customer event received: ${event.type}`, event.data.id)
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Error handling webhook event:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function handleSubscriptionUpdate(data: any) {
    const userId = data.metadata?.userId
    const polarCustomerId = data.customer_id
    const polarSubscriptionId = data.id
    const status = data.status
    const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end) : null

    if (userId) {
        await db.update(users)
            .set({
                subscriptionStatus: status,
                polarCustomerId: polarCustomerId,
                polarSubscriptionId: polarSubscriptionId,
                currentPeriodEnd: currentPeriodEnd,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))
    } else {
        console.warn('Received subscription update without userId in metadata', data)
    }
}

async function handleSubscriptionRevoked(data: any, eventType: string) {
    const polarSubscriptionId = data.id
    // Map specific events to status strings if needed, or just use 'canceled' / 'inactive'
    const status = eventType === 'subscription.uncanceled' ? 'active' : 'canceled'

    if (polarSubscriptionId) {
        const result = await db.update(users)
             .set({
                 subscriptionStatus: status,
                 updatedAt: new Date()
             })
             .where(eq(users.polarSubscriptionId, polarSubscriptionId))
             .returning({ updatedId: users.id })
        
         if (result.length > 0) return
    }

    const userId = data.metadata?.userId
    if (userId) {
       await db.update(users)
           .set({
               subscriptionStatus: status,
               updatedAt: new Date()
           })
           .where(eq(users.id, userId))
    } else {
         console.warn(`Received ${eventType} without valid ID link`, data)
    }
}

async function handleOrderEvent(data: any, eventType: string) {
    // Log orders for now. In future, could store in an 'orders' table.
    // If order.paid and it's a one-time purchase (not sub), we might grant credits here.
    console.log(`Processing Order Event: ${eventType}`, {
        orderId: data.id,
        amount: data.amount,
        customerId: data.customer_id,
        metadata: data.metadata
    })
}
