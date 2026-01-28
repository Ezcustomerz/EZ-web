from fastapi import APIRouter, HTTPException, Request
import logging
from core.limiter import limiter
from services.email.email_service import email_service
from schemas.contact import ContactFormRequest, ContactFormResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=ContactFormResponse)
@limiter.limit("3 per 15 minutes")
async def submit_contact_form(request: Request, form: ContactFormRequest):
    """
    Submit contact form - sends email to admin and confirmation to user.
    Public endpoint (no authentication required).
    Rate limited to 3 submissions per 15 minutes per IP.
    """
    try:
        logger.info(f"Contact form submission from {form.email}")

        # Send email to admin
        admin_sent = await email_service.send_contact_form_email(
            form.name, form.email, form.message
        )

        # Send confirmation to user
        user_sent = await email_service.send_contact_confirmation_email(
            form.email, form.name, form.message
        )

        if admin_sent:
            return ContactFormResponse(
                success=True,
                message="Thank you for contacting us! We'll respond soon."
            )
        else:
            logger.error(f"Contact form email failed for {form.email}")
            return ContactFormResponse(
                success=False,
                error="Unable to send message. Please try again."
            )

    except Exception as e:
        logger.error(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
