from fastapi import APIRouter, Request, HTTPException, Depends, Response
from core.limiter import limiter
from core.verify import require_auth
from typing import Dict, Any, Optional
from db.db_session import get_authenticated_client_dep
from supabase import Client
from services.payment_requests.payment_request_service import PaymentRequestService
from services.invoice.invoice_service import InvoiceService
from pydantic import BaseModel
import logging
import stripe
import os

logger = logging.getLogger(__name__)
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

router = APIRouter()


class CreatePaymentRequestRequest(BaseModel):
    client_user_id: Optional[str] = None
    amount: float
    notes: Optional[str] = None
    booking_id: Optional[str] = None


@router.post("")
@limiter.limit("10 per minute")
async def create_payment_request(
    request: Request,
    payment_request_data: CreatePaymentRequestRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Create a new payment request
    Requires authentication - will return 401 if not authenticated.
    Must be authenticated as a creative.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Verify user is a creative and check Stripe account setup
        creative_result = client.table('creatives')\
            .select('user_id, stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        if not creative_result.data:
            raise HTTPException(status_code=403, detail="Only creatives can create payment requests")
        
        # Check if Stripe account is connected and onboarding is complete
        creative_data = creative_result.data
        stripe_account_id = creative_data.get('stripe_account_id')
        stripe_onboarding_complete = creative_data.get('stripe_onboarding_complete', False)
        
        if not stripe_account_id or not stripe_onboarding_complete:
            raise HTTPException(
                status_code=403, 
                detail="STRIPE_NOT_SETUP",
                headers={"X-Error-Type": "stripe_not_setup"}
            )
        
        # Validate that either client_user_id or booking_id is provided
        if not payment_request_data.client_user_id and not payment_request_data.booking_id:
            raise HTTPException(status_code=400, detail="Either client_user_id or booking_id must be provided")
        
        # Convert None to None explicitly (not string "None")
        client_user_id = payment_request_data.client_user_id if payment_request_data.client_user_id else None
        notes = payment_request_data.notes if payment_request_data.notes else None
        booking_id = payment_request_data.booking_id if payment_request_data.booking_id else None
        
        result = await PaymentRequestService.create_payment_request(
            creative_user_id=user_id,
            client_user_id=client_user_id,
            amount=payment_request_data.amount,
            notes=notes,
            booking_id=booking_id,
            client=client
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment request: {str(e)}")


@router.get("/client")
@limiter.limit("20 per minute")
async def get_client_payment_requests(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get payment requests for the current client with pagination
    Requires authentication - will return 401 if not authenticated.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (default: 10, max: 50)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
        if page_size > 50:
            page_size = 50
        
        result = await PaymentRequestService.get_client_payment_requests(
            client_user_id=user_id,
            client=client,
            page=page,
            page_size=page_size
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment requests: {str(e)}")


@router.get("/creative")
@limiter.limit("20 per minute")
async def get_creative_payment_requests(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get payment requests for the current creative with pagination
    Requires authentication - will return 401 if not authenticated.
    Must be authenticated as a creative.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (default: 10, max: 50)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Verify user is a creative
        creative_result = client.table('creatives')\
            .select('user_id')\
            .eq('user_id', user_id)\
            .single()\
            .execute()
        
        if not creative_result.data:
            raise HTTPException(status_code=403, detail="Only creatives can view their payment requests")
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
        if page_size > 50:
            page_size = 50
        
        result = await PaymentRequestService.get_creative_payment_requests(
            creative_user_id=user_id,
            client=client,
            page=page,
            page_size=page_size
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment requests: {str(e)}")


@router.get("/client/count")
@limiter.limit("20 per minute")
async def get_pending_payment_requests_count(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get count of pending payment requests for the current client
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        count = await PaymentRequestService.get_pending_count(
            client_user_id=user_id,
            client=client
        )
        
        return {'pending': count, 'total': count}  # For now, just return pending count
        
    except HTTPException:
        raise
    except Exception as e:
        return {'pending': 0, 'total': 0}  # Return 0 on error to avoid breaking UI


@router.get("/booking/{booking_id}")
@limiter.limit("20 per minute")
async def get_payment_requests_by_booking(
    request: Request,
    booking_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all payment requests associated with a specific booking
    Requires authentication - will return 401 if not authenticated.
    User must be either the client or creative associated with the booking.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get booking to verify user has access
        booking_result = client.table('bookings')\
            .select('client_user_id, creative_user_id')\
            .eq('id', booking_id)\
            .single()\
            .execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data
        
        # Verify user is either the client or creative
        if booking['client_user_id'] != user_id and booking['creative_user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to view payment requests for this booking")
        
        # Get all payment requests for this booking
        result = await PaymentRequestService.get_payment_requests_by_booking(
            booking_id=booking_id,
            client=client
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment requests: {str(e)}")


@router.post("/{payment_request_id}/process")
@limiter.limit("10 per minute")
async def process_payment_request(
    request: Request,
    payment_request_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Process a payment request - creates a Stripe Checkout Session
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        result = await PaymentRequestService.process_payment_request(
            payment_request_id=payment_request_id,
            client_user_id=user_id,
            client=client
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")


class VerifyPaymentRequestRequest(BaseModel):
    session_id: str
    payment_request_id: str


@router.post("/verify")
@limiter.limit("10 per minute")
async def verify_payment_request(
    request: Request,
    verify_data: VerifyPaymentRequestRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Verify a payment session and update payment request status
    Requires authentication - will return 401 if not authenticated.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        session_id = verify_data.session_id
        payment_request_id = verify_data.payment_request_id
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        if not payment_request_id:
            raise HTTPException(status_code=400, detail="payment_request_id is required")
        
        # Verify the payment request belongs to this user - only select field we need
        pr_result = client.table('payment_requests')\
            .select('client_user_id')\
            .eq('id', payment_request_id)\
            .single()\
            .execute()
        
        if not pr_result.data:
            raise HTTPException(status_code=404, detail="Payment request not found")
        
        if pr_result.data.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to verify this payment")
        
        result = await PaymentRequestService.verify_payment_request(
            session_id=session_id,
            payment_request_id=payment_request_id,
            client=client
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")


@router.get("/invoices/{payment_request_id}")
@limiter.limit("20 per minute")
async def get_payment_request_invoices(
    request: Request,
    payment_request_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all invoices (Stripe receipts and EZ invoice) for a payment request
    Returns list of available invoices with their types and download URLs
    Only available for paid payment requests
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get payment request to verify client and status
        pr_result = client.table('payment_requests')\
            .select('id, client_user_id, status, creative_user_id, stripe_session_id')\
            .eq('id', payment_request_id)\
            .single()\
            .execute()
        
        if not pr_result.data:
            raise HTTPException(status_code=404, detail="Payment request not found")
        
        payment_request = pr_result.data
        
        # Verify user is the client
        if payment_request.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to view invoices for this payment request")
        
        # Check if status allows invoice download (only paid requests)
        if payment_request.get('status') != 'paid':
            raise HTTPException(
                status_code=400, 
                detail=f"Invoices are only available for paid payment requests. Current status: {payment_request.get('status')}"
            )
        
        invoices = []
        
        # Get EZ platform invoice (always available for paid requests)
        invoices.append({
            'type': 'ez_invoice',
            'name': 'EZ Platform Invoice',
            'download_url': f'/api/payment-requests/invoice/ez/{payment_request_id}'
        })
        
        # Get Stripe receipt if session_id exists
        stripe_session_id = payment_request.get('stripe_session_id')
        if stripe_session_id:
            try:
                # Get creative's Stripe account ID
                creative_user_id = payment_request.get('creative_user_id')
                creative_result = client.table('creatives')\
                    .select('stripe_account_id')\
                    .eq('user_id', creative_user_id)\
                    .single()\
                    .execute()
                
                if creative_result.data and creative_result.data.get('stripe_account_id'):
                    stripe_account_id = creative_result.data.get('stripe_account_id')
                    
                    # Get the checkout session
                    checkout_session = stripe.checkout.Session.retrieve(
                        stripe_session_id,
                        stripe_account=stripe_account_id
                    )
                    
                    # Check if payment was successful
                    if checkout_session.payment_status == 'paid':
                        invoices.append({
                            'type': 'stripe_receipt',
                            'name': 'Stripe Receipt',
                            'session_id': stripe_session_id,
                            'download_url': f'/api/payment-requests/invoice/stripe/{payment_request_id}?session_id={stripe_session_id}'
                        })
            except Exception as e:
                logger.warning(f"Error fetching Stripe receipt for payment request {payment_request_id}: {e}")
                # Continue without Stripe receipt if there's an error
        
        return {
            'success': True,
            'payment_request_id': payment_request_id,
            'invoices': invoices
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoices: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get invoices: {str(e)}")


@router.get("/invoice/ez/{payment_request_id}")
@limiter.limit("20 per minute")
async def download_payment_request_ez_invoice(
    request: Request,
    payment_request_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Generate and download EZ platform invoice PDF for a payment request
    Only available for paid payment requests
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get payment request to verify client and status
        pr_result = client.table('payment_requests')\
            .select('id, client_user_id, status, creative_user_id, amount, notes, created_at, paid_at, booking_id')\
            .eq('id', payment_request_id)\
            .single()\
            .execute()
        
        if not pr_result.data:
            raise HTTPException(status_code=404, detail="Payment request not found")
        
        payment_request = pr_result.data
        
        # Verify user is the client
        if payment_request.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the invoice for this payment request")
        
        # Check if status allows invoice download (only paid requests)
        if payment_request.get('status') != 'paid':
            raise HTTPException(
                status_code=400, 
                detail=f"Invoice is only available for paid payment requests. Current status: {payment_request.get('status')}"
            )
        
        # Get creative information
        creative_user_id = payment_request.get('creative_user_id')
        creative_result = client.table('creatives')\
            .select('display_name')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_name = creative_result.data.get('display_name', 'Unknown Creative') if creative_result.data else 'Unknown Creative'
        
        # Get creative user info for email
        creative_user_result = client.table('users')\
            .select('name, email')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        creative_email = creative_user_result.data.get('email', '') if creative_user_result.data else ''
        if not creative_name or creative_name == 'Unknown Creative':
            creative_name = creative_user_result.data.get('name', 'Unknown Creative') if creative_user_result.data else 'Unknown Creative'
        
        # Get client information
        client_user_id = payment_request.get('client_user_id')
        client_user_result = client.table('users')\
            .select('name, email')\
            .eq('user_id', client_user_id)\
            .single()\
            .execute()
        
        client_name = client_user_result.data.get('name', 'Unknown Client') if client_user_result.data else 'Unknown Client'
        client_email = client_user_result.data.get('email', '') if client_user_result.data else ''
        
        # Get service information if booking_id exists
        service_name = 'Direct Payment Request'
        service_description = payment_request.get('notes') or 'Direct payment request from creative'
        booking_id = payment_request.get('booking_id')
        
        if booking_id:
            booking_result = client.table('bookings')\
                .select('service_id')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if booking_result.data:
                service_id = booking_result.data.get('service_id')
                if service_id:
                    service_result = client.table('creative_services')\
                        .select('title, description')\
                        .eq('id', service_id)\
                        .single()\
                        .execute()
                    
                    if service_result.data:
                        service_name = service_result.data.get('title', 'Direct Payment Request')
                        service_description = service_result.data.get('description', payment_request.get('notes') or 'Direct payment request from creative')
        
        # Prepare order data for invoice
        order_data = {
            'id': payment_request_id,
            'service_name': service_name,
            'service_description': service_description,
            'creative_name': creative_name,
            'creative_email': creative_email,
            'client_name': client_name,
            'client_email': client_email,
            'order_date': payment_request.get('created_at'),
            'booking_date': None,
            'price': float(payment_request.get('amount', 0)),
            'payment_option': 'upfront',  # Payment requests are always upfront
            'amount_paid': float(payment_request.get('amount', 0)),
            'approved_at': payment_request.get('paid_at'),
            'completed_date': payment_request.get('paid_at'),
            'description': service_description,
            'split_deposit_amount': None
        }
        
        # Generate invoice PDF
        pdf_content = InvoiceService.generate_client_invoice(order_data)
        
        # Generate filename
        filename = f"EZ_Invoice_PaymentRequest_{payment_request_id[:8]}.pdf"
        
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


@router.get("/invoice/stripe/{payment_request_id}")
@limiter.limit("20 per minute")
async def get_payment_request_stripe_receipt(
    request: Request,
    payment_request_id: str,
    session_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get Stripe receipt URL for a payment request payment session
    Returns the Stripe receipt URL that can be opened in browser
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        # Get payment request to verify client
        pr_result = client.table('payment_requests')\
            .select('id, client_user_id, status, creative_user_id, stripe_session_id')\
            .eq('id', payment_request_id)\
            .single()\
            .execute()
        
        if not pr_result.data:
            raise HTTPException(status_code=404, detail="Payment request not found")
        
        payment_request = pr_result.data
        
        # Verify user is the client
        if payment_request.get('client_user_id') != user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to download the receipt for this payment request")
        
        # Check if status allows receipt download (only paid requests)
        if payment_request.get('status') != 'paid':
            raise HTTPException(
                status_code=400, 
                detail=f"Receipt is only available for paid payment requests. Current status: {payment_request.get('status')}"
            )
        
        # Verify session_id matches
        if payment_request.get('stripe_session_id') != session_id:
            raise HTTPException(status_code=400, detail="Session ID does not match payment request")
        
        # Get creative's Stripe account ID
        creative_user_id = payment_request.get('creative_user_id')
        creative_result = client.table('creatives')\
            .select('stripe_account_id')\
            .eq('user_id', creative_user_id)\
            .single()\
            .execute()
        
        if not creative_result.data or not creative_result.data.get('stripe_account_id'):
            raise HTTPException(status_code=404, detail="Stripe account not found for this creative")
        
        stripe_account_id = creative_result.data.get('stripe_account_id')
        
        # Get the checkout session
        checkout_session = stripe.checkout.Session.retrieve(
            session_id,
            stripe_account=stripe_account_id
        )
        
        # Get the receipt URL
        if not checkout_session.payment_intent:
            raise HTTPException(status_code=404, detail="Payment intent not found for this session")
        
        payment_intent = stripe.PaymentIntent.retrieve(
            checkout_session.payment_intent,
            stripe_account=stripe_account_id
        )
        
        # Get the charge to find receipt URL
        if not payment_intent.charges or len(payment_intent.charges.data) == 0:
            raise HTTPException(status_code=404, detail="Charge not found for this payment")
        
        charge = payment_intent.charges.data[0]
        receipt_url = charge.receipt_url if hasattr(charge, 'receipt_url') else None
        
        if not receipt_url:
            raise HTTPException(status_code=404, detail="Receipt URL not available for this payment")
        
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

