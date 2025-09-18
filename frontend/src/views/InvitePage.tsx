import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Login,
  PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../context/auth';
import { inviteService, type ValidateInviteResponse } from '../api/inviteService';

export function InvitePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();
  const { session, userProfile, openAuth, fetchUserProfile } = useAuth();
  
  const [validationData, setValidationData] = useState<ValidateInviteResponse | null>(null);
  const [userFromValidation, setUserFromValidation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Ensure user profile is loaded when component mounts
  useEffect(() => {
    if (session && !userProfile) {
      console.log('[InvitePage] Session exists but no userProfile, fetching...');
      fetchUserProfile();
    }
  }, [session, userProfile, fetchUserProfile]);

  useEffect(() => {
    if (inviteToken) {
      validateInvite();
    } else {
      setError('Invalid invite link');
      setLoading(false);
    }
  }, [inviteToken]);

  const validateInvite = async () => {
    if (!inviteToken) return;
    
    setLoading(true);
    try {
      const response = await inviteService.validateInviteToken(inviteToken);
      setValidationData(response);
      
      // Store user info from validation response
      if (response.user) {
        setUserFromValidation(response.user);
        console.log('[InvitePage] User info from validation:', response.user);
      }
      
      if (!response.success || !response.valid) {
        setError(response.message || 'Invalid invite link');
      }
    } catch (err) {
      setError('Failed to validate invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Store invite token in localStorage to survive OAuth redirects
    if (inviteToken) {
      localStorage.setItem('pendingInviteToken', inviteToken);
      localStorage.setItem('invitePreSelectClient', 'true');
    }
    openAuth();
  };

  const handleAcceptInvite = () => {
    // Store invite token and open auth - let the auth flow handle everything
    if (inviteToken) {
      localStorage.setItem('pendingInviteToken', inviteToken);
      localStorage.setItem('invitePreSelectClient', 'true');
    }
    openAuth();
  };


  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
              Validating invite...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !validationData?.valid) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Card sx={{ width: '100%', textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Invalid Invite
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error || 'This invite link is invalid or has expired.'}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                size="large"
              >
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  const creative = validationData.creative;

  // Debug logging
  console.log('[InvitePage] Render state:', {
    session: !!session,
    userProfile: userProfile ? {
      user_id: userProfile.user_id,
      roles: userProfile.roles,
      hasClientRole: userProfile.roles?.includes('client')
    } : null,
    userFromValidation: userFromValidation,
    validationData: validationData ? {
      valid: validationData.valid,
      creative: validationData.creative ? {
        display_name: validationData.creative.display_name
      } : null
    } : null,
    loading: loading
  });

  // Show loading if we have a session but no userProfile yet
  if (session && !userProfile && !loading) {
    console.log('[InvitePage] Session exists but no userProfile, showing loading...');
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
              Loading your profile...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: 'white',
            p: 4,
            textAlign: 'center'
          }}
        >
          <PersonAdd sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            You're Invited!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Join EZ and connect with creative professionals
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Creative Info */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {creative?.display_name?.charAt(0) || 'C'}
            </Avatar>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {creative?.display_name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {creative?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              wants to connect with you on EZ
            </Typography>
          </Box>

          {/* Action Buttons */}
          {userFromValidation?.has_client_role ? (
            // User has account with client role - show accept button
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                <CheckCircle sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
                {session ? "You're signed in and ready to connect!" : "You have an account with client access - ready to connect!"}
              </Alert>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAcceptInvite}
                startIcon={<CheckCircle />}
                sx={{ 
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                {session ? 'Accept Invite' : 'Sign In & Accept Invite'}
              </Button>
            </Box>
          ) : session && !userProfile ? (
            // Authenticated but profile still loading
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Loading your profile...
              </Typography>
            </Box>
          ) : (userProfile?.roles?.includes('client')) ? (
            // Authenticated with client role - show accept button
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                <CheckCircle sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
                You're signed in and ready to connect!
              </Alert>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAcceptInvite}
                startIcon={<CheckCircle />}
                sx={{ 
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                Accept Invite
              </Button>
            </Box>
          ) : (
            // No account or no client role - show sign up button
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                You'll need to create an account to accept this invitation. Don't worry - it's quick and free!
              </Alert>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSignUp}
                startIcon={<Login />}
                sx={{ 
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Sign Up & Accept Invite
              </Button>
              <Typography variant="body2" color="text.secondary">
                Already have an account? Sign in to accept the invite.
              </Typography>
            </Box>
          )}

          {/* Benefits */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ textAlign: 'center' }}>
              What you'll get:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                • Direct access to {creative?.display_name}'s services
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Easy booking and project management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Secure payments and file sharing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Real-time collaboration tools
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
