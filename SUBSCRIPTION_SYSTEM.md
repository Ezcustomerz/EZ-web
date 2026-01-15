# Subscription System Implementation

## Overview

This document describes the implementation of the subscription payment system for EZ-web. The system allows users to subscribe to monthly subscription plans that affect their transaction fees and storage limits.

## Features Implemented

### 1. Database Schema

#### `user_subscriptions` Table
Created a new table to track user subscription status:
- `id`: UUID primary key
- `user_id`: References users table
- `subscription_tier_id`: References subscription_tiers table
- `stripe_subscription_id`: Stripe subscription ID (unique)
- `stripe_customer_id`: Stripe customer ID
- `status`: Subscription status (active, canceled, past_due, unpaid, trialing, incomplete)
- `current_period_start`: Start of current billing period
- `current_period_end`: End of current billing period
- `cancel_at_period_end`: Whether subscription will cancel at period end
- `canceled_at`: Timestamp when canceled
- `created_at`, `updated_at`: Timestamps

#### `subscription_tiers` Table Updates
Added columns to existing subscription_tiers table:
- `stripe_product_id`: Stripe product ID
- `stripe_price_id`: Stripe recurring price ID
- `storage_display`: Human-readable storage amount (e.g., "10 GB")
- `tier_level`: Integer representing tier hierarchy (higher = better plan)

### 2. Backend API

#### New Endpoints (`/api/subscriptions`)

1. **POST `/api/subscriptions/create-checkout-session`**
   - Creates a Stripe Checkout session for subscription payment
   - Automatically creates Stripe product and price if not exists
   - Request body: `{ subscription_tier_id: string }`
   - Response: `{ checkout_url: string, session_id: string }`

2. **POST `/api/subscriptions/verify`**
   - Verifies subscription payment after Stripe Checkout
   - Updates user subscription in database
   - Updates creative's subscription_tier_id
   - Cancels any existing active subscriptions
   - Request body: `{ session_id: string }`
   - Response: `{ success: boolean, message: string, subscription_tier_id?: string, subscription_status?: string }`

3. **GET `/api/subscriptions/status`**
   - Gets current subscription status for authenticated user
   - Response: `{ has_subscription: boolean, subscription_tier_id?: string, subscription_tier_name?: string, status?: string, current_period_start?: datetime, current_period_end?: datetime, cancel_at_period_end?: boolean }`

4. **POST `/api/subscriptions/cancel`**
   - Cancels user's active subscription (at end of billing period)
   - Response: `{ success: boolean, message: string, canceled_at_period_end: boolean }`

#### New Services

**SubscriptionService** (`backend/services/subscriptions/subscription_service.py`):
- `create_checkout_session()`: Creates Stripe Checkout session
- `verify_subscription_and_update()`: Verifies payment and activates subscription
- `get_subscription_status()`: Gets user's subscription status
- `cancel_subscription()`: Cancels subscription at period end

#### New Schemas

**Subscription Schemas** (`backend/schemas/subscription.py`):
- `CreateCheckoutSessionRequest`
- `CreateCheckoutSessionResponse`
- `SubscriptionStatusResponse`
- `VerifySubscriptionRequest`
- `VerifySubscriptionResponse`
- `CancelSubscriptionResponse`

### 3. Frontend Integration

#### New API Service

**subscriptionService** (`frontend/src/api/subscriptionService.ts`):
- `createCheckoutSession(subscriptionTierId)`: Creates Checkout session
- `verifySubscription(sessionId)`: Verifies subscription after payment
- `getSubscriptionStatus()`: Gets current subscription status
- `cancelSubscription()`: Cancels active subscription

#### Updated Components

**SubscriptionTiersPopover** (`frontend/src/components/popovers/creative/SubscriptionTiersPopover.tsx`):
- Added subscription purchase flow
- "Upgrade" button now redirects to Stripe Checkout
- Shows "Current Plan" for active tier
- Displays processing state during checkout creation

#### New Pages

1. **SubscriptionSuccess** (`frontend/src/pages/SubscriptionSuccess.tsx`):
   - Verifies subscription after successful payment
   - Shows success message and redirects to dashboard

2. **SubscriptionCanceled** (`frontend/src/pages/SubscriptionCanceled.tsx`):
   - Shown when user cancels during checkout
   - Allows user to return to dashboard

### 4. Routes

Added new routes in `App.tsx`:
- `/subscription-success` - Success page after payment
- `/subscription-canceled` - Cancel page if user abandons checkout

## How It Works

### Subscription Purchase Flow

1. User clicks "Upgrade" button on a subscription tier
2. Frontend calls `createCheckoutSession` API
3. Backend:
   - Checks if tier is paid (price > 0)
   - Gets or creates Stripe customer
   - Creates or retrieves Stripe product and price
   - Creates Stripe Checkout session
   - Updates database with Stripe IDs
4. User is redirected to Stripe Checkout
5. User completes payment
6. User is redirected to `/subscription-success?session_id={SESSION_ID}`
7. Frontend calls `verifySubscription` API
8. Backend:
   - Retrieves Stripe session
   - Verifies payment was successful
   - Cancels any existing active subscriptions
   - Creates new subscription record in database
   - Updates creative's `subscription_tier_id`
9. User sees success message and can continue to dashboard

### Subscription Benefits

When a user subscribes to a tier:
- Their `subscription_tier_id` in the `creatives` table is updated
- This affects:
  - **Transaction fees**: The `fee_percentage` from their subscription tier is used when calculating platform fees for payments
  - **Storage limits**: The `storage_amount_bytes` from their tier determines their file storage limit

### Transaction Fee Application

The existing payment system (`stripe_service.py`) already uses the subscription tier to calculate fees:

```python
# Get subscription tier to determine platform fee percentage
subscription_tier_id = creative.get('subscription_tier_id')
tier_result = client.table('subscription_tiers')\
    .select('fee_percentage')\
    .eq('id', subscription_tier_id)\
    .single()\
    .execute()

fee_percentage = float(tier_result.data.get('fee_percentage', 0))
platform_fee_amount = round(amount * fee_percentage, 2)
```

## Testing the System

### Prerequisites

1. Stripe account with API keys configured
2. Subscription tiers configured in database
3. Backend server running
4. Frontend server running

### Test Subscription Purchase

1. Log in as a creative user
2. Open the Subscription Tiers popover
3. Click "Upgrade" on a paid tier (e.g., "growth" at $25/month)
4. Complete payment in Stripe Checkout test mode:
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC
5. Verify you're redirected to success page
6. Check that your subscription is active

### Verify Subscription is Active

Query the database:
```sql
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID' AND status = 'active';
```

Check the creative's tier:
```sql
SELECT subscription_tier_id FROM creatives WHERE user_id = 'YOUR_USER_ID';
```

### Test Transaction Fee

1. Create a booking as a client
2. Process payment
3. Verify the platform fee matches the subscription tier's `fee_percentage`

## Database Policies

Row Level Security (RLS) policies have been configured:
- Users can view their own subscriptions
- Service role has full access

## Current Subscription Tiers

Based on the database:

| Name   | Price | Storage  | Fee Percentage | Tier Level |
|--------|-------|----------|----------------|------------|
| Growth | $25   | 1.0 GB   | 1%             | 2          |
| Beta   | $0    | 976.6 KB | 1%             | 1          |
| Basic  | $0    | 976.6 KB | 2.6%           | 1          |

**Tier Hierarchy System:**
- Tiers are ordered by `tier_level` (higher = better plan)
- Same tier level = lateral move (button hidden)
- Higher tier level = upgrade (shown with "Upgrade" button)
- Lower tier level = downgrade (shown with "Downgrade" button in grey)
- Current tier shows "Current Plan" button (disabled)
- **Top tier**: If already on the highest tier, no button is shown at all

## Future Enhancements

Potential improvements for the subscription system:

1. **Webhook Handler**: Implement Stripe webhook handler to automatically update subscription status when:
   - Payment fails
   - Subscription renews
   - Subscription is canceled
   - Billing period changes

2. **Trial Periods**: Add support for trial periods before charging

3. **Proration**: Handle mid-period upgrades/downgrades with proration

4. **Multiple Plans**: Allow users to have multiple subscriptions for different services

5. **Billing History**: Add view for users to see their billing history and invoices

6. **Usage Tracking**: Track storage usage and display warnings when approaching limits

7. **Annual Billing**: Add option for annual subscriptions with discounts

## File Structure

### Backend Files
```
backend/
├── api/
│   └── subscriptions/
│       ├── __init__.py
│       ├── subscription_router.py
│       └── subscriptions.py
├── services/
│   └── subscriptions/
│       ├── __init__.py
│       └── subscription_service.py
└── schemas/
    └── subscription.py
```

### Frontend Files
```
frontend/
├── src/
│   ├── api/
│   │   └── subscriptionService.ts
│   ├── pages/
│   │   ├── SubscriptionSuccess.tsx
│   │   └── SubscriptionCanceled.tsx
│   └── components/
│       └── popovers/
│           └── creative/
│               └── SubscriptionTiersPopover.tsx (updated)
```

## Environment Variables Required

Ensure these environment variables are set:

```env
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
```

## Notes

- Free tiers (price = $0) don't require payment and shouldn't go through the subscription flow
- The system automatically creates Stripe products and prices on first subscription attempt
- Subscriptions are canceled at the end of the billing period to ensure users get what they paid for
- The creative's `subscription_tier_id` is immediately updated upon successful subscription
