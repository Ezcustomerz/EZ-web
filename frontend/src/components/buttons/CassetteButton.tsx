import { useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

interface InviteClientButtonProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export function InviteClientButton({ onClick, isOpen = true }: InviteClientButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (!isOpen) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 1 }}>
        <Tooltip title="Invite a new client to collaborate" arrow>
          <IconButton
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              width: 40,
              height: 40,
              backgroundColor: 'primary.main',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.primary.dark || '#6B4FE0',
                boxShadow: (theme) => `0 0 12px ${theme.palette.custom.amber}99`,
                transform: 'translateY(-2px) rotate(2deg)',
              },
            }}
          >
            <PersonAddIcon 
              sx={{ 
                fontSize: '20px',
                transform: isHovered ? 'rotate(10deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                transition: 'transform 0.3s ease-in-out',
              }} 
            />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Tooltip title="Invite a new client to collaborate" arrow>
        <Box
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            position: 'relative',
            width: '100%',
            height: 72,
            backgroundColor: 'primary.main',
            borderRadius: 1.5,
            border: '2px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            background: (theme) => `linear-gradient(145deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || '#6B4FE0'} 100%)`,
            '&:hover': {
              transform: 'translateY(-2px) rotate(1deg)',
              boxShadow: (theme) => `0 0 20px ${theme.palette.custom.amber}99, 0 8px 25px rgba(0, 0, 0, 0.3)`,
              animation: 'glow-pulse 2s ease-in-out infinite',
            },
            '@keyframes glow-pulse': {
              '0%, 100%': (theme) => ({ boxShadow: `0 0 20px ${theme.palette.custom.amber}99, 0 8px 25px rgba(0, 0, 0, 0.3)` }),
              '50%': (theme) => ({ boxShadow: `0 0 30px ${theme.palette.custom.amber}CC, 0 8px 25px rgba(0, 0, 0, 0.4)` }),
            },
          }}
        >
        {/* Cassette Color Stripes */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            height: 18,
            background: (theme) => `linear-gradient(90deg, ${theme.palette.custom.amber} 0%, #FFD700 50%, ${theme.palette.custom.amber} 100%)`,
            borderRadius: 1,
            zIndex: 1,
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        />

        {/* Left Cassette Reel */}
        <Box
          sx={{
            position: 'absolute',
            left: 12,
            top: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease-in-out',
            animation: isHovered ? 'spin 1.5s linear infinite' : 'none',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.6)',
            zIndex: 3,
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 8,
              height: 8,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 20,
              height: 20,
              border: (theme) => `2px solid ${theme.palette.primary.main}`,
              borderRadius: '50%',
            },
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          }}
        />

        {/* Right Cassette Reel */}
        <Box
          sx={{
            position: 'absolute',
            right: 12,
            top: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease-in-out',
            animation: isHovered ? 'spin 1.5s linear infinite reverse' : 'none',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.6)',
            zIndex: 3,
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 8,
              height: 8,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 20,
              height: 20,
              border: (theme) => `2px solid ${theme.palette.primary.main}`,
              borderRadius: '50%',
            },
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          }}
        />

        {/* Cassette Tape Window/Mechanism */}
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            left: 54,
            right: 54,
            height: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 1,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 6,
              left: 4,
              right: 4,
              height: 8,
              background: 'linear-gradient(90deg, #339BFF 0%, #339BFF 50%, #339BFF 100%)',
              borderRadius: 0.5,
              opacity: 0.9,
            },
          }}
        />

        {/* Label Area */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 6,
            left: 54,
            right: 54,
            height: 22,
            backgroundColor: 'white',
            borderRadius: 0.5,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            zIndex: 4,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <PersonAddIcon
            sx={{
              fontSize: '14px',
              color: 'primary.main',
              transform: isHovered ? 'rotate(10deg) scale(1.1)' : 'rotate(0deg) scale(1)',
              transition: 'transform 0.3s ease-in-out',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Invite Client
          </Typography>
        </Box>

        {/* Corner Screws */}
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: 6,
            height: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            zIndex: 5,
            boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 2,
              height: 2,
              backgroundColor: 'black',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 6,
            height: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            zIndex: 5,
            boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 2,
              height: 2,
              backgroundColor: 'black',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 6,
            left: 6,
            width: 6,
            height: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            zIndex: 5,
            boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 2,
              height: 2,
              backgroundColor: 'black',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            width: 6,
            height: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            zIndex: 5,
            boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 2,
              height: 2,
              backgroundColor: 'black',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
            },
          }}
        />

                </Box>
      </Tooltip>
    </Box>
  );
} 