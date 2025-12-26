/**
 * Auth User API
 * 
 * Returns the current user's information for client-side compatibility
 */

import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
    try {
        const user = await currentUser()
        
        if (!user) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.emailAddresses?.[0]?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                imageUrl: user.imageUrl,
            }
        })
    } catch (error) {
        console.error('[Auth API] Error:', error)
        return NextResponse.json({ user: null, error: 'Auth check failed' }, { status: 500 })
    }
}
