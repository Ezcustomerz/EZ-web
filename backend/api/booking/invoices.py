"""Invoices router for booking endpoints"""
from fastapi import APIRouter, HTTPException, Request, Depends, Response
from typing import Dict, Any
import logging
import stripe
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep
from supabase import Client
from services.compliance.compliance_service import ComplianceService
from services.invoice.invoice_service import InvoiceService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/compliance-sheet/{booking_id}")
@limiter.limit("20 per minute")
async def download_compliance_sheet(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate and download compliance sheet PDF for a booking
    Requires authentication - will return 401 if not authenticated.
    - Verifies user is the client for this booking
    - Only available for canceled, completed, and download status orders
    - Generates PDF with compliance information
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client and status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, service_id, order_date, price, payment_option, approved_at, canceled_date, creative_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the compliance sheet for this booking")
        
        # Check if status allows compliance sheet download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Compliance sheet is only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        # Get service information
        service_id = booking.get('service_id')
        service_result = client.table('creative_services')\
            .select('title, description')\
            .eq('id', service_id)\
            .single()\
            .execute()
        
        service_name = service_result.data.get('title', 'Unknown Service') if service_result.data else 'Unknown Service'
        
        # Get creative information
        creative_user_id = booking.get('creative_user_id')
        creative_result = client.table('creatives')\
            .select('display_name')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_name = creative_result.data.get('display_name', 'Unknown Creative') if creative_result.data else 'Unknown Creative'
        
        # Get user information for creative name fallback
        if not creative_name or creative_name == 'Unknown Creative':
            user_result = client.table('users')\
                .select('name')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            if user_result.data:
                creative_name = user_result.data.get('name', 'Unknown Creative')
        
        # Check for completed_date (this might be in a different field or calculated)
        # For now, we'll use approved_at as a proxy if status is completed
        completed_date = None
        if client_status == 'completed':
            # Try to get from booking updates or use approved_at as fallback
            completed_date = booking.get('approved_at')
        
        # Prepare order data for compliance sheet
        order_data = {
            'id': booking.get('id'),
            'service_name': service_name,
            'creative_name': creative_name,
            'order_date': booking.get('order_date'),
            'price': float(booking.get('price', 0)),
            'payment_option': booking.get('payment_option', 'later'),
            'client_status': booking.get('client_status'),
            'approved_at': booking.get('approved_at'),
            'canceled_date': booking.get('canceled_date'),
            'completed_date': completed_date
        }
        
        # Generate compliance sheet PDF
        pdf_content = ComplianceService.generate_compliance_sheet(order_data)
        
        # Generate filename
        filename = f"EZ_Compliance_Sheet_{booking_id[:8]}.pdf"
        
        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating compliance sheet: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate compliance sheet: {str(e)}")


@router.get("/invoices/{booking_id}")
@limiter.limit("20 per minute")
async def get_invoices(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all invoices (Stripe receipts and EZ invoice) for a booking
    Returns list of available invoices with their types and download URLs
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client and status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, service_id, order_date, price, payment_option, approved_at, canceled_date, creative_user_id, amount_paid')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to view invoices for this booking")
        
        # Check if status allows invoice download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invoices are only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        invoices = []
        
        # Get EZ platform invoice (always available)
        invoices.append({
            'type': 'ez_invoice',
            'name': 'EZ Platform Invoice',
            'download_url': f'/api/bookings/invoice/ez/{booking_id}'
        })
        
        # Get Stripe receipts
        try:
            # Get creative's Stripe account ID
            creative_user_id = booking.get('creative_user_id')
            creative_result = client.table('creatives')\
                .select('stripe_account_id')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            if creative_result.data and creative_result.data.get('stripe_account_id'):
                stripe_account_id = creative_result.data.get('stripe_account_id')
                
                # List all checkout sessions for this booking
                # We'll search by metadata.booking_id
                checkout_sessions = stripe.checkout.Session.list(
                    limit=100,
                    stripe_account=stripe_account_id
                )
                
                # Filter sessions for this booking_id
                booking_sessions = [
                    session for session in checkout_sessions.data
                    if session.metadata and session.metadata.get('booking_id') == booking_id
                    and session.payment_status == 'paid'
                ]
                
                # For split payments, there should be 2 sessions
                # For upfront/later, there should be 1 session
                payment_option = booking.get('payment_option', 'later').lower()
                
                if payment_option == 'split' and len(booking_sessions) >= 2:
                    # Split payment: 2 Stripe receipts
                    for idx, session in enumerate(booking_sessions[:2], 1):
                        invoices.append({
                            'type': 'stripe_receipt',
                            'name': f'Stripe Receipt - Payment {idx}',
                            'session_id': session.id,
                            'download_url': f'/api/bookings/invoice/stripe/{booking_id}?session_id={session.id}'
                        })
                elif len(booking_sessions) >= 1:
                    # Single payment: 1 Stripe receipt
                    invoices.append({
                        'type': 'stripe_receipt',
                        'name': 'Stripe Receipt',
                        'session_id': booking_sessions[0].id,
                        'download_url': f'/api/bookings/invoice/stripe/{booking_id}?session_id={booking_sessions[0].id}'
                    })
        except Exception as e:
            logger.warning(f"Could not retrieve Stripe receipts: {e}")
            # Continue without Stripe receipts
        
        return {
            'success': True,
            'booking_id': booking_id,
            'invoices': invoices
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoices: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get invoices: {str(e)}")


@router.get("/invoice/ez/{booking_id}")
@limiter.limit("20 per minute")
async def download_ez_invoice(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate and download EZ platform invoice PDF for a booking
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client and status
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, service_id, order_date, price, payment_option, approved_at, canceled_date, creative_user_id, amount_paid, booking_date')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the invoice for this booking")
        
        # Check if status allows invoice download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invoice is only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        # Get service information
        service_id = booking.get('service_id')
        service_result = client.table('creative_services')\
            .select('title, description')\
            .eq('id', service_id)\
            .single()\
            .execute()
        
        service_name = service_result.data.get('title', 'Unknown Service') if service_result.data else 'Unknown Service'
        service_description = service_result.data.get('description', '') if service_result.data else ''
        
        # Get creative information
        creative_user_id = booking.get('creative_user_id')
        creative_result = client.table('creatives')\
            .select('display_name')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_name = creative_result.data.get('display_name', 'Unknown Creative') if creative_result.data else 'Unknown Creative'
        
        # Get user information
        client_user_id = booking.get('client_user_id')
        client_user_result = client.table('users')\
            .select('name, email')\
            .eq('user_id', client_user_id)\
            .single()\
            .execute()
        
        client_name = client_user_result.data.get('name', 'Unknown Client') if client_user_result.data else 'Unknown Client'
        client_email = client_user_result.data.get('email', '') if client_user_result.data else ''
        
        # Get creative user info for email
        creative_user_result = client.table('users')\
            .select('name, email')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_email = creative_user_result.data.get('email', '') if creative_user_result.data else ''
        if not creative_name or creative_name == 'Unknown Creative':
            creative_name = creative_user_result.data.get('name', 'Unknown Creative') if creative_user_result.data else 'Unknown Creative'
        
        # Check for completed_date
        completed_date = None
        if client_status == 'completed':
            completed_date = booking.get('approved_at')
        
        # Prepare order data for invoice
        order_data = {
            'id': booking.get('id'),
            'service_name': service_name,
            'service_description': service_description,
            'creative_name': creative_name,
            'creative_email': creative_email,
            'client_name': client_name,
            'client_email': client_email,
            'order_date': booking.get('order_date'),
            'booking_date': booking.get('booking_date'),
            'price': float(booking.get('price', 0)),
            'payment_option': booking.get('payment_option', 'later'),
            'amount_paid': float(booking.get('amount_paid', 0)),
            'approved_at': booking.get('approved_at'),
            'completed_date': completed_date,
            'description': service_description
        }
        
        # Generate invoice PDF
        pdf_content = InvoiceService.generate_client_invoice(order_data)
        
        # Generate filename
        filename = f"EZ_Invoice_{booking_id[:8]}.pdf"
        
        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {str(e)}")


@router.get("/invoice/stripe/{booking_id}")
@limiter.limit("20 per minute")
async def download_stripe_receipt(
    request: Request,
    booking_id: str,
    session_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get Stripe receipt URL for a payment session
    Returns the Stripe receipt URL that can be opened in browser
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify client
        booking_result = client.table('bookings')\
            .select('id, client_user_id, client_status, creative_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is the client
        if booking.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the receipt for this booking")
        
        # Check if status allows receipt download
        client_status = booking.get('client_status', '').lower()
        allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
        if client_status not in allowed_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Receipt is only available for orders with status: canceled, completed, or download. Current status: {client_status}"
            )
        
        # Get creative's Stripe account ID
        creative_user_id = booking.get('creative_user_id')
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
        
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(
            session_id,
            stripe_account=stripe_account_id
        )
        
        # Verify booking_id in metadata matches
        session_booking_id = checkout_session.metadata.get('booking_id') if checkout_session.metadata else None
        if session_booking_id and session_booking_id != booking_id:
            raise HTTPException(status_code=400, detail="Booking ID mismatch in payment session")
        
        # Get the payment intent from the session
        payment_intent_id = checkout_session.payment_intent
        if not payment_intent_id:
            raise HTTPException(status_code=404, detail="Payment intent not found for this session")
        
        # Retrieve the payment intent
        try:
            payment_intent = stripe.PaymentIntent.retrieve(
                payment_intent_id,
                stripe_account=stripe_account_id
            )
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=404, detail=f"Payment intent not found: {str(e)}")
        
        # Get charges from payment intent
        # The charges attribute is a list of charge IDs, not expanded objects
        charge_id = None
        
        # Try to get charge ID from latest_charge (newer API)
        if hasattr(payment_intent, 'latest_charge') and payment_intent.latest_charge:
            charge_id = payment_intent.latest_charge
        # Fallback: get from charges list
        elif hasattr(payment_intent, 'charges') and payment_intent.charges:
            if isinstance(payment_intent.charges, dict) and 'data' in payment_intent.charges:
                if len(payment_intent.charges.data) > 0:
                    charge_id = payment_intent.charges.data[0].id
            elif isinstance(payment_intent.charges, list) and len(payment_intent.charges) > 0:
                charge_id = payment_intent.charges[0]
        
        if not charge_id:
            # If we can't get charge ID, try to list charges for this payment intent
            try:
                charges = stripe.Charge.list(
                    payment_intent=payment_intent_id,
                    limit=1,
                    stripe_account=stripe_account_id
                )
                if charges.data and len(charges.data) > 0:
                    charge_id = charges.data[0].id
            except:
                pass
        
        if not charge_id:
            raise HTTPException(status_code=404, detail="Charge not found for this payment")
        
        # Get the charge to access receipt URL
        try:
            charge = stripe.Charge.retrieve(
                charge_id,
                stripe_account=stripe_account_id
            )
            
            # Get receipt URL from charge
            if hasattr(charge, 'receipt_url') and charge.receipt_url:
                receipt_url = charge.receipt_url
            else:
                # Fallback: construct receipt URL
                # Format: https://pay.stripe.com/receipts/{charge_id}
                receipt_url = f"https://pay.stripe.com/receipts/{charge_id}"
        except stripe.error.StripeError as e:
            # If charge retrieval fails, construct URL from charge_id
            receipt_url = f"https://pay.stripe.com/receipts/{charge_id}"
        
        return {
            'success': True,
            'receipt_url': receipt_url,
            'session_id': session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Stripe receipt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Stripe receipt: {str(e)}")

