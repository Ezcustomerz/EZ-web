import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  Fade,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { LayoutWeb } from '../../layout/web/LayoutWeb';

export function ContactUs() {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Connect to backend to send email
    setOpen(false);
  };

  return (
    <LayoutWeb>
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 6 },
          py: { xs: 8, md: 10 }, // increased top padding
          mt: { xs: 4, md: 4 },  
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.background.paper})`,
          borderRadius: 3,
          boxShadow: 4,
          maxWidth: 800,
          mx: 'auto',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: 0.5,
          }}
        >
          Contact Us
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 4, color: 'text.secondary', maxWidth: 600 }}
        >
          Have a question, a project idea, or just want to say hello?  
          We’d love to hear from you.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => setOpen(true)}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 3,
            textTransform: 'none',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: 4,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 8,
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Send a Message
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          closeAfterTransition
          sx={{ backdropFilter: 'blur(4px)' }}
        >
          <Fade in={open}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '85%', sm: 420 },
                bgcolor: 'background.paper',
                borderRadius: 3,
                boxShadow: 10,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Send us a message
                </Typography>
                <IconButton onClick={() => setOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              <TextField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                fullWidth
                required
              />
              <TextField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Your Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                required
              />

              <Button
                type="submit"
                variant="contained"
                endIcon={<SendRoundedIcon />}
                sx={{
                  mt: 1,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 600,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  '&:hover': {
                    opacity: 0.9,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Send Message
              </Button>
            </Box>
          </Fade>
        </Modal>
      </Box>
    </LayoutWeb>
  );
}
