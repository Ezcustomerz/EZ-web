import { useState } from 'react';
import { Box, Button, Typography, Modal, TextField } from '@mui/material';
import { LayoutWeb } from '../../layout/web/LayoutWeb';

export function ContactUs() {
  const [open, setOpen] = useState(false);

  // Simple form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: connect to backend to send email later
    setOpen(false);
  };

  return (
    <LayoutWeb>
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 6, xl: 8 },
          py: { xs: 4, md: 6 },
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}
        >
          Contact Us
        </Typography>

        {/* Button to open modal */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Open Contact Form
        </Button>

        {/* Pop-up modal */}
        <Modal open={open} onClose={() => setOpen(false)}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '85%', sm: 400 },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Send us a message
            </Typography>

            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
            />
            <TextField
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              multiline
              rows={4}
              required
            />

            <Button type="submit" variant="contained" color="primary">
              Send Message
            </Button>
          </Box>
        </Modal>
      </Box>
    </LayoutWeb>
  );
}
