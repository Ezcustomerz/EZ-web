import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, keyframes } from '@mui/material';
import { LayoutWeb } from '../../layout/web/LayoutWeb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMicrophone, 
  faPalette, 
  faCamera, 
  faPaintBrush,
  faVideo,
  faEnvelope,
  faUser,
  faMessage
} from '@fortawesome/free-solid-svg-icons';

// Animation keyframes
const floatUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const gradientShift = keyframes`
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
`;

const scrollLeft = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
`;

const scrollRight = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
`;

const sparkle = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
`;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Creative theme icons
const creativeThemes = [
  { icon: faMicrophone, color: '#FF6B6B', name: 'Music', emoji: '🎵' },
  { icon: faPalette, color: '#4ECDC4', name: 'Art', emoji: '🎨' },
  { icon: faCamera, color: '#FFE66D', name: 'Photography', emoji: '📸' },
  { icon: faVideo, color: '#A8E6CF', name: 'Video', emoji: '🎬' },
  { icon: faPaintBrush, color: '#FF8B94', name: 'Design', emoji: '🖌️' },
];

export function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTheme, setCurrentTheme] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Rotate through creative themes every 4 seconds
    const themeInterval = setInterval(() => {
      setCurrentTheme((prev) => (prev + 1) % creativeThemes.length);
    }, 4000);
    return () => clearInterval(themeInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !message) {
      setErrorMsg('Please fill out all fields.');
      setStatus('error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
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
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  const activeTheme = creativeThemes[currentTheme];

  return (
    <LayoutWeb>
      <Box 
        sx={{ 
          minHeight: 'calc(100vh - 200px)',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${activeTheme.color}15 0%, ${creativeThemes[(currentTheme + 1) % creativeThemes.length].color}15 100%)`,
          backgroundSize: '200% 200%',
          animation: `${gradientShift} 8s ease infinite`,
        }}
      >
        {/* Flowing Themes Background Animation */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Multiple rows of flowing themes - more spaced out */}
          {[0, 1].map((rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                position: 'absolute',
                top: `${20 + rowIndex * 40}%`,
                display: 'flex',
                width: '300%',
                animation: rowIndex % 2 === 0 
                  ? `${scrollLeft} ${40 + rowIndex * 10}s linear infinite`
                  : `${scrollRight} ${45 + rowIndex * 10}s linear infinite`,
              }}
            >
              {/* Duplicate themes for seamless loop - more spaced */}
              {[...creativeThemes, ...creativeThemes, ...creativeThemes].map((themeItem, index) => (
                <Box
                  key={`${rowIndex}-${index}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: { xs: 200, md: 280 },
                    mx: { xs: 4, md: 6 },
                    py: { xs: 3, md: 4 },
                    opacity: 0.15,
                    transition: 'opacity 0.5s ease',
                  }}
                >
                  <Box
                    sx={{
                      fontSize: { xs: '3.5rem', md: '5rem' },
                      animation: `${float} ${5 + rowIndex * 2}s infinite ease-in-out`,
                      animationDelay: `${index * 0.3}s`,
                      filter: 'blur(0.5px)',
                    }}
                  >
                    {themeItem.emoji}
                  </Box>
                </Box>
              ))}
            </Box>
          ))}

          {/* Subtle floating sparkles - fewer and more spaced */}
          {[...Array(4)].map((_, i) => (
            <Box
              key={`sparkle-${i}`}
              sx={{
                position: 'absolute',
                top: `${15 + (i * 25)}%`,
                left: `${10 + (i * 20)}%`,
                width: { xs: 4, md: 6 },
                height: { xs: 4, md: 6 },
                borderRadius: '50%',
                background: creativeThemes[i % creativeThemes.length].color,
                opacity: 0.2,
                animation: `${sparkle} ${3 + i * 0.5}s infinite ease-in-out`,
                animationDelay: `${i * 0.6}s`,
                boxShadow: `0 0 6px ${creativeThemes[i % creativeThemes.length].color}`,
              }}
            />
          ))}
        </Box>

        <Box 
          sx={{ 
            px: { xs: 2, sm: 3, md: 6, xl: 8 }, 
            py: { xs: 4, md: 8 },
            maxWidth: 800,
            mx: 'auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Header Section */}
          <Box 
            sx={{ 
              textAlign: 'center',
              mb: 5,
              opacity: 0,
              animation: isLoaded ? `${floatUp} 0.8s ease-out 0.2s both` : 'none',
            }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 2,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${activeTheme.color} 0%, ${creativeThemes[(currentTheme + 1) % creativeThemes.length].color} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.5s ease',
              }}
            >
              Get in Touch
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              We'd love to hear from you! Whether you're a creative professional, client, or just curious about EZ, drop us a line.
            </Typography>
          </Box>

          {/* Form Card */}
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              p: { xs: 3, md: 5 },
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
              border: `2px solid ${activeTheme.color}20`,
              opacity: 0,
              animation: isLoaded ? `${floatUp} 0.8s ease-out 0.4s both` : 'none',
              transition: 'border-color 0.5s ease',
            }}
          >
            {status === 'success' && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  animation: `${floatUp} 0.5s ease-out`,
                }}
              >
                🎉 Your message has been sent! We'll get back to you soon.
              </Alert>
            )}
            {status === 'error' && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  animation: `${floatUp} 0.5s ease-out`,
                }}
              >
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              <TextField
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1.5,
                        color: activeTheme.color,
                        transition: 'color 0.5s ease',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <FontAwesomeIcon icon={faUser} style={{ fontSize: '1rem' }} />
                    </Box>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${activeTheme.color}30`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${activeTheme.color}20`,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: activeTheme.color,
                  },
                }}
              />

              {/* Email Field */}
              <TextField
                label="Your Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1.5,
                        color: activeTheme.color,
                        transition: 'color 0.5s ease',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '1rem' }} />
                    </Box>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${activeTheme.color}30`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${activeTheme.color}20`,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: activeTheme.color,
                  },
                }}
              />

              {/* Message Field */}
              <TextField
                label="Your Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                required
                multiline
                rows={6}
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1.5,
                        color: activeTheme.color,
                        transition: 'color 0.5s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        alignSelf: 'flex-start',
                        pt: 2,
                      }}
                    >
                      <FontAwesomeIcon icon={faMessage} style={{ fontSize: '1rem' }} />
                    </Box>
                  ),
                }}
                sx={{
                  mb: 4,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    alignItems: 'flex-start',
                    '& .MuiInputAdornment-root': {
                      alignItems: 'flex-start',
                      paddingTop: '16px',
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${activeTheme.color}30`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${activeTheme.color}20`,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: activeTheme.color,
                  },
                }}
              />

              {/* Submit Button - Shaped like the active creative icon */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    position: 'relative',
                    overflow: 'visible',
                    minWidth: { xs: 200, md: 250 },
                    height: { xs: 56, md: 64 },
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${activeTheme.color} 0%, ${creativeThemes[(currentTheme + 1) % creativeThemes.length].color} 100%)`,
                    backgroundSize: '200% 200%',
                    animation: `${gradientShift} 3s ease infinite, ${pulse} 2s infinite ease-in-out`,
                    color: 'white',
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: `0 8px 24px ${activeTheme.color}50`,
                    transition: 'all 0.3s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 4,
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                      backgroundSize: '200% 100%',
                      animation: `${shimmer} 3s infinite`,
                    },
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.05)',
                      boxShadow: `0 12px 32px ${activeTheme.color}70`,
                      '&::before': {
                        animation: 'none',
                      },
                    },
                    '&:active': {
                      transform: 'translateY(-2px) scale(1.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                    <FontAwesomeIcon 
                      icon={activeTheme.icon} 
                      style={{ fontSize: '1.5rem' }}
                    />
                    <span>Send Message</span>
                  </Box>
                </Button>
              </Box>
            </form>
          </Box>

        </Box>
      </Box>
    </LayoutWeb>
  );
}
