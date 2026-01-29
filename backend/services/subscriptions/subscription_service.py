import os
import stripe
from typing import Optional, Dict, Any
from fastapi import HTTPException
from supabase import Client
from dotenv import load_dotenv
import logging
from datetime import datetime
from db.db_session import db_admin
from core.safe_errors import log_exception_if_dev

load_dotenv()

# Initialize Stripe with secret key from environment
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
if not STRIPE_SECRET_KEY:
    raise ValueError("STRIPE_SECRET_KEY environment variable is required")

stripe.api_key = STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)


class SubscriptionService:
    @staticmethod
    async def create_checkout_session(
        user_id: str,
        subscription_tier_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Create a Stripe Checkout Session for subscription payment
        
        Args:
            user_id: The user ID subscribing
            subscription_tier_id: The subscription tier to subscribe to
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing checkout_url and session_id
        """
        try:
            # Get subscription tier details using admin client to bypass RLS
            tier_result = db_admin.table('subscription_tiers').select(
                'id, name, price, stripe_price_id, stripe_product_id'
            ).eq('id', subscription_tier_id).single().execute()
            
            if not tier_result.data:
                raise HTTPException(status_code=404, detail="Subscription tier not found")
            
            tier = tier_result.data
            
            # Check if this is a free tier (price = 0)
            if float(tier.get('price', 0)) == 0:
                raise HTTPException(
                    status_code=400, 
                    detail="This is a free tier. No payment required."
                )
            
            # Get or create Stripe customer using admin client
            user_result = db_admin.table('users').select('user_id, email').eq('user_id', user_id).single().execute()
            if not user_result.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_email = user_result.data.get('email')
            
            # Check if user already has a Stripe customer ID in user_subscriptions
            existing_sub = db_admin.table('user_subscriptions').select(
                'stripe_customer_id'
            ).eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()
            
            stripe_customer_id = None
            if existing_sub.data and existing_sub.data[0].get('stripe_customer_id'):
                stripe_customer_id = existing_sub.data[0]['stripe_customer_id']
            
            # Create Stripe customer if needed
            if not stripe_customer_id:
                customer = stripe.Customer.create(
                    email=user_email,
                    metadata={
                        'user_id': user_id
                    }
                )
                stripe_customer_id = customer.id
            
            # Check if Stripe price exists, create if not
            stripe_price_id = tier.get('stripe_price_id')
            if not stripe_price_id:
                # Create product and price in Stripe
                stripe_product_id = tier.get('stripe_product_id')
                
                if not stripe_product_id:
                    product = stripe.Product.create(
                        name=f"{tier['name']} Subscription",
                        description=f"Monthly subscription to {tier['name']} tier"
                    )
                    stripe_product_id = product.id
                    
                    # Update database with product ID using admin client
                    db_admin.table('subscription_tiers').update({
                        'stripe_product_id': stripe_product_id
                    }).eq('id', subscription_tier_id).execute()
                
                # Create price
                price_cents = int(float(tier['price']) * 100)
                price = stripe.Price.create(
                    product=stripe_product_id,
                    unit_amount=price_cents,
                    currency='usd',
                    recurring={
                        'interval': 'month'
                    }
                )
                stripe_price_id = price.id
                
                # Update database with price ID using admin client
                db_admin.table('subscription_tiers').update({
                    'stripe_price_id': stripe_price_id
                }).eq('id', subscription_tier_id).execute()
            
            # Get frontend URL for redirects
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            
            # Create Checkout Session for subscription
            checkout_session = stripe.checkout.Session.create(
                customer=stripe_customer_id,
                line_items=[{
                    'price': stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f'{frontend_url}/subscription-success?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{frontend_url}/subscription-canceled',
                metadata={
                    'user_id': user_id,
                    'subscription_tier_id': subscription_tier_id,
                },
            )
            
            return {
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id
            }
            
        except stripe.error.StripeError as e:
            log_exception_if_dev(logger, "Stripe error creating checkout session", e)
            raise HTTPException(status_code=400, detail="Failed to create checkout session. Please try again.")
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error creating checkout session", e)
            raise HTTPException(status_code=500, detail="Failed to create checkout session")
    
    @staticmethod
    async def verify_subscription_and_update(
        session_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Verify a Stripe subscription session and update user subscription
        
        Args:
            session_id: The Stripe checkout session ID
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing success status and subscription info
        """
        try:
            # Retrieve the checkout session from Stripe
            checkout_session = stripe.checkout.Session.retrieve(
                session_id,
                expand=['subscription']
            )
            
            # Verify payment was successful
            if checkout_session.payment_status != 'paid':
                raise HTTPException(
                    status_code=400, 
                    detail=f"Payment not completed. Status: {checkout_session.payment_status}"
                )
            
            # Get metadata
            user_id = checkout_session.metadata.get('user_id')
            subscription_tier_id = checkout_session.metadata.get('subscription_tier_id')
            
            if not user_id or not subscription_tier_id:
                raise HTTPException(
                    status_code=400,
                    detail="Missing user or subscription tier information"
                )
            
            # Get subscription details from Stripe
            stripe_subscription = checkout_session.subscription
            if isinstance(stripe_subscription, str):
                stripe_subscription = stripe.Subscription.retrieve(stripe_subscription)
            
            # Cancel any existing active subscriptions for this user using admin client
            existing_subs = db_admin.table('user_subscriptions').select('*').eq(
                'user_id', user_id
            ).eq('status', 'active').execute()
            
            for sub in existing_subs.data:
                # Cancel in Stripe
                if sub.get('stripe_subscription_id'):
                    try:
                        stripe.Subscription.modify(
                            sub['stripe_subscription_id'],
                            cancel_at_period_end=True
                        )
                    except Exception as e:
                        log_exception_if_dev(logger, "Failed to cancel old subscription in Stripe", e)
                
                # Update status in database using admin client
                db_admin.table('user_subscriptions').update({
                    'status': 'canceled',
                    'cancel_at_period_end': True,
                    'canceled_at': datetime.utcnow().isoformat()
                }).eq('id', sub['id']).execute()
            
            # Create new subscription record using admin client to bypass RLS
            subscription_data = {
                'user_id': user_id,
                'subscription_tier_id': subscription_tier_id,
                'stripe_subscription_id': stripe_subscription.id,
                'stripe_customer_id': checkout_session.customer,
                'status': stripe_subscription.status,
                'current_period_start': datetime.fromtimestamp(stripe_subscription.current_period_start).isoformat(),
                'current_period_end': datetime.fromtimestamp(stripe_subscription.current_period_end).isoformat(),
                'cancel_at_period_end': stripe_subscription.cancel_at_period_end or False,
            }
            
            insert_result = db_admin.table('user_subscriptions').insert(subscription_data).execute()
            
            if not insert_result.data:
                raise HTTPException(status_code=500, detail="Failed to create subscription record")
            
            # Update creative's subscription_tier_id using admin client
            db_admin.table('creatives').update({
                'subscription_tier_id': subscription_tier_id
            }).eq('user_id', user_id).execute()
            
            return {
                "success": True,
                "message": "Subscription activated successfully",
                "subscription_tier_id": subscription_tier_id,
                "subscription_status": stripe_subscription.status
            }
            
        except stripe.error.StripeError as e:
            log_exception_if_dev(logger, "Stripe error verifying subscription", e)
            raise HTTPException(status_code=400, detail="Subscription verification failed. Please try again.")
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error verifying subscription", e)
            raise HTTPException(status_code=500, detail="Failed to verify subscription")
    
    @staticmethod
    async def get_subscription_status(
        user_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Get the current subscription status for a user
        
        Args:
            user_id: The user ID
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing subscription status information
        """
        try:
            # Get active subscription using admin client
            sub_result = db_admin.table('user_subscriptions').select(
                '*, subscription_tiers(id, name)'
            ).eq('user_id', user_id).eq('status', 'active').order(
                'created_at', desc=True
            ).limit(1).execute()
            
            if not sub_result.data or len(sub_result.data) == 0:
                return {
                    "has_subscription": False
                }
            
            sub = sub_result.data[0]
            tier = sub.get('subscription_tiers', {})
            
            return {
                "has_subscription": True,
                "subscription_tier_id": sub.get('subscription_tier_id'),
                "subscription_tier_name": tier.get('name') if tier else None,
                "status": sub.get('status'),
                "current_period_start": sub.get('current_period_start'),
                "current_period_end": sub.get('current_period_end'),
                "cancel_at_period_end": sub.get('cancel_at_period_end'),
                "stripe_customer_id": sub.get('stripe_customer_id')
            }
            
        except Exception as e:
            log_exception_if_dev(logger, "Error getting subscription status", e)
            raise HTTPException(status_code=500, detail="Failed to get subscription status")
    
    @staticmethod
    async def cancel_subscription(
        user_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Cancel a user's subscription (at end of billing period)
        
        Args:
            user_id: The user ID
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing cancellation status
        """
        try:
            # Get active subscription using admin client
            sub_result = db_admin.table('user_subscriptions').select('*').eq(
                'user_id', user_id
            ).eq('status', 'active').order('created_at', desc=True).limit(1).execute()
            
            if not sub_result.data or len(sub_result.data) == 0:
                raise HTTPException(status_code=404, detail="No active subscription found")
            
            sub = sub_result.data[0]
            stripe_subscription_id = sub.get('stripe_subscription_id')
            
            if not stripe_subscription_id:
                raise HTTPException(status_code=400, detail="No Stripe subscription ID found")
            
            # Cancel subscription in Stripe (at end of period)
            updated_subscription = stripe.Subscription.modify(
                stripe_subscription_id,
                cancel_at_period_end=True
            )
            
            # Update database using admin client
            db_admin.table('user_subscriptions').update({
                'cancel_at_period_end': True,
                'canceled_at': datetime.utcnow().isoformat()
            }).eq('id', sub['id']).execute()
            
            return {
                "success": True,
                "message": "Subscription will be canceled at the end of the billing period",
                "canceled_at_period_end": True
            }
            
        except stripe.error.StripeError as e:
            log_exception_if_dev(logger, "Stripe error canceling subscription", e)
            raise HTTPException(status_code=400, detail="Failed to cancel subscription. Please try again.")
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error canceling subscription", e)
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")
    
    @staticmethod
    async def get_billing_details(
        user_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Get complete billing details for a user including subscription, payment method, and invoices
        
        Args:
            user_id: The user ID
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing billing details
        """
        try:
            # Get user's active subscription from database
            sub_result = db_admin.table('user_subscriptions').select(
                'id, subscription_tier_id, stripe_subscription_id, stripe_customer_id, status, '
                'current_period_start, current_period_end, cancel_at_period_end, canceled_at'
            ).eq('user_id', user_id).eq('status', 'active').execute()
            
            response_data = {
                "has_subscription": False,
                "subscription_tier": None,
                "subscription_status": None,
                "current_period_start": None,
                "current_period_end": None,
                "cancel_at_period_end": None,
                "canceled_at": None,
                "payment_method": None,
                "invoices": [],
                "is_top_tier": False,
                "stripe_customer_id": None
            }
            
            if not sub_result.data or len(sub_result.data) == 0:
                # No active subscription - return empty response
                return response_data
            
            sub = sub_result.data[0]
            response_data["has_subscription"] = True
            response_data["subscription_status"] = sub.get('status')
            response_data["current_period_start"] = sub.get('current_period_start')
            response_data["current_period_end"] = sub.get('current_period_end')
            response_data["cancel_at_period_end"] = sub.get('cancel_at_period_end', False)
            response_data["canceled_at"] = sub.get('canceled_at')
            response_data["stripe_customer_id"] = sub.get('stripe_customer_id')
            
            # Get subscription tier details
            tier_result = db_admin.table('subscription_tiers').select(
                'id, name, price, storage_amount_bytes, storage_display, description, '
                'fee_percentage, is_active, tier_level, stripe_product_id, stripe_price_id'
            ).eq('id', sub['subscription_tier_id']).single().execute()
            
            if tier_result.data:
                response_data["subscription_tier"] = tier_result.data
                
                # Check if this is the top tier
                all_tiers_result = db_admin.table('subscription_tiers').select('tier_level').execute()
                if all_tiers_result.data:
                    max_tier_level = max(t['tier_level'] for t in all_tiers_result.data)
                    response_data["is_top_tier"] = tier_result.data['tier_level'] >= max_tier_level
            
            # Fetch payment method and invoices from Stripe if we have a customer ID
            stripe_customer_id = sub.get('stripe_customer_id')
            if stripe_customer_id:
                try:
                    # Get payment methods
                    payment_methods = stripe.PaymentMethod.list(
                        customer=stripe_customer_id,
                        type='card',
                        limit=1
                    )
                    
                    if payment_methods.data and len(payment_methods.data) > 0:
                        pm = payment_methods.data[0]
                        response_data["payment_method"] = {
                            "id": pm.id,
                            "brand": pm.card.brand if pm.card else None,
                            "last4": pm.card.last4 if pm.card else None,
                            "exp_month": pm.card.exp_month if pm.card else None,
                            "exp_year": pm.card.exp_year if pm.card else None,
                            "is_default": True
                        }
                    
                    # Get invoices
                    invoices = stripe.Invoice.list(
                        customer=stripe_customer_id,
                        limit=10
                    )
                    
                    response_data["invoices"] = [
                        {
                            "id": inv.id,
                            "number": inv.number,
                            "amount_due": inv.amount_due,
                            "amount_paid": inv.amount_paid,
                            "status": inv.status,
                            "created": datetime.fromtimestamp(inv.created).isoformat(),
                            "invoice_pdf": inv.invoice_pdf,
                            "hosted_invoice_url": inv.hosted_invoice_url,
                            "period_start": datetime.fromtimestamp(inv.period_start).isoformat() if inv.period_start else None,
                            "period_end": datetime.fromtimestamp(inv.period_end).isoformat() if inv.period_end else None
                        }
                        for inv in invoices.data
                    ]
                    
                except stripe.error.StripeError as e:
                    log_exception_if_dev(logger, "Stripe error fetching payment details", e)
                    # Continue without payment method/invoice data
            
            return response_data
            
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error getting billing details", e)
            raise HTTPException(status_code=500, detail="Failed to get billing details")
    
    @staticmethod
    async def create_billing_portal_session(
        user_id: str,
        client: Client,
        return_url: str
    ) -> Dict[str, Any]:
        """Create a Stripe Billing Portal session for managing payment methods
        
        Args:
            user_id: The user ID
            client: Supabase client for database operations
            return_url: URL to return to after managing payment methods
            
        Returns:
            Dictionary containing portal_url
        """
        try:
            # Get user's stripe customer ID from active subscription
            sub_result = db_admin.table('user_subscriptions').select(
                'stripe_customer_id'
            ).eq('user_id', user_id).eq('status', 'active').execute()
            
            if not sub_result.data or len(sub_result.data) == 0:
                raise HTTPException(status_code=404, detail="No active subscription found")
            
            stripe_customer_id = sub_result.data[0].get('stripe_customer_id')
            
            if not stripe_customer_id:
                raise HTTPException(status_code=400, detail="No Stripe customer ID found")
            
            # Create billing portal session
            portal_session = stripe.billing_portal.Session.create(
                customer=stripe_customer_id,
                return_url=return_url,
            )
            
            return {
                "portal_url": portal_session.url
            }
            
        except stripe.error.StripeError as e:
            log_exception_if_dev(logger, "Stripe error creating billing portal session", e)
            raise HTTPException(status_code=400, detail="Failed to create billing portal session. Please try again.")
        except HTTPException:
            raise
        except Exception as e:
            log_exception_if_dev(logger, "Error creating billing portal session", e)
            raise HTTPException(status_code=500, detail="Failed to create billing portal session")
