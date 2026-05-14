import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { Polar } from '@polar-sh/sdk'
import { OFFICIAL_POLAR_CHECKOUT_URL } from '@/lib/billing/pricing'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-up', request.url))
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const checkoutUrl = new URL(OFFICIAL_POLAR_CHECKOUT_URL)

  const email = session.user.email

  const customerName =
    session.user.name || ''

  const polarAccessToken = process.env.POLAR_ACCESS_TOKEN
  const polarProductId = process.env.POLAR_PRODUCT_ID

  if (polarAccessToken && polarProductId) {
    try {
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
    } catch (error) {
      console.error('[Billing Checkout] Falling back to hosted Polar link', error)
    }
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
