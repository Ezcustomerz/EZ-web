import resend
import os
import logging
import base64
import httpx
import stripe
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from services.invoice.invoice_service import InvoiceService
from db.db_session import db_admin

load_dotenv()
logger = logging.getLogger(__name__)

# Configure Resend with API key from environment
resend.api_key = os.getenv('RESEND_API_KEY')


class EmailService:
    """Service for sending transactional emails using Resend"""
    
    def __init__(self):
        self.from_email = "EZ-web <onboarding@resend.dev>"  # Use Resend's test domain for now
        # TODO: Replace with your verified domain once set up
        # self.from_email = "EZ-web <noreply@yourdomain.com>"
        
        # Check environment to determine if we should use test mode
        env = os.getenv("ENV", "dev").lower()
        
        # For testing: redirect all emails to this address
        # Set to None to send to actual recipients (when domain is verified)
        self.test_email = "ezcustomers.info@gmail.com"
        
        # In production, disable test mode so emails go to actual recipients
        # In all other environments, use test mode to prevent sending to real users
        if env == "prod" or env == "production":
            self.is_test_mode = False
            logger.info("Email service: PRODUCTION mode - emails will be sent to actual recipients")
        else:
            self.is_test_mode = True
            logger.info("Email service: TEST mode - emails will be redirected to test address")
        
        # Load logo file path for embedding in emails
        self.logo_path = self._find_logo_path()
        
        if not resend.api_key:
            logger.warning("RESEND_API_KEY not configured - emails will not be sent")
    
    def _find_logo_path(self) -> Optional[str]:
        """Find the EZ-web logo file path"""
        try:
            # Try multiple possible logo locations (in order of preference)
            possible_paths = [
                # Backend assets folder (most likely location)
                os.path.join(os.path.dirname(__file__), "..", "..", "assets", "logo.png"),
                os.path.join(os.path.dirname(__file__), "..", "..", "assets", "ez-logo.png"),
                # Assets folder from Cursor workspace
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "c__Users_2002t_AppData_Roaming_Cursor_User_workspaceStorage_af761c8ed60001bdb9b7627826e7ef3c_images_black_ezcustomers_logo-1b227ffc-a4c3-4302-a8e5-7fce6faa8145.png"),
                # Root assets folder
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "logo.png"),
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "ez-logo.png"),
            ]
            
            for logo_path in possible_paths:
                # Resolve the path properly
                resolved_path = os.path.abspath(logo_path)
                if os.path.exists(resolved_path):
                    logger.info(f"Found logo at: {resolved_path}")
                    return resolved_path
            
            logger.warning("Logo file not found - emails will be sent without logo")
            return None
        except Exception as e:
            logger.warning(f"Failed to find logo: {str(e)} - emails will be sent without logo")
            return None
    
    async def send_welcome_email(
        self,
        to_email: str,
        user_name: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> bool:
        """
        Send a welcome email to a new user after account creation
        
        Args:
            to_email: Recipient email address
            user_name: User's display name (optional)
            user_role: The role they signed up as (client, creative, advocate)
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not resend.api_key:
            logger.warning(f"Skipping welcome email to {to_email} - RESEND_API_KEY not configured")
            return False
        
        try:
            # Personalize greeting
            greeting = f"Hi {user_name}!" if user_name else "Hi there!"
            
            # Customize content based on role
            role_content = self._get_role_specific_content(user_role)
            
            # Determine actual recipient (test mode vs production)
            actual_recipient = self.test_email if self.is_test_mode and self.test_email else to_email
            test_mode_note = ""
            if self.is_test_mode and self.test_email and actual_recipient != to_email:
                test_mode_note = f'<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;"><strong>🧪 TEST MODE:</strong> This email was intended for <strong>{to_email}</strong> but was redirected to the test email address.</div>'
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        text-align: center;
                        padding: 30px 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 8px 8px 0 0;
                    }}
                    .logo {{
                        max-width: 120px;
                        height: auto;
                        margin-bottom: 20px;
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                    }}
                    .content {{
                        padding: 30px;
                        background: #f8fafc;
                        border-radius: 0 0 8px 8px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 12px 24px;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 14px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    {f'<img src="cid:logo" alt="EZ-web Logo" class="logo" />' if self.logo_path else ''}
                    <h1>Welcome to EZ-web! 🎉</h1>
                </div>
                <div class="content">
                    {test_mode_note}
                    <p>{greeting}</p>
                    
                    <p>We're thrilled to have you join EZ-web! Your account has been successfully created and you're all set to get started.</p>
                    
                    {role_content}
                    
                    <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
                    
                    <p>Best regards,<br>The EZ-web Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to {to_email}</p>
                    <p>&copy; 2026 EZ-web. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            # Prepare email parameters
            params = {
                "from": self.from_email,
                "to": [actual_recipient],
                "subject": "Welcome to EZ-web! 🎉",
                "html": html_content
            }
            
            # Add logo as inline attachment if available
            if self.logo_path:
                try:
                    with open(self.logo_path, "rb") as logo_file:
                        logo_data = logo_file.read()
                        logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                        params["attachments"] = [{
                            "filename": "logo.png",
                            "content": logo_base64,
                            "content_id": "logo",
                            "content_type": "image/png"
                        }]
                except Exception as e:
                    logger.warning(f"Failed to attach logo: {str(e)}")
            
            response = resend.Emails.send(params)
            if self.is_test_mode and self.test_email and actual_recipient != to_email:
                logger.info(f"Welcome email sent to TEST EMAIL ({actual_recipient}) - originally intended for {to_email}. Email ID: {response.get('id')}")
            else:
                logger.info(f"Welcome email sent successfully to {to_email}. Email ID: {response.get('id')}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
            # Don't raise exception - we don't want to fail user creation if email fails
            return False
    
    def _get_role_specific_content(self, role: Optional[str]) -> str:
        """Get role-specific content for welcome email"""
        if role == 'client':
            return """
            <h3>What's Next?</h3>
            <ul>
                <li>Browse and connect with talented creatives</li>
                <li>Book services that fit your needs</li>
                <li>Track your projects and orders</li>
                <li>Manage payments securely</li>
            </ul>
            """
        elif role == 'creative':
            return """
            <h3>What's Next?</h3>
            <ul>
                <li>Set up your creative profile and showcase your work</li>
                <li>Create your services and set your pricing</li>
                <li>Connect with clients and grow your business</li>
                <li>Manage bookings and deliver your best work</li>
            </ul>
            """
        elif role == 'advocate':
            return """
            <h3>What's Next?</h3>
            <ul>
                <li>Set up your advocate profile</li>
                <li>Start connecting creatives with clients</li>
                <li>Track your referrals and commissions</li>
                <li>Build your network</li>
            </ul>
            """
        else:
            return """
            <h3>What's Next?</h3>
            <p>Explore the platform and see how EZ-web can help you connect and collaborate.</p>
            """
    
    async def send_booking_confirmation(
        self,
        to_email: str,
        client_name: str,
        creative_name: str,
        service_title: str,
        booking_date: Optional[str] = None,
        booking_time: Optional[str] = None
    ) -> bool:
        """
        Send booking confirmation email to client
        
        Args:
            to_email: Client's email address
            client_name: Client's name
            creative_name: Creative's name
            service_title: Title of the booked service
            booking_date: Date of booking (if scheduled)
            booking_time: Time of booking (if scheduled)
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not resend.api_key:
            logger.warning(f"Skipping booking confirmation email to {to_email} - RESEND_API_KEY not configured")
            return False
        
        try:
            # Build booking details HTML
            booking_details = ""
            if booking_date:
                booking_details += f"<p><strong>Date:</strong> {booking_date}</p>"
            if booking_time:
                booking_details += f"<p><strong>Time:</strong> {booking_time}</p>"
            
            # Determine actual recipient (test mode vs production)
            actual_recipient = self.test_email if self.is_test_mode and self.test_email else to_email
            test_mode_note = ""
            if self.is_test_mode and self.test_email and actual_recipient != to_email:
                test_mode_note = f'<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;"><strong>🧪 TEST MODE:</strong> This email was intended for <strong>{to_email}</strong> but was redirected to the test email address.</div>'
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        text-align: center;
                        padding: 30px 0;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        border-radius: 8px 8px 0 0;
                    }}
                    .logo {{
                        max-width: 120px;
                        height: auto;
                        margin-bottom: 20px;
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                    }}
                    .content {{
                        padding: 30px;
                        background: #f8fafc;
                        border-radius: 0 0 8px 8px;
                    }}
                    .booking-card {{
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #10b981;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 14px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    {f'<img src="cid:logo" alt="EZ-web Logo" class="logo" />' if self.logo_path else ''}
                    <h1>Booking Confirmed! ✓</h1>
                </div>
                <div class="content">
                    {test_mode_note}
                    <p>Hi {client_name},</p>
                    
                    <p>Great news! Your booking has been confirmed.</p>
                    
                    <div class="booking-card">
                        <h3>{service_title}</h3>
                        <p><strong>Creative:</strong> {creative_name}</p>
                        {booking_details}
                    </div>
                    
                    <p>The creative will review your booking and get back to you soon. You'll receive updates as your booking progresses.</p>
                    
                    <p>You can view and manage your bookings anytime in your dashboard.</p>
                    
                    <p>Best regards,<br>The EZ-web Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to {to_email}</p>
                    <p>&copy; 2026 EZ-web. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            params = {
                "from": self.from_email,
                "to": [actual_recipient],
                "subject": f"Booking Confirmed - {service_title}",
                "html": html_content
            }
            
            # Add logo as inline attachment if available
            if self.logo_path:
                try:
                    with open(self.logo_path, "rb") as logo_file:
                        logo_data = logo_file.read()
                        logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                        params["attachments"] = [{
                            "filename": "logo.png",
                            "content": logo_base64,
                            "content_id": "logo",
                            "content_type": "image/png"
                        }]
                except Exception as e:
                    logger.warning(f"Failed to attach logo: {str(e)}")
            
            response = resend.Emails.send(params)
            if self.is_test_mode and self.test_email and actual_recipient != to_email:
                logger.info(f"Booking confirmation email sent to TEST EMAIL ({actual_recipient}) - originally intended for {to_email}. Email ID: {response.get('id')}")
            else:
                logger.info(f"Booking confirmation email sent to {to_email}. Email ID: {response.get('id')}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send booking confirmation email to {to_email}: {str(e)}")
            return False


    async def _fetch_booking_invoices(self, booking_id: str, db_client: Client, allow_any_status: bool = False) -> List[Dict[str, Any]]:
        """
        Fetch invoice PDFs for a booking (EZ invoice and Stripe receipts)
        
        Args:
            booking_id: Booking ID
            db_client: Supabase client with admin privileges
            allow_any_status: If True, generate invoices regardless of booking status (for payment_received emails)
            
        Returns:
            List of invoice attachments with filename, content (base64), and content_type
        """
        attachments = []
        
        try:
            # Get booking details including client_status
            booking_result = db_client.table('bookings')\
                .select('id, client_user_id, service_id, order_date, price, payment_option, approved_at, canceled_date, creative_user_id, amount_paid, booking_date, split_deposit_amount, client_status')\
                .eq('id', booking_id)\
                .single()\
                .execute()
            
            if not booking_result.data:
                logger.warning(f"Booking {booking_id} not found for invoice generation")
                return attachments
            
            booking = booking_result.data
            
            # Check booking status if not allowing any status
            if not allow_any_status:
                client_status = booking.get('client_status', '').lower()
                allowed_statuses = ['canceled', 'cancelled', 'completed', 'download']
                if client_status not in allowed_statuses:
                    logger.info(f"[_fetch_booking_invoices] Status '{client_status}' not in allowed statuses {allowed_statuses}, returning empty list")
                    return attachments
            
            # Get service information
            service_result = db_client.table('creative_services')\
                .select('title, description')\
                .eq('id', booking.get('service_id'))\
                .single()\
                .execute()
            
            service_name = service_result.data.get('title', 'Unknown Service') if service_result.data else 'Unknown Service'
            service_description = service_result.data.get('description', '') if service_result.data else ''
            
            # Get creative information
            creative_user_id = booking.get('creative_user_id')
            creative_result = db_client.table('creatives')\
                .select('display_name')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            creative_name = creative_result.data.get('display_name', 'Unknown Creative') if creative_result.data else 'Unknown Creative'
            
            # Get user information
            client_user_id = booking.get('client_user_id')
            client_user_result = db_client.table('users')\
                .select('name, email')\
                .eq('user_id', client_user_id)\
                .single()\
                .execute()
            
            client_name = client_user_result.data.get('name', 'Unknown Client') if client_user_result.data else 'Unknown Client'
            client_email = client_user_result.data.get('email', '') if client_user_result.data else ''
            
            # Get creative user info for email
            creative_user_result = db_client.table('users')\
                .select('name, email')\
                .eq('user_id', creative_user_id)\
                .single()\
                .execute()
            
            creative_email = creative_user_result.data.get('email', '') if creative_user_result.data else ''
            if not creative_name or creative_name == 'Unknown Creative':
                creative_name = creative_user_result.data.get('name', 'Unknown Creative') if creative_user_result.data else 'Unknown Creative'
            
            # Check for completed_date
            client_status = booking.get('client_status', '').lower()
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
                'description': service_description,
                'split_deposit_amount': booking.get('split_deposit_amount')
            }
            
            # Generate EZ platform invoice PDF
            try:
                invoice_pdf = InvoiceService.generate_client_invoice(order_data)
                invoice_base64 = base64.b64encode(invoice_pdf).decode('utf-8')
                attachments.append({
                    'filename': f'EZ_Invoice_{booking_id[:8]}.pdf',
                    'content': invoice_base64,
                    'content_type': 'application/pdf'
                })
                logger.info(f"Generated EZ invoice PDF for booking {booking_id}")
            except Exception as e:
                logger.error(f"Failed to generate EZ invoice PDF for booking {booking_id}: {e}")
            
            # Get Stripe receipts
            try:
                creative_result = db_client.table('creatives')\
                    .select('stripe_account_id')\
                    .eq('user_id', creative_user_id)\
                    .single()\
                    .execute()
                
                if creative_result.data and creative_result.data.get('stripe_account_id'):
                    stripe_account_id = creative_result.data.get('stripe_account_id')
                    
                    # List checkout sessions for this booking
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
                    
                    # Sort by creation date
                    booking_sessions.sort(key=lambda s: s.created if hasattr(s, 'created') else 0)
                    
                    # Get Stripe receipts
                    payment_option = booking.get('payment_option', 'later').lower()
                    
                    if payment_option == 'split' and len(booking_sessions) >= 2:
                        # Split payment: 2 Stripe receipts
                        for idx, session in enumerate(booking_sessions[:2], 1):
                            receipt_url = await self._get_stripe_receipt_url(session.id, stripe_account_id)
                            if receipt_url:
                                receipt_pdf = await self._download_stripe_receipt(receipt_url)
                                if receipt_pdf:
                                    receipt_base64 = base64.b64encode(receipt_pdf).decode('utf-8')
                                    attachments.append({
                                        'filename': f'Stripe_Receipt_Payment_{idx}_{booking_id[:8]}.pdf',
                                        'content': receipt_base64,
                                        'content_type': 'application/pdf'
                                    })
                                    logger.info(f"Attached Stripe receipt {idx} for booking {booking_id}")
                    elif len(booking_sessions) >= 1:
                        # Single payment: 1 Stripe receipt
                        receipt_url = await self._get_stripe_receipt_url(booking_sessions[0].id, stripe_account_id)
                        if receipt_url:
                            receipt_pdf = await self._download_stripe_receipt(receipt_url)
                            if receipt_pdf:
                                receipt_base64 = base64.b64encode(receipt_pdf).decode('utf-8')
                                attachments.append({
                                    'filename': f'Stripe_Receipt_{booking_id[:8]}.pdf',
                                    'content': receipt_base64,
                                    'content_type': 'application/pdf'
                                })
                                logger.info(f"Attached Stripe receipt for booking {booking_id}")
            except Exception as e:
                logger.warning(f"Could not retrieve Stripe receipts for booking {booking_id}: {e}")
        
        except Exception as e:
            logger.error(f"Error fetching invoices for booking {booking_id}: {e}")
        
        return attachments
    
    async def _get_stripe_receipt_url(self, session_id: str, stripe_account_id: str) -> Optional[str]:
        """Get Stripe receipt URL from session ID"""
        try:
            checkout_session = stripe.checkout.Session.retrieve(
                session_id,
                stripe_account=stripe_account_id
            )
            
            if not checkout_session.payment_intent:
                return None
            
            payment_intent = stripe.PaymentIntent.retrieve(
                checkout_session.payment_intent,
                stripe_account=stripe_account_id
            )
            
            # Get charge ID
            charge_id = None
            if hasattr(payment_intent, 'latest_charge') and payment_intent.latest_charge:
                charge_id = payment_intent.latest_charge
            elif hasattr(payment_intent, 'charges') and payment_intent.charges:
                if isinstance(payment_intent.charges, dict) and 'data' in payment_intent.charges:
                    if len(payment_intent.charges.data) > 0:
                        charge_id = payment_intent.charges.data[0].id
                elif isinstance(payment_intent.charges, list) and len(payment_intent.charges) > 0:
                    charge_id = payment_intent.charges[0]
            
            if not charge_id:
                return None
            
            # Get receipt URL
            charge = stripe.Charge.retrieve(
                charge_id,
                stripe_account=stripe_account_id
            )
            
            if hasattr(charge, 'receipt_url') and charge.receipt_url:
                return charge.receipt_url
            else:
                return f"https://pay.stripe.com/receipts/{charge_id}"
        
        except Exception as e:
            logger.error(f"Error getting Stripe receipt URL: {e}")
            return None
    
    async def _download_stripe_receipt(self, receipt_url: str) -> Optional[bytes]:
        """Download Stripe receipt as PDF"""
        try:
            async with httpx.AsyncClient() as client:
                # Stripe receipts are HTML pages, we'll try to get the PDF version
                # Stripe provides PDF receipts at receipt_url + "/pdf"
                pdf_url = receipt_url + "/pdf" if not receipt_url.endswith("/pdf") else receipt_url
                
                response = await client.get(pdf_url, follow_redirects=True, timeout=30.0)
                if response.status_code == 200:
                    return response.content
                else:
                    # If PDF not available, try to get HTML and convert (simplified - just return None for now)
                    logger.warning(f"Stripe receipt PDF not available at {pdf_url}, status: {response.status_code}")
                    return None
        except Exception as e:
            logger.warning(f"Could not download Stripe receipt from {receipt_url}: {e}")
            return None
    
    def _generate_deep_link(self, notification_type: str, recipient_role: str, booking_id: Optional[str] = None, payment_request_id: Optional[str] = None) -> str:
        """Generate a deep link URL based on notification type and recipient role"""
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000/').rstrip('/')
        
        # Booking-related notifications
        if booking_id:
            if recipient_role == 'client':
                return f"{frontend_url}/client/orders?tab=0&orderId={booking_id}"
            elif recipient_role == 'creative':
                return f"{frontend_url}/creative/activity?orderId={booking_id}"
        
        # Payment request notifications
        if payment_request_id:
            if recipient_role == 'client':
                return f"{frontend_url}/client/orders/payment-requests?paymentRequestId={payment_request_id}"
            elif recipient_role == 'creative':
                return f"{frontend_url}/creative/activity?paymentRequestId={payment_request_id}"
        
        # Default links based on role and notification type
        if recipient_role == 'client':
            if notification_type in ['new_client_added']:
                return f"{frontend_url}/client/orders"
            return f"{frontend_url}/client/orders"
        elif recipient_role == 'creative':
            if notification_type in ['new_client_added']:
                return f"{frontend_url}/creative/clients"
            return f"{frontend_url}/creative/activity"
        
        return frontend_url
    
    async def send_notification_email(
        self,
        to_email: str,
        notification_type: str,
        title: str,
        message: str,
        recipient_role: str,
        recipient_name: Optional[str] = None,
        booking_id: Optional[str] = None,
        payment_request_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> bool:
        """
        Send a notification email to a user
        
        Args:
            to_email: Recipient email address
            notification_type: Type of notification (booking_created, booking_approved, etc.)
            title: Notification title
            message: Notification message
            recipient_role: Role of recipient (client or creative)
            recipient_name: Recipient's display name (optional)
            booking_id: Booking ID if notification is booking-related (optional)
            payment_request_id: Payment request ID if notification is payment-related (optional)
            metadata: Additional metadata (optional)
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not resend.api_key:
            logger.warning(f"Skipping notification email to {to_email} - RESEND_API_KEY not configured")
            return False
        
        try:
            # Determine actual recipient (test mode vs production)
            actual_recipient = self.test_email if self.is_test_mode and self.test_email else to_email
            test_mode_note = ""
            if self.is_test_mode and self.test_email and actual_recipient != to_email:
                test_mode_note = f'<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;"><strong>🧪 TEST MODE:</strong> This email was intended for <strong>{to_email}</strong> but was redirected to the test email address.</div>'
            
            # Generate deep link
            deep_link = self._generate_deep_link(notification_type, recipient_role, booking_id, payment_request_id)
            
            # Get notification-specific styling and icon
            notification_style = self._get_notification_style(notification_type)
            
            # Personalize greeting
            greeting = f"Hi {recipient_name}!" if recipient_name else "Hi there!"
            
            # Build action button HTML if there's a deep link (for standard template)
            action_button = ""
            if booking_id or payment_request_id or notification_type == 'new_client_added':
                action_button = f'''
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{deep_link}" style="display: inline-block; padding: 14px 28px; background: {notification_style['button_color']}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        {notification_style['button_text']}
                    </a>
                </div>
                '''
            
            # Fetch invoice/receipt PDFs for payment_received notifications
            pdf_attachments = []
            if notification_type == 'payment_received' and booking_id:
                try:
                    pdf_attachments = await self._fetch_booking_invoices(booking_id, db_admin, allow_any_status=True)
                    logger.info(f"Fetched {len(pdf_attachments)} PDF attachments for booking {booking_id}")
                except Exception as e:
                    logger.error(f"Failed to fetch invoice PDFs for booking {booking_id}: {e}")
            
            # Enhanced email template for payment_received notifications
            if notification_type == 'payment_received':
                # More official/document-like template for payment receipts
                amount_paid = metadata.get('amount_paid', '') if metadata else ''
                service_title = metadata.get('service_title', 'Service') if metadata else 'Service'
                
                payment_details_section = ""
                if amount_paid:
                    payment_details_section = f'''
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e5e7eb;">
                        <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Payment Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                                <td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 600;">{service_title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Amount Paid:</td>
                                <td style="padding: 8px 0; color: #10b981; text-align: right; font-weight: 700; font-size: 18px;">${float(amount_paid):.2f}</td>
                            </tr>
                        </table>
                    </div>
                    '''
                
                attachments_note = ""
                if pdf_attachments:
                    attachment_names = [att['filename'] for att in pdf_attachments]
                    attachments_note = f'''
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #065f46;">📎 Attached Documents:</p>
                        <ul style="margin: 0; padding-left: 20px; color: #047857;">
                            {''.join([f'<li style="margin: 5px 0;">{name}</li>' for name in attachment_names])}
                        </ul>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #047857;">Please find your official invoice and receipt(s) attached to this email for your records.</p>
                    </div>
                    '''
                
                html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #111827;
                        max-width: 650px;
                        margin: 0 auto;
                        padding: 20px;
                        background: #f9fafb;
                    }}
                    .document-container {{
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }}
                    .header {{
                        text-align: center;
                        padding: 40px 30px;
                        background: {notification_style['header_gradient']};
                        color: white;
                    }}
                    .content {{
                        padding: 40px 30px;
                        background: white;
                    }}
                    .receipt-badge {{
                        display: inline-block;
                        background: #10b981;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        margin-bottom: 20px;
                    }}
                    .message-box {{
                        background: #f9fafb;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid {notification_style['accent_color']};
                    }}
                    .footer {{
                        text-align: center;
                        padding: 30px;
                        background: #f9fafb;
                        color: #6b7280;
                        font-size: 13px;
                        border-top: 1px solid #e5e7eb;
                    }}
                </style>
            </head>
            <body>
                <div class="document-container">
                    <div class="header">
                        {f'<img src="cid:logo" alt="EZ-web Logo" class="logo" style="max-width: 120px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />' if self.logo_path else ''}
                        <div class="receipt-badge">PAYMENT RECEIPT</div>
                        <h1 style="margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">{title}</h1>
                    </div>
                    <div class="content">
                        {test_mode_note}
                        <p style="font-size: 16px; margin: 0 0 20px 0;">{greeting}</p>
                        
                        <div class="message-box">
                            <p style="margin: 0; font-size: 16px; line-height: 1.6;">{message}</p>
                        </div>
                        
                        {payment_details_section}
                        
                        {attachments_note}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{deep_link}" style="display: inline-block; padding: 14px 28px; background: {notification_style['button_color']}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                {notification_style['button_text']}
                            </a>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                            This is an official payment receipt. Please keep this email and the attached documents for your records.
                        </p>
                        
                        <p style="margin-top: 30px; color: #111827;">Best regards,<br><strong>The EZ-web Team</strong></p>
                    </div>
                    <div class="footer">
                        <p style="margin: 0;">This email was sent to {to_email}</p>
                        <p style="margin: 10px 0 0 0;">&copy; 2026 EZ-web. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            else:
                # Standard notification email template
                html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        text-align: center;
                        padding: 30px 0;
                        background: {notification_style['header_gradient']};
                        color: white;
                        border-radius: 8px 8px 0 0;
                    }}
                    .content {{
                        padding: 30px;
                        background: #f8fafc;
                        border-radius: 0 0 8px 8px;
                    }}
                    .notification-card {{
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid {notification_style['accent_color']};
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 14px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    {f'<img src="cid:logo" alt="EZ-web Logo" class="logo" style="max-width: 120px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />' if self.logo_path else ''}
                    <h1 style="margin: 0;">{title}</h1>
                </div>
                <div class="content">
                    {test_mode_note}
                    <p>{greeting}</p>
                    
                    <div class="notification-card">
                        <p style="margin: 0; font-size: 16px;">{message}</p>
                    </div>
                    
                    {action_button}
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        You can view all your notifications in your dashboard.
                    </p>
                    
                    <p>Best regards,<br>The EZ-web Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to {to_email}</p>
                    <p>&copy; 2026 EZ-web. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            # Prepare email parameters
            params = {
                "from": self.from_email,
                "to": [actual_recipient],
                "subject": title,
                "html": html_content
            }
            
            # Prepare attachments list
            attachments_list = []
            
            # Add logo as inline attachment if available
            if self.logo_path:
                try:
                    with open(self.logo_path, "rb") as logo_file:
                        logo_data = logo_file.read()
                        logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                        attachments_list.append({
                            "filename": "logo.png",
                            "content": logo_base64,
                            "content_id": "logo",
                            "content_type": "image/png"
                        })
                except Exception as e:
                    logger.warning(f"Failed to attach logo: {str(e)}")
            
            # Add PDF attachments for payment_received notifications
            if pdf_attachments:
                for pdf_att in pdf_attachments:
                    attachments_list.append({
                        "filename": pdf_att['filename'],
                        "content": pdf_att['content'],
                        "content_type": pdf_att['content_type']
                    })
            
            if attachments_list:
                params["attachments"] = attachments_list
            
            response = resend.Emails.send(params)
            if self.is_test_mode and self.test_email and actual_recipient != to_email:
                logger.info(f"Notification email sent to TEST EMAIL ({actual_recipient}) - originally intended for {to_email}. Email ID: {response.get('id')}")
            else:
                logger.info(f"Notification email sent successfully to {to_email}. Email ID: {response.get('id')}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send notification email to {to_email}: {str(e)}")
            return False
    
    def _get_notification_style(self, notification_type: str) -> dict:
        """Get styling and button text based on notification type"""
        styles = {
            'booking_created': {
                'header_gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'accent_color': '#667eea',
                'button_color': '#667eea',
                'button_text': 'View Booking Request'
            },
            'booking_placed': {
                'header_gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'accent_color': '#667eea',
                'button_color': '#667eea',
                'button_text': 'View Your Booking'
            },
            'booking_approved': {
                'header_gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                'accent_color': '#10b981',
                'button_color': '#10b981',
                'button_text': 'View Booking'
            },
            'booking_rejected': {
                'header_gradient': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                'accent_color': '#ef4444',
                'button_color': '#ef4444',
                'button_text': 'View Details'
            },
            'booking_canceled': {
                'header_gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                'accent_color': '#f59e0b',
                'button_color': '#f59e0b',
                'button_text': 'View Details'
            },
            'payment_required': {
                'header_gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                'accent_color': '#f59e0b',
                'button_color': '#f59e0b',
                'button_text': 'Make Payment'
            },
            'payment_received': {
                'header_gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                'accent_color': '#10b981',
                'button_color': '#10b981',
                'button_text': 'View Order'
            },
            'session_completed': {
                'header_gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                'accent_color': '#10b981',
                'button_color': '#10b981',
                'button_text': 'View Order'
            },
            'new_client_added': {
                'header_gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'accent_color': '#667eea',
                'button_color': '#667eea',
                'button_text': 'View Clients'
            },
            'payment_reminder': {
                'header_gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                'accent_color': '#f59e0b',
                'button_color': '#f59e0b',
                'button_text': 'Make Payment'
            }
        }
        
        return styles.get(notification_type, {
            'header_gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'accent_color': '#667eea',
            'button_color': '#667eea',
            'button_text': 'View Details'
        })


# Create a singleton instance
email_service = EmailService()
