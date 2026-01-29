"""
Service for generating EZ Customers invoices/receipts
"""
import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from core.safe_errors import log_exception_if_dev
import logging

logger = logging.getLogger(__name__)


class InvoiceService:
    """Service for generating invoice/receipt documents"""
    
    @staticmethod
    def generate_client_invoice(
        order_data: Dict[str, Any],
        payment_data: Optional[List[Dict[str, Any]]] = None
    ) -> bytes:
        """
        Generate a client invoice PDF for an order
        
        Args:
            order_data: Dictionary containing order information including:
                - id: Booking ID
                - service_name: Name of the service
                - service_description: Description of the service
                - creative_name: Name of the creative
                - creative_email: Email of the creative
                - client_name: Name of the client
                - client_email: Email of the client
                - order_date: Order date
                - booking_date: Booking date (if applicable)
                - price: Total order price
                - payment_option: Payment option (upfront, split, later, free)
                - amount_paid: Total amount paid so far
                - approved_at: Approval timestamp (if applicable)
                - completed_date: Completion date (if applicable)
            payment_data: List of payment records with:
                - amount: Payment amount
                - payment_date: Date of payment
                - payment_type: Type of payment (booking_fee, pre_delivery, post_delivery)
                - status: Payment status
        
        Returns:
            bytes: PDF file content
        """
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter,
                                  rightMargin=72, leftMargin=72,
                                  topMargin=72, bottomMargin=18)
            
            elements = []
            
            # Define styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=20,
                textColor=colors.HexColor('#000000'),
                spaceAfter=20,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold'
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#000000'),
                spaceAfter=12,
                spaceBefore=16,
                fontName='Helvetica-Bold'
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor('#000000'),
                spaceAfter=8,
                alignment=TA_LEFT,
                leading=14
            )
            
            # Title
            elements.append(Paragraph("EZ CUSTOMERS – CLIENT INVOICE", title_style))
            elements.append(Spacer(1, 0.1*inch))
            
            # Date issued
            date_issued = datetime.now().strftime("%B %d, %Y")
            elements.append(Paragraph(f"Date Issued: {date_issued}", normal_style))
            elements.append(Paragraph("Issued by EZ Customers on behalf of the Creative", normal_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Parties Section
            elements.append(Paragraph("Parties", heading_style))
            
            parties_data = [
                ['Creative Name:', order_data.get('creative_name', 'N/A')],
                ['Creative Email:', order_data.get('creative_email', 'N/A')],
                ['Client Name:', order_data.get('client_name', 'N/A')],
                ['Client Email:', order_data.get('client_email', 'N/A')],
            ]
            
            parties_table = Table(parties_data, colWidths=[2*inch, 4.5*inch])
            parties_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ]))
            elements.append(parties_table)
            elements.append(Spacer(1, 0.2*inch))
            
            # Service Information Section
            elements.append(Paragraph("Service Information", heading_style))
            
            booking_date = order_data.get('booking_date')
            booking_date_str = format_date(booking_date) if booking_date else 'N/A'
            
            estimated_completion = order_data.get('completed_date') or order_data.get('approved_at')
            estimated_completion_str = format_date(estimated_completion) if estimated_completion else 'N/A'
            
            service_data = [
                ['Service Name:', order_data.get('service_name', 'N/A')],
                ['Description:', order_data.get('service_description', order_data.get('description', 'N/A'))],
                ['Booking Reference:', order_data.get('id', 'N/A')],
                ['Date of Booking:', format_date(order_data.get('order_date'))],
                ['Estimated Completion:', estimated_completion_str],
            ]
            
            service_table = Table(service_data, colWidths=[2*inch, 4.5*inch])
            service_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ]))
            elements.append(service_table)
            elements.append(Spacer(1, 0.2*inch))
            
            # Payment Schedule Section
            elements.append(Paragraph("Payment Schedule", heading_style))
            
            # Determine payment stages based on payment_option
            payment_option = order_data.get('payment_option', 'later').lower()
            total_price = float(order_data.get('price', 0))
            amount_paid = float(order_data.get('amount_paid', 0))
            
            # Build payment schedule table
            payment_headers = ['Payment Stage', 'Amount (CAD)', 'Due Timing', 'Status']
            payment_rows = []
            
            if payment_option == 'split':
                # Split payment: use configurable deposit amount or default to 50%
                split_deposit_amount = order_data.get('split_deposit_amount')
                if split_deposit_amount is not None:
                    deposit_amount = round(float(split_deposit_amount), 2)
                else:
                    deposit_amount = round(total_price * 0.5, 2)
                remaining_amount = round(total_price - deposit_amount, 2)
                
                # Booking Fee (deposit)
                booking_status = 'Paid' if amount_paid >= deposit_amount else 'Pending'
                payment_rows.append([
                    'Booking Fee',
                    f'${deposit_amount:.2f}',
                    'Before Commission',
                    booking_status
                ])
                
                # Payment After Delivery
                final_status = 'Paid' if amount_paid >= total_price else 'Pending'
                payment_rows.append([
                    'Payment After Delivery',
                    f'${remaining_amount:.2f}',
                    'Upon Completion',
                    final_status
                ])
            elif payment_option == 'upfront':
                # Full payment upfront
                upfront_status = 'Paid' if amount_paid >= total_price else 'Pending'
                payment_rows.append([
                    'Booking Fee',
                    f'${total_price:.2f}',
                    'Before Commission',
                    upfront_status
                ])
            elif payment_option == 'later':
                # Payment after completion
                later_status = 'Paid' if amount_paid >= total_price else 'Pending'
                payment_rows.append([
                    'Payment After Delivery',
                    f'${total_price:.2f}',
                    'Upon Completion',
                    later_status
                ])
            else:  # free
                payment_rows.append([
                    'Service Fee',
                    '$0.00',
                    'N/A',
                    'Paid'
                ])
            
            # If we have payment_data, use it to show actual payments
            if payment_data:
                payment_rows = []
                for payment in payment_data:
                    payment_type = payment.get('payment_type', 'Payment')
                    amount = payment.get('amount', 0)
                    payment_date = payment.get('payment_date')
                    status = payment.get('status', 'Paid')
                    
                    due_timing = 'Before Commission'
                    if payment_type == 'pre_delivery':
                        due_timing = 'Before Service Delivery'
                    elif payment_type == 'post_delivery':
                        due_timing = 'Upon Completion'
                    
                    payment_rows.append([
                        payment_type.replace('_', ' ').title(),
                        f'${float(amount):.2f}',
                        due_timing,
                        status
                    ])
            
            payment_table_data = [payment_headers] + payment_rows
            payment_table = Table(payment_table_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            payment_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(payment_table)
            elements.append(Spacer(1, 0.2*inch))
            
            # Legal Notes Section
            elements.append(Paragraph("Legal Notes", heading_style))
            
            creative_email = order_data.get('creative_email', '[creative_email_here]')
            legal_text = f"""
            All platform and Stripe fees are final and non-refundable. This invoice is valid for 45 days 
            and should be downloaded for your records.
            
            This invoice and related transactions are governed by the EZ Customers Terms of Service. 
            For support, contact the Creative directly at: {creative_email}
            """
            
            elements.append(Paragraph(legal_text.strip(), normal_style))
            
            # Build PDF
            doc.build(elements)
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            log_exception_if_dev(logger, "Error generating invoice", e)
            raise


def format_date(date_str: Any) -> str:
    """Format date string for display"""
    if not date_str:
        return 'N/A'
    try:
        if isinstance(date_str, str):
            # Try parsing ISO format
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime("%B %d, %Y")
        elif isinstance(date_str, datetime):
            return date_str.strftime("%B %d, %Y")
        return str(date_str)
    except:
        return str(date_str)

