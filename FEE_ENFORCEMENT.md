# Transaction Fee Enforcement System

## Overview

The transaction fee system in EZ-web is based on the user's subscription plan. Different subscription tiers have different `fee_percentage` values that determine the platform fee charged on each transaction.

## Database Structure

### Subscription Tiers Table

The `subscription_tiers` table stores the fee percentage as a **decimal value**:

| Name   | Price | Fee Percentage | Meaning |
|--------|-------|----------------|---------|
| Beta   | $0    | 0.01          | 1%      |
| basic  | $0    | 0.026         | 2.6%    |
| growth | $25   | 0.01          | 1%      |

**Important**: `fee_percentage` is stored as a decimal (0.01 = 1%, 0.026 = 2.6%), NOT as a whole number.

### Creative User Linking

Each creative user has a `subscription_tier_id` field in the `creatives` table that links them to their current subscription tier. This is automatically updated when:
- A creative signs up (default tier assigned)
- A creative subscribes to a new plan
- A subscription is changed/upgraded/downgraded

## Backend Fee Calculation

### 1. Direct Booking Payments (`stripe_service.py`)

**Location**: `backend/services/stripe/stripe_service.py`

```python
# Get subscription tier to determine platform fee percentage
subscription_tier_id = creative.get('subscription_tier_id')
tier_result = client.table('subscription_tiers')\
    .select('fee_percentage')\
    .eq('id', subscription_tier_id)\
    .single()\
    .execute()

fee_percentage = float(tier_result.data.get('fee_percentage', 0))

# Calculate platform fee (application fee)
# fee_percentage is stored as decimal (e.g., 0.01 = 1%, 0.026 = 2.6%)
platform_fee_amount = round(amount * fee_percentage, 2)

# Convert to cents for Stripe
application_fee_cents = int(round(platform_fee_amount * 100))
```

**When Applied**: 
- When a client pays for a booking through Stripe Checkout
- The fee is applied as an `application_fee_amount` on the Stripe payment

### 2. Payment Request Payments (`payment_request_service.py`)

**Location**: `backend/services/payment_requests/payment_request_service.py`

```python
# Get subscription tier to determine platform fee percentage
subscription_tier_id = creative.get('subscription_tier_id')
tier_result = client.table('subscription_tiers')\
    .select('fee_percentage')\
    .eq('id', subscription_tier_id)\
    .single()\
    .execute()

fee_percentage = float(tier_result.data.get('fee_percentage', 0))

# Calculate platform fee (application fee)
# fee_percentage is stored as decimal (e.g., 0.01 = 1%, 0.026 = 2.6%)
platform_fee_amount = round(amount * fee_percentage, 2)

# Convert to cents for Stripe
application_fee_cents = int(round(platform_fee_amount * 100))
```

**When Applied**:
- When a client pays a direct payment request from a creative
- The fee is applied as an `application_fee_amount` on the Stripe payment

**Bug Fixed**: Previously this was incorrectly dividing by 100 (`amount * fee_percentage / 100`), which would have charged 100x less than intended. This has been corrected.

## Frontend Fee Display

### 1. Subscription Tier Selection

**Location**: `frontend/src/components/popovers/creative/SubscriptionTiersPopover.tsx`

```typescript
// Display fee percentage
{(tier.fee_percentage * 100).toFixed(1)}% platform fee
```

### 2. Service Creation/Edit Form

**Location**: `frontend/src/components/popovers/creative/ServiceFormPopover.tsx`

```typescript
// Calculate earnings breakdown
const price = parseFloat(formData.price);
const feePercentage = creativeProfile.subscription_tier_fee_percentage;
const platformFee = price * feePercentage;
const yourEarnings = price - platformFee;
const feePercentageDisplay = (feePercentage * 100).toFixed(1);
```

**Shows**:
- Service price
- Transaction fee (with percentage)
- Your earnings (after fee)

### 3. Direct Payment Request Form

**Location**: `frontend/src/components/popovers/creative/DirectPaymentPopover.tsx`

```typescript
// Calculate earnings breakdown for payment request
const requestAmount = parseFloat(amount);
const feePercentage = creativeProfile.subscription_tier_fee_percentage;
const platformFee = requestAmount * feePercentage;
const yourEarnings = requestAmount - platformFee;
const feePercentageDisplay = (feePercentage * 100).toFixed(1);
```

**Shows**:
- Payment request amount
- Transaction fee (with percentage)
- Your net earnings (after fee)

### 4. Setup Flow

**Location**: `frontend/src/components/popovers/setup/CreativeSetupPopover.tsx`

Displays fee percentage when selecting a subscription tier during initial setup:

```typescript
{(tier.fee_percentage * 100).toFixed(1)}% fee
```

## How Fees Are Applied

### Direct Charges Flow

1. **Client initiates payment** for a booking or payment request
2. **Backend fetches creative's subscription tier** from database
3. **Platform fee is calculated** based on tier's `fee_percentage`
4. **Stripe Checkout Session is created** with:
   - Full amount charged to client
   - `application_fee_amount` set to platform fee
   - Payment goes to creative's connected account
5. **Stripe automatically splits payment**:
   - Creative receives: `amount - application_fee`
   - Platform receives: `application_fee`

### Important Notes

- Fees are deducted **at payment time** by Stripe
- Creatives see only their **net earnings** (after fees) in their Stripe account
- The platform receives fees directly in the main Stripe account
- All fee calculations use the **current** subscription tier at the time of payment

## Analytics and Reporting

### Creative Dashboard

**Location**: `backend/api/creative/analytics.py`

- `total_earnings`: Sum of `amount_paid` from completed bookings
- This represents **net earnings** (already has fees deducted by Stripe)
- Analytics don't show platform fees because they're transparent to the creative

### What Creatives See

- **Earnings**: Amount they actually receive (after fees)
- **Subscription Plan**: Their current tier name
- **Unpaid Pending**: Amounts owed but not yet paid
- **Completed Projects**: Number of finished projects

## Fee Enforcement Checklist

✅ **Database**
- `subscription_tiers` table has `fee_percentage` column (decimal)
- `creatives` table has `subscription_tier_id` foreign key
- RLS policies allow reading subscription tiers

✅ **Backend - Payment Processing**
- `stripe_service.py` calculates fees correctly (no division by 100)
- `payment_request_service.py` calculates fees correctly (FIXED)
- Both use `application_fee_amount` in Stripe API
- Both fetch fee from subscription tier at payment time

✅ **Backend - Subscription Management**
- Subscribing updates `creatives.subscription_tier_id`
- Subscription verification enforces active subscriptions only
- Old subscriptions are canceled when upgrading

✅ **Frontend - Fee Display**
- Subscription tier selection shows fees (multiplies by 100 for display)
- Service form shows earnings breakdown with fees
- Direct payment request form shows earnings breakdown with fees
- Setup flow shows fees when selecting tier

✅ **Frontend - Fee Calculation**
- Service form calculates net earnings correctly
- Direct payment form calculates net earnings correctly
- Split payments calculate fees on both payments
- All calculations match backend logic

## Testing Fee Enforcement

### Test Scenarios

1. **Basic Plan User (2.6% fee)**
   - Subscribe to basic plan
   - Create a $100 service
   - Verify fee calculation shows: $2.60 fee, $97.40 earnings
   - Complete payment
   - Verify Stripe shows $97.40 to creative, $2.60 to platform

2. **Growth Plan User (1% fee)**
   - Subscribe to growth plan ($25/month)
   - Create a $100 service
   - Verify fee calculation shows: $1.00 fee, $99.00 earnings
   - Complete payment
   - Verify Stripe shows $99.00 to creative, $1.00 to platform

3. **Payment Request (uses tier fee)**
   - Create payment request as creative
   - Client pays
   - Verify correct fee based on creative's tier

### Verification Commands

```sql
-- Check subscription tiers
SELECT name, price, fee_percentage FROM public.subscription_tiers;

-- Check creative's current tier
SELECT c.user_id, c.subscription_tier_id, st.name, st.fee_percentage
FROM public.creatives c
JOIN public.subscription_tiers st ON c.subscription_tier_id = st.id
WHERE c.user_id = 'USER_ID';

-- Check active subscription
SELECT * FROM public.user_subscriptions 
WHERE user_id = 'USER_ID' AND status = 'active';
```

## Common Issues and Solutions

### Issue: Fees not being applied
**Cause**: Creative doesn't have a valid `subscription_tier_id`
**Solution**: Ensure all creatives have a default tier assigned during signup

### Issue: Wrong fee amount
**Cause**: Incorrect fee calculation (dividing by 100 when shouldn't)
**Solution**: Verify calculation uses `amount * fee_percentage` (not `amount * fee_percentage / 100`)

### Issue: Fee doesn't match subscription
**Cause**: Creative's `subscription_tier_id` not updated after subscription
**Solution**: Verify subscription service updates `creatives.subscription_tier_id` after successful payment

### Issue: Frontend shows wrong fee
**Cause**: Not multiplying by 100 for display, or using wrong field
**Solution**: Always display as `(fee_percentage * 100).toFixed(1)}%`

## Future Enhancements

1. **Stripe Webhooks**: Automatically handle subscription updates (renewal, cancellation, payment failures)
2. **Fee History**: Track historical fees for each transaction
3. **Dynamic Fee Tiers**: Allow custom fee percentages for VIP creatives
4. **Fee Reports**: Dashboard showing total fees collected per creative
5. **Proration**: Handle mid-period subscription changes with fee adjustments
6. **Volume Discounts**: Reduce fees for high-volume creatives

## Environment Variables

Required environment variables for fee system:

```env
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # (Future) For webhook verification
FRONTEND_URL=http://localhost:3000     # For checkout redirects
```

## Security Considerations

- ✅ Fees are calculated server-side (not trusting frontend)
- ✅ Subscription tier fetched from database at payment time
- ✅ Stripe handles actual fee splitting (not manual transfers)
- ✅ RLS policies prevent unauthorized tier modifications
- ✅ Application fees are immutable once set in Stripe
- ✅ Admin access required to modify subscription tiers

## Summary

The transaction fee system is fully enforced throughout the application:

1. **Database**: Stores fee percentages as decimals in subscription tiers
2. **Backend**: Calculates fees correctly in both payment flows (direct bookings and payment requests)
3. **Frontend**: Displays fees accurately and calculates earnings breakdowns
4. **Stripe**: Automatically splits payments according to application fees
5. **Subscriptions**: Updates creative's tier when they subscribe, immediately affecting their fees

All payment flows check the creative's current subscription tier and apply the corresponding fee percentage at the time of payment processing.
