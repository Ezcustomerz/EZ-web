import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { Box, Card, CardContent, keyframes } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faDollarSign, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { LayoutWeb } from '../../layout/web/LayoutWeb';
import { useTheme } from '@mui/material/styles';
import { AnimatedButton } from '../../components/buttons/MusicButton';

// Animation keyframes
const slideInLeft = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-40px) translateZ(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateZ(0);
  }
`;

const slideInRight = keyframes`
  0% {
    opacity: 0;
    transform: translateX(40px) translateZ(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateZ(0);
  }
`;

const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px) translateZ(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) translateZ(0);
  }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

export function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reduce delay for faster LCP
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);
  return (
    <LayoutWeb>
      {/* Hero Section with Gradient Background */}
      <Box className="hero-section" sx={{
        pt: { xs: 3, sm: 4, md: 6, lg: 8 },
        pb: { xs: 6, sm: 8, lg: 10 },
        mb: { xs: 6, md: 8 },
        // Render immediately for better LCP
        opacity: 1,
        animation: 'none'
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'center',
          gap: { xs: 4, sm: 6, md: 8 },
          maxWidth: '1400px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 6, xl: 8 }
        }}>
          {/* Left Content */}
          <Box sx={{
            flex: 1,
            textAlign: { xs: 'center', lg: 'left' },
            maxWidth: { xs: '100%', lg: '40%' },
            pr: { lg: 4 },
            order: { xs: 1, lg: 1 },
            opacity: 0,
            transform: 'translateX(-40px)',
            animation: isLoaded ? `${slideInLeft} 1.2s ease-out 0.5s both` : 'none',
            willChange: 'transform, opacity'
          }}>
            <h1 className="lcp-heading">
              EZ
            </h1>
            <Typography
              variant="h5"
              component="p"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.6,
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                mb: { xs: 3, md: 4 },
                maxWidth: { xs: '100%', sm: '90%', lg: '100%' },
                mx: { xs: 'auto', lg: 0 },
                opacity: 0,
                animation: isLoaded ? `${fadeIn} 1s ease-out 0.8s both` : 'none',
                willChange: 'opacity'
              }}
            >
              The complete CRM solution for music creatives. Manage your studio sessions, track client relationships, handle bookings and payments, and streamline your music
              production business all in one place.
            </Typography>
            <Box sx={{
              opacity: 0,
              transform: 'translateY(30px)',
              animation: isLoaded ? `${fadeInUp} 1s ease-out 1.1s both` : 'none',
              willChange: 'transform, opacity'
            }}>
              <AnimatedButton
                text="Get Started For Free"
                buttonVariant="landing"
                size="large"
                onClick={() => navigate('/creative?auth=1')}
              />
            </Box>
          </Box>

          {/* Right Video */}
          <Box sx={{
            flex: 1,
            maxWidth: { xs: '100%', lg: '60%' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: { xs: 0, md: 4, lg: 4 },
            order: { xs: 2, lg: 2 },
            opacity: 0,
            transform: 'translateX(40px)',
            animation: isLoaded ? `${slideInRight} 1.2s ease-out 0.7s both` : 'none',
            willChange: 'transform, opacity'
          }}>
            <Box sx={{
              width: { xs: '320px', sm: '480px', md: '720px', lg: '700px' },
              height: { xs: '180px', sm: '270px', md: '405px', lg: '394px' }, // 16:9 aspect ratio maintained
              mx: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: { xs: 2, md: 3 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px dashed rgba(255, 255, 255, 0.9)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: { xs: '320px', sm: '480px' },
              minHeight: { xs: '180px', sm: '270px' },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderColor: 'rgba(255, 255, 255, 1)',
                transform: { xs: 'scale(1.01)', md: 'scale(1.02)' }
              }
            }}>
              {/* Play Button */}
              <Box sx={{
                position: 'absolute',
                width: { xs: 60, sm: 70, md: 80 },
                height: { xs: 60, sm: 70, md: 80 },
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: { xs: 'scale(1.05)', md: 'scale(1.1)' }
                }
              }}>
                <Box sx={{
                  width: 0,
                  height: 0,
                  borderLeft: { xs: '15px solid #1976d2', sm: '18px solid #1976d2', md: '20px solid #1976d2' },
                  borderTop: { xs: '9px solid transparent', sm: '11px solid transparent', md: '12px solid transparent' },
                  borderBottom: { xs: '9px solid transparent', sm: '11px solid transparent', md: '12px solid transparent' },
                  ml: { xs: 0.5, md: 1 }
                }} />
              </Box>
              <Typography
                variant="h6"
                color="white"
                sx={{ 
                  textAlign: 'center',
                  position: 'absolute',
                  bottom: { xs: 12, md: 20 },
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  px: 2
                }}
              >
                Demo Video
                <br />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}
                >
                  Click to watch EZ in action
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'column', md: 'row' },
        gap: { xs: 4, sm: 3, md: 4, lg: 6 },
        px: { xs: 2, sm: 3, md: 8, lg: 12, xl: 16 },
        width: '100%',
        opacity: 0,
        animation: isLoaded ? `${fadeIn} 0.8s ease-out 1.2s both` : 'none',
        willChange: 'opacity'
      }}>
        <Box sx={{ 
          width: { xs: '100%', sm: '100%', md: 'calc(33.333% - 32px)' },
          opacity: 0,
          transform: 'translateY(30px)',
          animation: isLoaded ? `${fadeInUp} 1s ease-out 1.5s both` : 'none',
          willChange: 'transform, opacity'
        }}>
          <Card sx={{
            height: '100%',
            textAlign: 'left',
            p: { xs: 2, sm: 2.5, md: 3 },
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            borderRadius: { xs: 2, md: 3 },
            '&:hover': {
              transform: { xs: 'translateY(-2px)', md: 'translateY(-4px)' },
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{
                width: { xs: 56, md: 64 },
                height: { xs: 56, md: 64 },
                borderRadius: { xs: '10px', md: '12px' },
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 'auto',
                mb: { xs: 2, md: 3 },
              }}>
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  style={{ 
                    color: '#FFFFFF',
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)'
                  }}
                />
              </Box>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  mb: { xs: 1.5, md: 2 }, 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Studio Session Management
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}
              >
                Schedule recording sessions, mixing appointments, and beat consultations with
                seamless calendar integration.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ 
          width: { xs: '100%', sm: '100%', md: 'calc(33.333% - 32px)' },
          opacity: 0,
          transform: 'translateY(30px)',
          animation: isLoaded ? `${fadeInUp} 1s ease-out 1.8s both` : 'none',
          willChange: 'transform, opacity'
        }}>
          <Card sx={{
            height: '100%',
            textAlign: 'left',
            p: { xs: 2, sm: 2.5, md: 3 },
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            borderRadius: { xs: 2, md: 3 },
            '&:hover': {
              transform: { xs: 'translateY(-2px)', md: 'translateY(-4px)' },
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{
                width: { xs: 56, md: 64 },
                height: { xs: 56, md: 64 },
                borderRadius: { xs: '10px', md: '12px' },
                backgroundColor: 'secondary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 'auto',
                mb: { xs: 2, md: 3 }
              }}>
                <FontAwesomeIcon
                  icon={faDollarSign}
                  style={{ 
                    color: '#FFFFFF',
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)'
                  }}
                />
              </Box>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  mb: { xs: 1.5, md: 2 }, 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Secure Payments
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}
              >
                Built-in payment processing with transparent fees and instant transfers.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ 
          width: { xs: '100%', sm: '100%', md: 'calc(33.333% - 32px)' },
          opacity: 0,
          transform: 'translateY(30px)',
          animation: isLoaded ? `${fadeInUp} 1s ease-out 2.1s both` : 'none',
          willChange: 'transform, opacity'
        }}>
          <Card sx={{
            height: '100%',
            textAlign: 'left',
            p: { xs: 2, sm: 2.5, md: 3 },
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            borderRadius: { xs: 2, md: 3 },
            '&:hover': {
              transform: { xs: 'translateY(-2px)', md: 'translateY(-4px)' },
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{
                width: { xs: 56, md: 64 },
                height: { xs: 56, md: 64 },
                borderRadius: { xs: '10px', md: '12px' },
                backgroundColor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 'auto',
                mb: { xs: 2, md: 3 }
              }}>
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  style={{ 
                    color: '#FFFFFF',
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)'
                  }}
                />
              </Box>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  mb: { xs: 1.5, md: 2 }, 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Client & Project Tracking
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}
              >
                Manage artist relationships, track project progress, and organize your music production
                workflow.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </LayoutWeb>
  );
}
