import os
import stripe
from typing import Optional, Dict, Any
from fastapi import HTTPException
from supabase import Client
from dotenv import load_dotenv
import logging
from datetime import datetime
from db.db_session import db_admin

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
            logger.error(f"Stripe error creating checkout session: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")
    
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
                        logger.warning(f"Failed to cancel old subscription in Stripe: {e}")
                
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
            logger.error(f"Stripe error verifying subscription: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verifying subscription: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to verify subscription: {str(e)}")
    
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
            logger.error(f"Error getting subscription status: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get subscription status: {str(e)}")
    
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
            logger.error(f"Stripe error canceling subscription: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error canceling subscription: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")
