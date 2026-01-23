# Polar Subscription Integration Design (Revised)

## Overview
This design outlines the integration of Polar.sh as the subscription provider for the platform. The goal is to enable user subscriptions via a simple checkout link, manage subscription status via webhooks, and display pricing options on a new dedicated page.

**Correction:** We are using **Drizzle ORM** with Neon, not raw Supabase SQL migrations. The design has been updated to reflect this.

## 1. Database Schema Changes

We will modify the existing `users` table definition in `lib/db/schema.ts` to track subscription details.

**New Columns for `users` table:**
*   `subscriptionStatus` (text): To track state (e.g., 'active', 'inactive', 'past_due').
*   `polarCustomerId` (text): To map the local user to the Polar customer.
*   `polarSubscriptionId` (text): To reference the specific subscription instance.
*   `currentPeriodEnd` (timestamp): To know when the subscription expires or renews.

**Implementation Plan:**
1.  Update `lib/db/schema.ts` to include these fields in the `users` table definition.
2.  Generate a migration using Drizzle Kit (`npx drizzle-kit generate`).
3.  Apply the migration (`npx drizzle-kit migrate` or similar command as per project setup).

## 2. Environment Configuration

We need to secure the webhook endpoint.

**New Environment Variables:**
*   `POLAR_WEBHOOK_SECRET`: The secret key provided by Polar to verify incoming webhook signatures.
*   `POLAR_CHECKOUT_URL_MONTHLY`: URL for the monthly plan checkout.
*   `POLAR_CHECKOUT_URL_YEARLY`: URL for the yearly plan checkout.

## 3. Webhook Handling (`app/api/webhooks/polar/route.ts`)

We will create a new API route to handle Polar webhooks.

**Key Logic:**
1.  **Verification:** Verify the request signature using `POLAR_WEBHOOK_SECRET` and the `svix` library (already in dependencies).
2.  **Event Handling:**
    *   `subscription.created` / `subscription.updated`: Update `subscriptionStatus`, `currentPeriodEnd`, and `polarSubscriptionId`.
    *   `subscription.canceled`: Update status to 'canceled' (or keep 'active' until `currentPeriodEnd`).
    *   `subscription.revoked`: Immediately remove access.
3.  **User Mapping:** Match the webhook's `customer_id` or `email` to our `users` table using Drizzle queries.

## 4. UI Implementation

**New Page: `/pricing`**
*   Create `app/pricing/page.tsx`.
*   Design a pricing table (Monthly vs Yearly toggle).
*   "Subscribe" buttons will link directly to the `POLAR_CHECKOUT_URL_*` environment variables.
*   If the user is logged in, pass their `email` to the Polar checkout URL to pre-fill and ensure matching.

**Navigation:**
*   Add a "Pricing" link to the user profile dropdown (likely in a component like `UserNav` or `Sidebar`).

## 5. Middleware / Access Control
*   Update core access logic to check `user.subscriptionStatus` before allowing access to premium features (likely in `types/user-mode.ts` or a dedicated permission checker).

---
**Does this revised design look correct to you?**
