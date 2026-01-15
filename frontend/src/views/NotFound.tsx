import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home, SentimentDissatisfied } from '@mui/icons-material';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.5) 0%, transparent 50%)',
        }}
      />

      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* 404 with icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '10rem' },
                fontWeight: 800,
                color: 'white',
                lineHeight: 1,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              4
            </Typography>
            <SentimentDissatisfied
              sx={{
                fontSize: { xs: '6rem', md: '10rem' },
                color: 'white',
                mx: 2,
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))',
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '10rem' },
                fontWeight: 800,
                color: 'white',
                lineHeight: 1,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              4
            </Typography>
          </Box>

          {/* Error message */}
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: 2,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            PAGE NOT FOUND
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 400,
              mb: 5,
              maxWidth: 600,
              mx: 'auto',
              textShadow: '0 1px 5px rgba(0,0,0,0.2)',
            }}
          >
            Oops! The page you're looking for doesn't exist or has been moved.
          </Typography>

          {/* Go back home button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: 'white',
              color: '#667eea',
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 5,
              py: 2,
              borderRadius: 3,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.95)',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              },
            }}
          >
            GO BACK TO HOME
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
