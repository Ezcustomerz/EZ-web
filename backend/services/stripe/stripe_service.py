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


class StripeService:
    @staticmethod
    async def create_connect_account(user_id: str, email: str, client: Client) -> Dict[str, Any]:
        """Create a Stripe Connect Express account for a creative
        
        Args:
            user_id: The user ID of the creative
            email: The email address of the creative
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing account_id and onboarding_url
        """
        try:
            # Check if account already exists
            creative_result = client.table('creatives').select('stripe_account_id').eq('user_id', user_id).single().execute()
            
            if creative_result.data and creative_result.data.get('stripe_account_id'):
                # Account already exists, create new onboarding link
                account_id = creative_result.data['stripe_account_id']
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
                account_link = stripe.AccountLink.create(
                    account=account_id,
                    refresh_url=f"{frontend_url}/creative?stripe_refresh=true",
                    return_url=f"{frontend_url}/creative?stripe_success=true",
                    type="account_onboarding",
                )
                
                return {
                    "account_id": account_id,
                    "onboarding_url": account_link.url
                }
            
            # Create new Express account
            account = stripe.Account.create(
                type="express",
                country="US",  # Default to US, can be made configurable
                email=email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            
            # Save account ID to database
            client.table('creatives').update({
                'stripe_account_id': account.id,
                'stripe_onboarding_complete': False,
                'stripe_payouts_enabled': False
            }).eq('user_id', user_id).execute()
            
            # Create onboarding link
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            account_link = stripe.AccountLink.create(
                account=account.id,
                refresh_url=f"{frontend_url}/creative?stripe_refresh=true",
                return_url=f"{frontend_url}/creative?stripe_success=true",
                type="account_onboarding",
            )
            
            return {
                "account_id": account.id,
                "onboarding_url": account_link.url
            }
            
        except stripe.error.StripeError as e:
            error_message = str(e)
            # Provide more helpful error messages
            if "Connect" in error_message or "connect" in error_message.lower():
                raise HTTPException(
                    status_code=400, 
                    detail="Stripe Connect is not enabled on your account. Please enable Connect in your Stripe Dashboard at https://dashboard.stripe.com/settings/connect"
                )
            raise HTTPException(status_code=400, detail=f"Stripe error: {error_message}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create Stripe account: {str(e)}")
    
    @staticmethod
    async def get_account_status(user_id: str, client: Client) -> Dict[str, Any]:
        """Get the Stripe account status for a creative
        
        Args:
            user_id: The user ID of the creative
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing account status information
        """
        try:
            creative_result = client.table('creatives').select(
                'stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled, stripe_account_type, stripe_last_payout_date'
            ).eq('user_id', user_id).single().execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found")
            
            creative_data = creative_result.data
            account_id = creative_data.get('stripe_account_id')
            
            if not account_id:
                return {
                    "connected": False,
                    "payouts_enabled": False,
                    "onboarding_complete": False
                }
            
            # Fetch account details from Stripe
            try:
                account = stripe.Account.retrieve(account_id)
                
                # Update database with current status
                payouts_enabled = getattr(account, 'payouts_enabled', False)
                details_submitted = getattr(account, 'details_submitted', False)
                stripe_account_type = getattr(account, 'type', None)
                
                # Get payout disable reason and requirements
                requirements = getattr(account, 'requirements', None)
                payout_disable_reason = None
                currently_due_requirements = []
                
                if not payouts_enabled:
                    # Check capabilities for transfers (payouts) disabled reason
                    capabilities = getattr(account, 'capabilities', None)
                    if capabilities and hasattr(capabilities, 'transfers'):
                        transfers_cap = capabilities.transfers
                        if hasattr(transfers_cap, 'requirements') and transfers_cap.requirements:
                            if hasattr(transfers_cap.requirements, 'disabled_reason') and transfers_cap.requirements.disabled_reason:
                                payout_disable_reason = transfers_cap.requirements.disabled_reason
                    
                    # If no reason from capabilities, check account requirements
                    if not payout_disable_reason and requirements:
                        # Check if there's a specific payout disable reason
                        if hasattr(requirements, 'disabled_reason') and requirements.disabled_reason:
                            payout_disable_reason = requirements.disabled_reason
                        # Check currently_due requirements
                        if hasattr(requirements, 'currently_due') and requirements.currently_due:
                            currently_due_requirements = list(requirements.currently_due)
                            # Format the requirements into a readable message if no specific reason
                            if not payout_disable_reason and currently_due_requirements:
                                # Format requirement names to be more readable
                                formatted_reqs = []
                                for req in currently_due_requirements[:3]:
                                    formatted_req = req.replace('_', ' ').replace('.', ' ').title()
                                    formatted_reqs.append(formatted_req)
                                payout_disable_reason = f"Missing required information: {', '.join(formatted_reqs)}"
                                if len(currently_due_requirements) > 3:
                                    payout_disable_reason += f" and {len(currently_due_requirements) - 3} more"
                    
                    # Default message if no specific reason found
                    if not payout_disable_reason:
                        payout_disable_reason = "Account setup incomplete. Please complete your Stripe account verification."
                
                # Map Stripe account type to our database constraint values
                # Stripe Express accounts have type='express', but we need to check business_type
                # to determine if it's individual or company
                account_type = None
                if stripe_account_type == 'express':
                    # For Express accounts, check business_type to determine individual vs company
                    business_type = getattr(account, 'business_type', None)
                    if business_type == 'individual':
                        account_type = 'individual'
                    elif business_type in ['company', 'non_profit']:
                        account_type = 'company'
                    # If business_type is not set yet, leave as None
                elif stripe_account_type in ['individual', 'company']:
                    account_type = stripe_account_type
                # For other types (standard, custom), leave as None
                
                # Get last payout date
                last_payout_date_unix = None
                last_payout_date_iso = None
                try:
                    payouts = stripe.Payout.list(limit=1, stripe_account=account_id)
                    if payouts.data and len(payouts.data) > 0:
                        # Keep Unix timestamp for API response (frontend expects this)
                        last_payout_date_unix = payouts.data[0].created
                        if last_payout_date_unix:
                            # Convert Unix timestamp to ISO format string for PostgreSQL
                            # Stripe timestamps are in seconds, convert to datetime then ISO string
                            last_payout_date_iso = datetime.utcfromtimestamp(last_payout_date_unix).isoformat() + 'Z'
                except Exception:
                    # If payouts list fails, account might not be fully set up yet
                    pass
                
                # Update database with ISO format timestamp
                client.table('creatives').update({
                    'stripe_onboarding_complete': details_submitted,
                    'stripe_payouts_enabled': payouts_enabled,
                    'stripe_account_type': account_type,  # Will be None, 'individual', or 'company'
                    'stripe_last_payout_date': last_payout_date_iso
                }).eq('user_id', user_id).execute()
                
                return {
                    "connected": True,
                    "account_id": account_id,
                    "payouts_enabled": payouts_enabled,
                    "onboarding_complete": details_submitted,
                    "account_type": account_type,
                    "last_payout_date": last_payout_date_unix,  # Return Unix timestamp for frontend
                    "payout_disable_reason": payout_disable_reason,
                    "currently_due_requirements": currently_due_requirements
                }
            except stripe.error.StripeError as e:
                # If account doesn't exist in Stripe, reset database
                if e.code == 'resource_missing':
                    client.table('creatives').update({
                        'stripe_account_id': None,
                        'stripe_onboarding_complete': False,
                        'stripe_payouts_enabled': False
                    }).eq('user_id', user_id).execute()
                
                logging.error("Stripe error in get_account_status for user %s: %s", user_id, str(e))
                return {
                    "connected": False,
                    "payouts_enabled": False,
                    "onboarding_complete": False,
                    "error": "Could not retrieve account status from Stripe. Please try again later."
                }
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get account status: {str(e)}")
    
    @staticmethod
    async def create_login_link(user_id: str, client: Client) -> Dict[str, Any]:
        """Create a login link for the Stripe Express account dashboard
        
        Args:
            user_id: The user ID of the creative
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing login_url
        """
        try:
            creative_result = client.table('creatives').select('stripe_account_id').eq('user_id', user_id).single().execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative profile not found")
            
            account_id = creative_result.data.get('stripe_account_id')
            
            if not account_id:
                raise HTTPException(status_code=400, detail="Stripe account not connected")
            
            # Create login link
            login_link = stripe.Account.create_login_link(account_id)
            
            return {
                "login_url": login_link.url
            }
            
        except stripe.error.StripeError as e:
            error_message = str(e)
            # Check if account hasn't completed onboarding
            if "onboarding" in error_message.lower() or "not completed" in error_message.lower():
                # Return a special response indicating onboarding is needed
                logging.error(f"Stripe onboarding error for user {user_id}: {error_message}")
                return {
                    "login_url": None,
                    "needs_onboarding": True,
                    "error": "Stripe onboarding incomplete. Please complete onboarding in your Stripe dashboard."
                }
            # Provide more helpful error messages
            if "Connect" in error_message or "connect" in error_message.lower():
                raise HTTPException(
                    status_code=400, 
                    detail="Stripe Connect is not enabled on your account. Please enable Connect in your Stripe Dashboard at https://dashboard.stripe.com/settings/connect"
                )
            logging.error(f"Stripe error for user {user_id}, account {account_id}: {error_message}")
            raise HTTPException(status_code=400, detail="Failed to create login link due to a Stripe error. Please try again later or contact support.")
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Unexpected error in create_login_link for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="An internal server error occurred while creating the Stripe login link.")
    
    @staticmethod
    async def process_payment(
        booking_id: str,
        amount: float,
        client_user_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Create a Stripe Checkout Session for a booking using Stripe Connect Direct Charges
        
        Args:
            booking_id: The booking ID to process payment for
            amount: The payment amount in dollars
            client_user_id: The user ID of the client making the payment
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing checkout_url and session_id
        """
        try:
            # Get booking details including creative_user_id
            booking_result = client.table('bookings')\
                .select('id, creative_user_id, price, payment_option, client_user_id')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if not booking_result.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_result.data
            
            # Verify the booking belongs to this client
            if booking['client_user_id'] != client_user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to pay for this booking")
            
            creative_user_id = booking['creative_user_id']
            
            # Get creative's Stripe account ID and subscription tier
            creative_result = client.table('creatives')\
                .select('stripe_account_id, subscription_tier_id')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative not found")
            
            creative = creative_result.data
            stripe_account_id = creative.get('stripe_account_id')
            
            if not stripe_account_id:
                raise HTTPException(status_code=400, detail="Creative has not connected their Stripe account")
            
            # Get subscription tier to determine platform fee percentage
            subscription_tier_id = creative.get('subscription_tier_id')
            tier_result = client.table('subscription_tiers')\
                .select('fee_percentage')\
                .eq('id', subscription_tier_id)\
                .single()\
                .execute()
            
            if not tier_result.data:
                raise HTTPException(status_code=404, detail="Subscription tier not found")
            
            fee_percentage = float(tier_result.data.get('fee_percentage', 0))
            
            # Calculate platform fee (application fee)
            platform_fee_amount = round(amount * fee_percentage, 2)
            
            # Convert to cents for Stripe
            amount_cents = int(round(amount * 100))
            application_fee_cents = int(round(platform_fee_amount * 100))
            
            # Get frontend URL for redirects
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            
            # Create Checkout Session on the connected account (Direct Charge)
            # When using stripe_account parameter, we're already creating on behalf of that account
            # So we don't need on_behalf_of in payment_intent_data
            checkout_session = stripe.checkout.Session.create(
                payment_intent_data={
                    'application_fee_amount': application_fee_cents,
                },
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Service Payment - Booking #{booking_id[:8]}',
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&booking_id={booking_id}',
                cancel_url=f'{frontend_url}/payment-cancelled?booking_id={booking_id}',
                metadata={
                    'booking_id': booking_id,
                    'creative_user_id': creative_user_id,
                    'client_user_id': client_user_id,
                    'platform_fee_percentage': str(fee_percentage),
                    'platform_fee_amount': str(platform_fee_amount),
                },
                stripe_account=stripe_account_id,
            )
            
            return {
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id,
                "amount": amount,
                "platform_fee": platform_fee_amount,
                "creative_amount": round(amount - platform_fee_amount, 2)
            }
            
        except stripe.error.StripeError as e:
            error_message = str(e)
            if "Connect" in error_message or "connect" in error_message.lower():
                raise HTTPException(
                    status_code=400, 
                    detail="Stripe Connect is not enabled on your account. Please enable Connect in your Stripe Dashboard."
                )
            raise HTTPException(status_code=400, detail=f"Stripe error: {error_message}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")
    
    @staticmethod
    async def verify_payment_and_update_booking(
        session_id: str,
        booking_id: str,
        client: Client
    ) -> Dict[str, Any]:
        """Verify a Stripe payment session and update booking status/amount_paid
        
        Args:
            session_id: The Stripe checkout session ID
            booking_id: The booking ID
            client: Supabase client for database operations
            
        Returns:
            Dictionary containing success status and updated booking info
        """
        from datetime import datetime
        
        try:
            # Get booking details first to find the creative's Stripe account
            booking_result = client.table('bookings')\
                .select('id, price, payment_option, amount_paid, client_status, creative_status, client_user_id, creative_user_id, service_id')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if not booking_result.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_result.data
            creative_user_id = booking.get('creative_user_id')
            
            # Get creative's Stripe account ID
            creative_result = client.table('creatives')\
                .select('stripe_account_id')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            if not creative_result.data:
                raise HTTPException(status_code=404, detail="Creative not found")
            
            stripe_account_id = creative_result.data.get('stripe_account_id')
            if not stripe_account_id:
                raise HTTPException(status_code=400, detail="Creative has not connected their Stripe account")
            
            # Retrieve the checkout session from Stripe (from the connected account)
            checkout_session = stripe.checkout.Session.retrieve(
                session_id,
                stripe_account=stripe_account_id
            )
            
            # Verify payment was successful
            if checkout_session.payment_status != 'paid':
                raise HTTPException(
                    status_code=400, 
                    detail=f"Payment not completed. Status: {checkout_session.payment_status}"
                )
            
            # Verify booking_id in metadata matches
            session_booking_id = checkout_session.metadata.get('booking_id') if checkout_session.metadata else None
            if session_booking_id and session_booking_id != booking_id:
                raise HTTPException(
                    status_code=400,
                    detail="Booking ID mismatch in payment session"
                )
            price = float(booking.get('price', 0))
            payment_option = booking.get('payment_option', 'later')
            current_amount_paid = float(booking.get('amount_paid', 0))
            
            # Get the amount paid from the session (in dollars)
            amount_total = checkout_session.amount_total / 100.0  # Convert from cents
            
            # Calculate new amount_paid
            new_amount_paid = current_amount_paid + amount_total
            
            # Determine new statuses based on payment type
            client_status = booking.get('client_status')
            creative_status = booking.get('creative_status')
            payment_status = 'pending'
            
            # Update status based on payment option
            if payment_option == 'split':
                # For split payment, if this is the first payment (50%), move to in_progress
                if current_amount_paid == 0:
                    # First payment - move to in_progress
                    client_status = 'in_progress'
                    creative_status = 'in_progress'
                    payment_status = 'deposit_paid'
                elif new_amount_paid >= price:
                    # Second payment - fully paid
                    payment_status = 'fully_paid'
                else:
                    # Partial payment
                    payment_status = 'deposit_paid'
            elif payment_option == 'upfront':
                # For upfront payment, move to in_progress when paid
                client_status = 'in_progress'
                creative_status = 'in_progress'
                payment_status = 'fully_paid'
            elif payment_option == 'later':
                # Payment later - status should already be in_progress
                if new_amount_paid >= price:
                    payment_status = 'fully_paid'
                else:
                    payment_status = 'deposit_paid'
            
            # Check if this is a locked order that's now fully paid
            current_client_status = booking.get('client_status')
            is_locked_order = current_client_status == 'locked'
            is_fully_paid = new_amount_paid >= price
            
            # If order is fully paid (regardless of current status), check for files and update statuses
            if is_fully_paid:
                # Check if order has files
                deliverables_response = client.table('booking_deliverables')\
                    .select('id')\
                    .eq('booking_id', booking_id)\
                    .execute()
                
                has_files = deliverables_response.data and len(deliverables_response.data) > 0
                
                if has_files:
                    # Order has files - client can download, creative is completed
                    client_status = 'download'
                    creative_status = 'completed'
                else:
                    # No files - both are completed
                    client_status = 'completed'
                    creative_status = 'completed'
            
            # Get payment timestamp from payment intent (most accurate - when payment was actually processed)
            payment_timestamp = None
            try:
                # Try to get payment intent for accurate payment timestamp
                if hasattr(checkout_session, 'payment_intent') and checkout_session.payment_intent:
                    payment_intent = stripe.PaymentIntent.retrieve(
                        checkout_session.payment_intent,
                        stripe_account=stripe_account_id
                    )
                    if hasattr(payment_intent, 'created'):
                        # Stripe timestamps are in UTC, create timezone-aware datetime
                        from datetime import timezone
                        payment_timestamp = datetime.fromtimestamp(payment_intent.created, tz=timezone.utc)
            except Exception:
                pass
            
            # Fallback to checkout session created time if payment intent not available
            if not payment_timestamp:
                try:
                    if hasattr(checkout_session, 'created'):
                        from datetime import timezone
                        payment_timestamp = datetime.fromtimestamp(checkout_session.created, tz=timezone.utc)
                except Exception:
                    pass
            
            # Final fallback: use current time (timezone-aware)
            if not payment_timestamp:
                from datetime import timezone
                payment_timestamp = datetime.now(timezone.utc)
            
            # Update booking with new amount_paid and statuses
            # Explicitly set updated_at to payment timestamp to ensure accurate last payment date
            # Format as ISO string with timezone for Supabase
            update_data = {
                'amount_paid': new_amount_paid,
                'payment_status': payment_status,
                'updated_at': payment_timestamp.isoformat(),
            }
            
            # Update statuses if they're changing to in_progress
            if client_status == 'in_progress' and booking.get('client_status') != 'in_progress':
                update_data['client_status'] = client_status
            if creative_status == 'in_progress' and booking.get('creative_status') != 'in_progress':
                update_data['creative_status'] = creative_status
            
            # Update statuses if order is now fully paid (regardless of previous status)
            if is_fully_paid:
                update_data['client_status'] = client_status
                update_data['creative_status'] = creative_status
            
            update_response = client.table('bookings')\
                .update(update_data)\
                .eq('id', booking_id)\
                .execute()
            
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to update booking")
            
            updated_booking = update_response.data[0]
            
            # Create notifications for both client and creative after successful payment
            try:
                logger = logging.getLogger(__name__)
                
                # Get service and user information for notifications
                service_id = booking.get('service_id')
                service_title = 'Service'
                if service_id:
                    service_result = db_admin.table('creative_services')\
                        .select('id, title')\
                        .eq('id', service_id)\
                        .single()\
                        .execute()
                    
                    if service_result.data:
                        service_title = service_result.data.get('title', 'Service')
                
                # Get client display name from clients table
                client_user_id = booking.get('client_user_id')
                client_result = db_admin.table('clients')\
                    .select('display_name')\
                    .eq('user_id', client_user_id)\
                    .single()\
                    .execute()
                
                client_display_name = client_result.data.get('display_name', 'A client') if client_result.data else 'A client'
                
                # Get creative display name from creatives table
                creative_result = db_admin.table('creatives')\
                    .select('display_name')\
                    .eq('user_id', creative_user_id)\
                    .single()\
                    .execute()
                
                creative_display_name = creative_result.data.get('display_name', 'A creative') if creative_result.data else 'A creative'
                
                # Determine payment message based on payment status
                is_fully_paid = new_amount_paid >= price
                payment_message = f"${amount_total:.2f} payment received"
                if payment_option == 'split' and not is_fully_paid:
                    payment_message = f"${amount_total:.2f} deposit payment received"
                elif is_fully_paid:
                    payment_message = f"Full payment of ${amount_total:.2f} received"
                
                # Check if this payment unlocked a locked order
                final_client_status = updated_booking.get('client_status')
                final_creative_status = updated_booking.get('creative_status')
                was_locked = is_locked_order and is_fully_paid
                
                # Create notifications based on whether this unlocked a locked order
                if was_locked:
                    # Locked order was unlocked - send unlock notifications
                    # Check if files exist to customize message
                    deliverables_check = db_admin.table('booking_deliverables')\
                        .select('id')\
                        .eq('booking_id', booking_id)\
                        .execute()
                    has_files_for_notification = deliverables_check.data and len(deliverables_check.data) > 0
                    
                    if has_files_for_notification and final_client_status == 'download' and final_creative_status == 'completed':
                        # Client notification: Files unlocked
                        client_notification_data = {
                            "recipient_user_id": booking.get('client_user_id'),
                            "notification_type": "session_completed",
                            "title": "Files Unlocked",
                            "message": f"Payment received! Files for {service_title} are now unlocked and ready for download from {creative_display_name}.",
                            "is_read": False,
                            "related_user_id": creative_user_id,
                            "related_entity_id": booking_id,
                            "related_entity_type": "booking",
                            "target_roles": ["client"],
                            "metadata": {
                                "service_title": service_title,
                                "creative_display_name": creative_display_name,
                                "booking_id": str(booking_id),
                                "amount_paid": str(amount_total),
                                "total_price": str(price),
                                "payment_status": payment_status,
                                "has_files": True
                            },
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        
                        # Creative notification: Payment received, service completed
                        creative_notification_data = {
                            "recipient_user_id": creative_user_id,
                            "notification_type": "payment_received",
                            "title": "Payment Received - Service Complete",
                            "message": f"{client_display_name} has completed payment for {service_title}. Service is now complete.",
                            "is_read": False,
                            "related_user_id": booking.get('client_user_id'),
                            "related_entity_id": booking_id,
                            "related_entity_type": "booking",
                            "target_roles": ["creative"],
                            "metadata": {
                                "service_title": service_title,
                                "client_display_name": client_display_name,
                                "booking_id": str(booking_id),
                                "amount_paid": str(amount_total),
                                "total_price": str(price),
                                "payment_status": payment_status,
                                "has_files": True
                            },
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                    else:
                        # No files or different status - use standard completion messages
                        client_notification_data = {
                            "recipient_user_id": booking.get('client_user_id'),
                            "notification_type": "session_completed",
                            "title": "Payment Received",
                            "message": f"Payment received! Your service {service_title} from {creative_display_name} is now complete.",
                            "is_read": False,
                            "related_user_id": creative_user_id,
                            "related_entity_id": booking_id,
                            "related_entity_type": "booking",
                            "target_roles": ["client"],
                            "metadata": {
                                "service_title": service_title,
                                "creative_display_name": creative_display_name,
                                "booking_id": str(booking_id),
                                "amount_paid": str(amount_total),
                                "total_price": str(price),
                                "payment_status": payment_status,
                                "has_files": False
                            },
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        
                        creative_notification_data = {
                            "recipient_user_id": creative_user_id,
                            "notification_type": "payment_received",
                            "title": "Payment Received - Service Complete",
                            "message": f"{client_display_name} has completed payment for {service_title}. Service is now complete.",
                            "is_read": False,
                            "related_user_id": booking.get('client_user_id'),
                            "related_entity_id": booking_id,
                            "related_entity_type": "booking",
                            "target_roles": ["creative"],
                            "metadata": {
                                "service_title": service_title,
                                "client_display_name": client_display_name,
                                "booking_id": str(booking_id),
                                "amount_paid": str(amount_total),
                                "total_price": str(price),
                                "payment_status": payment_status,
                                "has_files": False
                            },
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                else:
                    # Regular payment notification
                    # Create notification for client
                    client_notification_data = {
                        "recipient_user_id": booking.get('client_user_id'),
                        "notification_type": "payment_received",
                        "title": "Payment Successful",
                        "message": f"Your {payment_message} for {service_title} has been processed successfully.",
                        "is_read": False,
                        "related_user_id": creative_user_id,
                        "related_entity_id": booking_id,
                        "related_entity_type": "booking",
                        "target_roles": ["client"],
                        "metadata": {
                            "service_title": service_title,
                            "creative_display_name": creative_display_name,
                            "booking_id": str(booking_id),
                            "amount_paid": str(amount_total),
                            "total_price": str(price),
                            "payment_status": payment_status
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    
                    # Create notification for creative
                    creative_notification_data = {
                        "recipient_user_id": creative_user_id,
                        "notification_type": "payment_received",
                        "title": "Payment Received",
                        "message": f"{client_display_name} has made a {payment_message} for {service_title}.",
                        "is_read": False,
                        "related_user_id": booking.get('client_user_id'),
                        "related_entity_id": booking_id,
                        "related_entity_type": "booking",
                        "target_roles": ["creative"],
                        "metadata": {
                            "service_title": service_title,
                            "client_display_name": client_display_name,
                            "booking_id": str(booking_id),
                            "amount_paid": str(amount_total),
                            "total_price": str(price),
                            "payment_status": payment_status
                        },
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                
                # Create notifications (don't fail payment verification if notification creation fails)
                # Use db_admin to bypass RLS policies for notification insertion
                try:
                    client_notif_result = db_admin.table("notifications") \
                        .insert(client_notification_data) \
                        .execute()
                    logger.info(f"Client payment notification created: {client_notif_result.data}")
                except Exception as notif_error:
                    logger.error(f"Failed to create client payment notification: {notif_error}")
                
                try:
                    creative_notif_result = db_admin.table("notifications") \
                        .insert(creative_notification_data) \
                        .execute()
                    logger.info(f"Creative payment notification created: {creative_notif_result.data}")
                except Exception as notif_error:
                    logger.error(f"Failed to create creative payment notification: {notif_error}")
                    
            except Exception as notif_error:
                # Log error but don't fail payment verification
                logger = logging.getLogger(__name__)
                logger.error(f"Error creating payment notifications: {notif_error}")
            
            return {
                "success": True,
                "message": "Payment verified and booking updated successfully",
                "booking_id": booking_id,
                "amount_paid": float(updated_booking.get('amount_paid', 0)),
                "payment_status": updated_booking.get('payment_status'),
                "client_status": updated_booking.get('client_status'),
                "creative_status": updated_booking.get('creative_status')
            }
            
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")

