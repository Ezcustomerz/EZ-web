import * as React from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Stack,
  Container,
  useTheme,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TwitterIcon from '@mui/icons-material/Twitter';
import PersonIcon from '@mui/icons-material/Person';
import StarOutlineIcon from '@mui/icons-material/StarOutline';

export interface HeroSectionProps {
  avatar?: string;
  username?: string;
  bio?: string;
  title?: string;
  socials?: { icon: React.ReactElement; url: string; label: string }[];
  averageRating?: number;
}

export function HeroSection(props: HeroSectionProps) {
  const theme = useTheme();
  const avatar = props?.avatar || '';
  const username = props?.username || 'Demo User';
  const bio = props?.bio || 'This is a demo description of this user';
  const title = props?.title || 'music producer'; // Default title
  const socials = props?.socials || [
    { icon: <InstagramIcon />, url: '', label: 'Instagram' },
    { icon: <YouTubeIcon />, url: '', label: 'YouTube' },
    { icon: <TwitterIcon />, url: '', label: 'Twitter' },
  ];
  const averageRating = props?.averageRating ?? 4.9;
  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: '#fff',
        position: 'relative',
        py: { xs: 1, sm: 2 },
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Top-right action icons */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 2,
          display: 'flex',
          gap: 1,
        }}
      >
        <Tooltip title="Share" arrow>
          <IconButton size="small" sx={{ color: 'action.active', opacity: 0.7, p: 0.75 }}>
            <ShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Profile" arrow>
          <IconButton size="small" sx={{ color: 'action.active', opacity: 0.7, p: 0.75 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 4 } }}>
        <Avatar
          src={avatar}
          alt={username}
          sx={{
            width: 68,
            height: 68,
            mb: 1.5,
            border: '3px solid #fff',
            boxShadow: 1,
            bgcolor: 'grey.100',
            color: theme.palette.primary.main,
            fontSize: 36,
          }}
        >
          {!avatar && <PersonIcon fontSize="inherit" />}
        </Avatar>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 0.5 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              color: theme.palette.text.primary,
              letterSpacing: 0.25,
              cursor: 'pointer',
              transition: 'color 0.2s',
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            {username}
          </Typography>
          {/* Title under username */}
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              mb: 0.5,
              textTransform: 'capitalize',
              letterSpacing: 0.1,
            }}
          >
            {title}
          </Typography>
          {/* Average reviews (star + rating) above underline */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5, mb: 0.5 }}>
            <StarOutlineIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: 16 }}>
              {averageRating.toFixed(1)}
            </Typography>
          </Box>
          {/* Gradient accent underline, 45% of name width */}
          <Box
            sx={{
              minWidth: 50,
              maxWidth: 150,
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              mb: 0.5,
            }}
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 400,
            mb: 1.2,
            maxWidth: { xs: 340, sm: 500 },
            width: { xs: '100%', sm: '80%' },
            mx: 'auto',
            lineHeight: 1.5,
            textAlign: 'center',
            whiteSpace: 'pre-line',
          }}
        >
          {bio}
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ mt: 0.5 }}>
          {socials.map((s: {icon: React.ReactElement, url: string, label: string}, idx: number) => (
            <IconButton
              key={idx}
              href={s.url}
              target="_blank"
              aria-label={s.label}
              sx={{
                color: theme.palette.text.primary,
                p: 0.5,
                fontSize: 22,
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.1)', color: theme.palette.primary.main },
              }}
              size="small"
            >
              {s.icon}
            </IconButton>
          ))}
        </Stack>
      </Container>
    </Box>
  );
} 