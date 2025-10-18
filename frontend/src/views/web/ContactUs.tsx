import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { LayoutWeb } from '../../layout/web/LayoutWeb';

export function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    if (!name || !email || !message) {
      setErrorMsg('Please fill out all fields.');
      setStatus('error');
      return;
    }

    try {
      // TODO: replace URL with actual backend endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus('success');
        setErrorMsg('');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  return (
    <LayoutWeb>
      <Box sx={{ px: { xs: 2, sm: 3, md: 6, xl: 8 }, py: { xs: 4, md: 6 }, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Contact Us
        </Typography>

        {status === 'success' && <Alert severity="success" sx={{ mb: 2 }}>Your message has been sent!</Alert>}
        {status === 'error' && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" color="primary">
            Send Message
          </Button>
        </form>
      </Box>
    </LayoutWeb>
  );
}

/* 
  CONTACT FORM BACKEND ROADMAP:

  1. Create API Route:
     - POST /api/contact
     - Receives: { name: string, email: string, message: string }

  2. Validate Input:
     - Ensure 'name' is not empty
     - Ensure 'email' has valid format
     - Ensure 'message' is not empty and has reasonable max length (e.g., 1000 chars)

  3. Optional: Spam/Rate Protection
     - Add CAPTCHA (Google reCAPTCHA)
     - Basic rate limiting per IP or user

  4. Send Email:
     - Use NodeMailer, SendGrid, or Mailgun
     - Include name, email, message in email body
     - Optional: add timestamp, user IP for context

  5. Handle Response:
     - Success: return JSON { success: true }
     - Failure: return JSON { success: false, error: "message" }

  6. Optional: Store Submissions in Database
     - Store fields: name, email, message, timestamp
     - Useful for auditing or follow-up

  7. Security:
     - Validate requests (CORS)
     - Keep SMTP credentials safe
     - Avoid open-relay issues

  8. Frontend Integration:
     - Form submits via fetch/Axios to /api/contact
     - Display success/error messages
     - Optional: clear form on success
*/
