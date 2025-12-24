"""
Service for generating compliance sheets for orders
"""
import io
from datetime import datetime
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import logging

logger = logging.getLogger(__name__)


class ComplianceService:
    """Service for generating compliance documentation"""
    
    @staticmethod
    def generate_compliance_sheet(order_data: Dict[str, Any]) -> bytes:
        """
        Generate a compliance sheet PDF for an order
        
        Args:
            order_data: Dictionary containing order information including:
                - id: Booking ID
                - service_name: Name of the service
                - creative_name: Name of the creative
                - order_date: Order date
                - price: Order price
                - payment_option: Payment option
                - client_status: Current client status
                - approved_at: Approval timestamp (if applicable)
                - canceled_date: Cancellation date (if applicable)
                - completed_date: Completion date (if applicable)
        
        Returns:
            bytes: PDF file content
        """
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter,
                                  rightMargin=72, leftMargin=72,
                                  topMargin=72, bottomMargin=18)
            
            # Container for the 'Flowable' objects
            elements = []
            
            # Define styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=30,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold'
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=12,
                spaceBefore=20,
                fontName='Helvetica-Bold'
            )
            
            subheading_style = ParagraphStyle(
                'CustomSubheading',
                parent=styles['Heading3'],
                fontSize=14,
                textColor=colors.HexColor('#374151'),
                spaceAfter=8,
                spaceBefore=12,
                fontName='Helvetica-Bold'
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor('#111827'),
                spaceAfter=10,
                alignment=TA_JUSTIFY,
                leading=14
            )
            
            # Title
            elements.append(Paragraph("EZ CUSTOMERS — COMPLIANCE SUMMARY SHEET", title_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Date prepared
            date_prepared = datetime.now().strftime("%B %d, %Y")
            elements.append(Paragraph(f"Date Prepared: {date_prepared}", styles['Normal']))
            elements.append(Spacer(1, 0.3*inch))
            
            # Introduction
            intro_text = """
            This document provides a comprehensive overview of the legal and compliance framework 
            implemented by the EZ Customers platform for this specific service order. It summarizes 
            the key documents governing user relationships, data privacy, financial transparency, and 
            consent tracking. This structure ensures compliance with Canadian (PIPEDA) and U.S. (CCPA) 
            privacy laws while maintaining readiness for GDPR expansion.
            """
            elements.append(Paragraph(intro_text.strip(), normal_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Order Information Section
            elements.append(Paragraph("ORDER INFORMATION", heading_style))
            
            # Create order details table
            order_details = [
                ['Booking Reference:', order_data.get('id', 'N/A')],
                ['Service Name:', order_data.get('service_name', 'N/A')],
                ['Creative Provider:', order_data.get('creative_name', 'N/A')],
                ['Order Date:', format_date(order_data.get('order_date'))],
                ['Order Status:', format_status(order_data.get('client_status', 'N/A'))],
                ['Service Price:', f"${order_data.get('price', 0):.2f}"],
                ['Payment Option:', format_payment_option(order_data.get('payment_option', 'N/A'), order_data)],
            ]
            
            # Add conditional dates
            if order_data.get('approved_at'):
                order_details.append(['Approved Date:', format_date(order_data.get('approved_at'))])
            if order_data.get('completed_date'):
                order_details.append(['Completed Date:', format_date(order_data.get('completed_date'))])
            if order_data.get('canceled_date'):
                order_details.append(['Canceled Date:', format_date(order_data.get('canceled_date'))])
            
            order_table = Table(order_details, colWidths=[2.5*inch, 4.5*inch])
            order_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(order_table)
            elements.append(Spacer(1, 0.3*inch))
            
            # Compliance Documents Section
            elements.append(Paragraph("COMPLIANCE DOCUMENTS", heading_style))
            
            # Terms of Service
            elements.append(Paragraph("1. Terms of Service (TOS)", subheading_style))
            tos_text = """
            The primary binding agreement between EZ Customers and all users (Clients and Creatives). 
            Governs all platform activities, including service bookings, refunds, file storage, and user conduct. 
            Defines platform fees (2.8% Basic, 1.6% Plus) and clarifies that EZ Customers is not liable for 
            disputes between users.
            """
            elements.append(Paragraph(tos_text.strip(), normal_style))
            elements.append(Paragraph("<b>Visibility:</b> Displayed and accepted at account creation and booking confirmation.", normal_style))
            elements.append(Paragraph("<b>Retention:</b> Permanent; each acceptance is logged in the Consent Record.", normal_style))
            elements.append(Spacer(1, 0.15*inch))
            
            # Privacy Policy
            elements.append(Paragraph("2. Privacy Policy", subheading_style))
            privacy_text = """
            Explains how EZ Customers collects, processes, and protects user data, covering personal information, 
            uploaded content, and analytics data processed via Stripe, EmailJS, Supabase, and Google Analytics. 
            Ensures transparency in handling creative intellectual property and outlines deletion timelines (45 days for files).
            """
            elements.append(Paragraph(privacy_text.strip(), normal_style))
            elements.append(Paragraph("<b>Visibility:</b> Publicly accessible; accepted automatically with the TOS.", normal_style))
            elements.append(Paragraph("<b>Retention:</b> Permanent, to meet legal compliance requirements.", normal_style))
            elements.append(Spacer(1, 0.15*inch))
            
            # Invoice Templates
            elements.append(Paragraph("3. Invoice Templates (Client & Creative)", subheading_style))
            invoice_text = """
            Invoices are generated automatically for every confirmed booking. The Client invoice lists service details 
            and payment milestones without disclosing platform fees. The Creative invoice provides a full breakdown 
            including EZ Customers platform fees and Stripe processing fees, allowing transparency in net payouts. 
            Each invoice accommodates up to three possible payments (booking fee, pre-delivery payment, and post-delivery payment).
            """
            elements.append(Paragraph(invoice_text.strip(), normal_style))
            elements.append(Paragraph("<b>Visibility:</b> Shared with both Client and Creative via dashboard or email immediately after booking.", normal_style))
            elements.append(Paragraph("<b>Retention:</b> 45 days; users are advised to download copies for record-keeping.", normal_style))
            elements.append(Spacer(1, 0.15*inch))
            
            # Consent Record
            elements.append(Paragraph("4. Consent Record (System Log)", subheading_style))
            consent_text = """
            The platform's internal audit log for user agreements and consents. The log includes timestamps, agreement 
            versions, and unique booking references to verify user acceptance of the latest Terms and Privacy Policy. 
            The record ensures enforceability in disputes and provides traceability for compliance audits.
            """
            elements.append(Paragraph(consent_text.strip(), normal_style))
            elements.append(Paragraph("<b>Visibility:</b> Accessible only to authorized administrators for verification.", normal_style))
            elements.append(Paragraph("<b>Retention:</b> Permanent.", normal_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Summary
            elements.append(Paragraph("SUMMARY", heading_style))
            summary_text = """
            The four documents listed above establish the full compliance foundation for EZ Customers. These documents 
            enable transparent, automated, and enforceable transactions. They protect all parties' legal and data rights. 
            The framework exceeds baseline small-business standards and positions EZ Customers for scalable regulatory 
            compliance in Canada, the U.S., and future global markets.
            """
            elements.append(Paragraph(summary_text.strip(), normal_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Footer note
            footer_text = """
            <i>This compliance sheet is generated automatically for each service order and serves as a record of the 
            compliance framework applicable to this transaction. For questions or concerns, please contact EZ Customers support.</i>
            """
            elements.append(Paragraph(footer_text.strip(), normal_style))
            
            # Build PDF
            doc.build(elements)
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error generating compliance sheet: {e}")
            raise


def format_date(date_str: str) -> str:
    """Format date string for display"""
    if not date_str:
        return 'N/A'
    try:
        if isinstance(date_str, str):
            # Try parsing ISO format
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime("%B %d, %Y")
        return str(date_str)
    except:
        return str(date_str)


def format_status(status: str) -> str:
    """Format status for display"""
    status_map = {
        'placed': 'Placed',
        'confirmed': 'Confirmed',
        'payment_required': 'Payment Required',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Canceled',
        'canceled': 'Canceled',
        'locked': 'Locked',
        'download': 'Download Available'
    }
    return status_map.get(status.lower(), status.title())


def format_payment_option(option: str, order_data: Dict[str, Any] = None) -> str:
    """Format payment option for display"""
    option_lower = option.lower()
    
    if option_lower == 'split' and order_data:
        # Use split_deposit_amount if available, otherwise default to 50%
        price = float(order_data.get('price', 0))
        split_deposit_amount = order_data.get('split_deposit_amount')
        
        if split_deposit_amount is not None:
            deposit_amount = round(float(split_deposit_amount), 2)
            remaining_amount = round(price - deposit_amount, 2)
            return f'Split Payment (${deposit_amount:.2f} upfront, ${remaining_amount:.2f} on completion)'
        else:
            # Fallback to 50% if split_deposit_amount not provided
            deposit_amount = round(price * 0.5, 2)
            remaining_amount = round(price - deposit_amount, 2)
            return f'Split Payment (${deposit_amount:.2f} upfront, ${remaining_amount:.2f} on completion)'
    
    option_map = {
        'upfront': 'Payment Upfront',
        'split': 'Split Payment',
        'later': 'Payment Later',
        'free': 'Free Service'
    }
    return option_map.get(option_lower, option.title())

