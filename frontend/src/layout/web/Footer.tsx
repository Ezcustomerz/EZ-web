import { useNavigate } from 'react-router-dom';
import { Box, Typography, Link, IconButton, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { AnimatedButton } from '../../components/buttons/MusicButton';
import { useRoleRedirect } from '../../utils/roleRedirect';

export function Footer() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { getRedirectUrl } = useRoleRedirect();

  const pages = [
    { name: 'Pricing', href: '/pricing' },
    { name: 'Creative Features', href: '/creative-features' },
    { name: 'Client Features', href: '/client-features' },
    { name: 'Affiliate Details', href: '/affiliate' }
  ];

  const legal = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact Us', href: '/contact' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.primary.main,
        borderTop: `1px solid ${theme.palette.primary.main}`,
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 3, md: 10, lg: 14, xl: 18 },
        mt: 'auto'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: { xs: 'center', md: 'space-between' },
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: { xs: 4, sm: 6, md: 8, lg: 10 },
          width: '100%'
        }}>
          {/* Brand Section */}
          <Box sx={{ 
            flex: { xs: 'none', md: '0 0 auto' },
            textAlign: { xs: 'center', md: 'left' }
          }}>
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                mb: { xs: 2, md: 3 }
              }}
            >
              EZ
            </Typography>
            <AnimatedButton
              text="Join Now"
              buttonVariant="landing"
              size="medium"
              borderColor={theme.palette.secondary.main}
              onClick={() => navigate(getRedirectUrl())}
            />
          </Box>

          {/* Right Section - Pages and Legal */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 4, sm: 8, md: 12 },
            textAlign: { xs: 'center', md: 'left' }
          }}>
            {/* Pages Section */}
            <Box>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'white'
                }}
              >
                Pages
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {pages.map((page) => (
                  <Box component="li" key={page.name} sx={{ mb: 1.5 }}>
                    <Link
                      href={page.href}
                      sx={{
                        color: theme.palette.grey[300],
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        '&:hover': {
                          color: 'white',
                          textDecoration: 'underline'
                        },
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {page.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Legal Section */}
            <Box>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'white'
                }}
              >
                Legal
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {legal.map((item) => (
                  <Box component="li" key={item.name} sx={{ mb: 1.5 }}>
                    <Link
                      href={item.href}
                      sx={{
                        color: theme.palette.grey[300],
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        '&:hover': {
                          color: 'white',
                          textDecoration: 'underline'
                        },
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {item.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom Section */}
        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: { xs: 3, sm: 6, md: 8, lg: 10 },
            width: '100%'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center'
              }}
            >
              © {new Date().getFullYear()} EZcustomers. All rights reserved.
            </Typography>
            <IconButton
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  borderColor: 'white',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <FontAwesomeIcon icon={faInstagram} size="sm" />
            </IconButton>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center'
            }}
          >
            Made for music creatives, by music creatives.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
} 