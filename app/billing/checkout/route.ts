import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { Polar } from '@polar-sh/sdk'
import { OFFICIAL_POLAR_CHECKOUT_URL } from '@/lib/billing/pricing'

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-up', request.url))
  }

  const user = await currentUser()

  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const checkoutUrl = new URL(OFFICIAL_POLAR_CHECKOUT_URL)

  const email =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress

  const customerName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || ''

  const polarAccessToken = process.env.POLAR_ACCESS_TOKEN
  const polarProductId = process.env.POLAR_PRODUCT_ID

  if (polarAccessToken && polarProductId) {
    const polar = new Polar({ accessToken: polarAccessToken })

    const checkout = await polar.checkouts.create({
      products: [polarProductId],
      successUrl:
        process.env.POLAR_SUCCESS_URL ||
        new URL('/dashboard?billing=success', request.url).toString(),
      returnUrl:
        process.env.POLAR_RETURN_URL || new URL('/prices', request.url).toString(),
      externalCustomerId: userId,
      customerEmail: email || undefined,
      customerName: customerName || undefined,
      metadata: {
        userId,
      },
    })

    return NextResponse.redirect(checkout.url)
  }

  if (email) {
    checkoutUrl.searchParams.set('customer_email', email)
  }

  if (customerName) {
    checkoutUrl.searchParams.set('customer_name', customerName)
  }

  checkoutUrl.searchParams.set('reference_id', userId)

  return NextResponse.redirect(checkoutUrl)
}
