# Email Service

This service handles sending transactional emails using [Resend](https://resend.com/).

## Setup

### 1. Install Dependencies

```bash
pip install resend
```

### 2. Configure API Key

Add your Resend API key to the backend `.env` file:

```bash
RESEND_API_KEY=re_your_api_key_here
```

### 3. Get Your API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy and add it to your `.env` file

## Usage

### Sending Welcome Emails

```python
from services.email.email_service import email_service

# Send welcome email
await email_service.send_welcome_email(
    to_email="user@example.com",
    user_name="John Doe",
    user_role="client"  # or "creative", "advocate"
)
```

### Sending Booking Confirmation

```python
# Send booking confirmation
await email_service.send_booking_confirmation(
    to_email="client@example.com",
    client_name="John Doe",
    creative_name="Jane Smith",
    service_title="Logo Design",
    booking_date="2026-02-15",
    booking_time="2:00 PM - 3:00 PM"
)
```

## Email Templates

Currently available email types:

1. **Welcome Email** - Sent when a user first creates their account
   - Customized based on user role (client, creative, advocate)
   - Includes role-specific next steps

2. **Booking Confirmation** - Sent when a booking is created
   - Includes service details, creative name, and scheduling info

## Testing

### Using Resend's Test Domain

For development, Resend provides a test domain `onboarding@resend.dev` that you can use to send test emails. The emails will be sent to your inbox.

### Switch to Your Domain

Once ready for production:

1. Verify your domain in Resend dashboard
2. Update the `from_email` in `email_service.py`:
   ```python
   self.from_email = "EZ-web <noreply@yourdomain.com>"
   ```

## Error Handling

Email sending errors are logged but don't cause profile creation to fail. This ensures that a failed email doesn't prevent users from signing up.

## Future Enhancements

Additional email types to implement:
- Invite notifications
- Payment receipts
- Order status updates
- Booking approval/rejection
- Password reset
- Deliverable upload notifications
