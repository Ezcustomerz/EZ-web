import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { ArrowBack, Home } from '@mui/icons-material';
import { useAuth } from '../context/auth';
import { useRoleRedirect } from '../utils/roleRedirect';

export function NoAccess() {
  const navigate = useNavigate();
  const { userProfile, isAuthenticated } = useAuth();
  const { getRedirectUrl } = useRoleRedirect();

  const handleGoToDashboard = () => {
    if (isAuthenticated && userProfile) {
      // Redirect to user's appropriate role dashboard
      const redirectUrl = getRedirectUrl();
      navigate(redirectUrl, { replace: true });
    } else {
      // Not logged in, go to landing page
      navigate('/', { replace: true });
    }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h2" color="error.main">
            🚫
          </Typography>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          You don't have permission to access this page. This area is restricted to users with the appropriate role.
        </Typography>

        {isAuthenticated && userProfile ? (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={handleGoToDashboard}
              size="large"
            >
              Go to My Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoHome}
              size="large"
            >
              Back to Home
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={handleGoHome}
            size="large"
          >
            Go to Home
          </Button>
        )}
      </Box>
    </Container>
  );
}
