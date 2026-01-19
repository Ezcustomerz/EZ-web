import { useState, useEffect } from 'react';
import { Box, Typography, keyframes, useTheme, Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClapperboard } from '@fortawesome/free-solid-svg-icons';
import { LayoutWeb } from '../../layout/web/LayoutWeb';
import { CreativeFeaturesSection } from '../../components/sections/web/CreativeFeaturesSection';

// Animation keyframes
const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
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

const slideInLeft = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-20px) translateZ(0);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateZ(0);
  }
`;

const scaleIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.9) translateZ(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateZ(0);
  }
`;

export function CreativeFeaturesPage() {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LayoutWeb>
      <Box sx={{
        pt: { xs: 8, sm: 10, md: 12 },
        pb: { xs: 6, sm: 8, md: 10 },
        px: { xs: 2, sm: 3, md: 6, lg: 8, xl: 12 },
        minHeight: '100vh',
        maxWidth: '1400px',
        mx: 'auto',
      }}>
        {/* Page Header */}
        <Box sx={{
          textAlign: 'center',
          mb: { xs: 5, md: 7 },
          position: 'relative',
        }}>
          {/* Decorative Background Element */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '200px', md: '300px' },
              height: { xs: '200px', md: '300px' },
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
              filter: 'blur(60px)',
              zIndex: 0,
              opacity: 0,
              animation: isLoaded ? `${fadeIn} 1s ease-out 0.3s both` : 'none',
            }}
          />
          
          {/* Icon Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 64, md: 80 },
              height: { xs: 64, md: 80 },
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              mb: { xs: 2, md: 3 },
              boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
              position: 'relative',
              zIndex: 1,
              opacity: 0,
              transform: 'scale(0.8)',
              animation: isLoaded ? `${scaleIn} 0.6s ease-out 0.1s both` : 'none',
            }}
          >
            <FontAwesomeIcon
              icon={faClapperboard}
              style={{ 
                color: '#FFFFFF',
                fontSize: 'clamp(28px, 3vw, 40px)'
              }}
            />
          </Box>

          {/* Title with Gradient */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem', lg: '4.5rem' },
              mb: { xs: 2, md: 3 },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              position: 'relative',
              zIndex: 1,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              opacity: 0,
              animation: isLoaded ? `${slideInLeft} 0.8s ease-out 0.2s both` : 'none',
            }}
          >
            Creative Features
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h6"
            component="p"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              maxWidth: '900px',
              mx: 'auto',
              lineHeight: 1.7,
              fontWeight: 400,
              position: 'relative',
              zIndex: 1,
              opacity: 0,
              animation: isLoaded ? `${fadeInUp} 1s ease-out 0.4s both` : 'none',
            }}
          >
            Everything you need to manage your business in one powerful platform
          </Typography>

          {/* Decorative Line */}
          <Box
            sx={{
              width: { xs: 60, md: 80 },
              height: 4,
              mx: 'auto',
              mt: { xs: 3, md: 4 },
              borderRadius: 2,
              background: `linear-gradient(90deg, transparent 0%, ${theme.palette.primary.main} 50%, transparent 100%)`,
              position: 'relative',
              zIndex: 1,
              opacity: 0,
              animation: isLoaded ? `${fadeIn} 1s ease-out 0.6s both` : 'none',
            }}
          />
        </Box>

        {/* Features Section */}
        <Box sx={{
          maxWidth: '900px',
          mx: 'auto',
          opacity: 0,
          animation: isLoaded ? `${fadeInUp} 1s ease-out 0.5s both` : 'none',
          willChange: 'transform, opacity'
        }}>
          <CreativeFeaturesSection />
        </Box>
      </Box>
    </LayoutWeb>
  );
}
