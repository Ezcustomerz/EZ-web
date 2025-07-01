import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  styled,
  keyframes,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecordVinyl, faChevronDown, faMusic } from '@fortawesome/free-solid-svg-icons';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,    
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  margin: 0,
  top: 0,
  left: 0,
  right: 0,
}));

const NavButton = styled(Button)(() => ({
  color: '#FFFFFF',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  padding: '12px 20px',
  position: 'relative',
  minHeight: '44px',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '0',
    height: '2px',
    bottom: '8px',
    left: '50%',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  '&:hover::after': {
    width: '80%',
  },
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const FeaturesNavButton = styled(Button)<{ isMenuOpen?: boolean }>(({ isMenuOpen }) => ({
  color: '#FFFFFF',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  padding: '12px 20px',
  position: 'relative',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: isMenuOpen ? '80%' : '0',
    height: '2px',
    bottom: '8px',
    left: '50%',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  '&:hover::after': {
    width: '80%',
  },
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const floatNote1 = keyframes`
  0% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.7;
  }
  25% {
    transform: translateY(-8px) translateX(4px) rotate(10deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-4px) translateX(-2px) rotate(-5deg);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-10px) translateX(6px) rotate(15deg);
    opacity: 0.9;
  }
  100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.7;
  }
`;

const floatNote2 = keyframes`
  0% {
    transform: translateY(-2px) translateX(2px) rotate(5deg);
    opacity: 0.6;
  }
  25% {
    transform: translateY(-12px) translateX(-4px) rotate(-10deg);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-6px) translateX(8px) rotate(20deg);
    opacity: 1;
  }
  75% {
    transform: translateY(-8px) translateX(-6px) rotate(-15deg);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-2px) translateX(2px) rotate(5deg);
    opacity: 0.6;
  }
`;

const floatNote3 = keyframes`
  0% {
    transform: translateY(-4px) translateX(-3px) rotate(-8deg);
    opacity: 0.5;
  }
  25% {
    transform: translateY(-6px) translateX(5px) rotate(12deg);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-14px) translateX(-1px) rotate(-3deg);
    opacity: 1;
  }
  75% {
    transform: translateY(-2px) translateX(7px) rotate(18deg);
    opacity: 0.7;
  }
  100% {
    transform: translateY(-4px) translateX(-3px) rotate(-8deg);
    opacity: 0.5;
  }
`;

const bounceNote1 = keyframes`
  0% {
    transform: translateY(0px) translateX(-60px) rotate(0deg) scale(1);
    opacity: 0;
  }
  8% {
    opacity: 0.7;
  }
  15% {
    transform: translateY(-35px) translateX(-20px) rotate(45deg) scale(1.2);
    opacity: 1;
  }
  25% {
    transform: translateY(-45px) translateX(70px) rotate(120deg) scale(0.8);
    opacity: 1;
  }
  35% {
    transform: translateY(0px) translateX(80px) rotate(180deg) scale(1.3);
    opacity: 0.9;
  }
  50% {
    transform: translateY(25px) translateX(50px) rotate(240deg) scale(0.7);
    opacity: 0.8;
  }
  60% {
    opacity: 0;
  }
  65% {
    transform: translateY(30px) translateX(-10px) rotate(300deg) scale(1.1);
    opacity: 0;
  }
  75% {
    transform: translateY(-25px) translateX(-70px) rotate(360deg) scale(0.9);
    opacity: 0;
  }
  85% {
    opacity: 0.9;
  }
  95% {
    transform: translateY(-10px) translateX(-50px) rotate(420deg) scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: translateY(0px) translateX(-60px) rotate(480deg) scale(1);
    opacity: 0;
  }
`;

const bounceNote2 = keyframes`
  0% {
    transform: translateY(-15px) translateX(75px) rotate(0deg) scale(0.8);
    opacity: 0;
  }
  12% {
    opacity: 0.6;
  }
  18% {
    transform: translateY(35px) translateX(40px) rotate(-90deg) scale(1.4);
    opacity: 0.9;
  }
  28% {
    transform: translateY(45px) translateX(-20px) rotate(-180deg) scale(0.6);
    opacity: 1;
  }
  40% {
    transform: translateY(-10px) translateX(-80px) rotate(-270deg) scale(1.5);
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  55% {
    transform: translateY(-40px) translateX(-60px) rotate(-360deg) scale(0.9);
    opacity: 0;
  }
  65% {
    transform: translateY(30px) translateX(-85px) rotate(-450deg) scale(1.2);
    opacity: 0;
  }
  75% {
    opacity: 0.8;
  }
  80% {
    transform: translateY(-35px) translateX(-15px) rotate(-540deg) scale(0.7);
    opacity: 0.9;
  }
  90% {
    transform: translateY(10px) translateX(60px) rotate(-630deg) scale(1.3);
    opacity: 0.8;
  }
  95% {
    opacity: 0;
  }
  100% {
    transform: translateY(-15px) translateX(75px) rotate(-720deg) scale(0.8);
    opacity: 0;
  }
`;

const bounceNote3 = keyframes`
  0% {
    transform: translateY(25px) translateX(-55px) rotate(45deg) scale(1.1);
    opacity: 0;
  }
  15% {
    opacity: 0.5;
  }
  22% {
    transform: translateY(-50px) translateX(-30px) rotate(135deg) scale(0.6);
    opacity: 0.8;
  }
  33% {
    transform: translateY(-60px) translateX(65px) rotate(225deg) scale(1.6);
    opacity: 1;
  }
  45% {
    transform: translateY(-20px) translateX(90px) rotate(315deg) scale(0.4);
    opacity: 0.9;
  }
  50% {
    opacity: 0;
  }
  58% {
    transform: translateY(40px) translateX(70px) rotate(405deg) scale(1.3);
    opacity: 0;
  }
  66% {
    transform: translateY(50px) translateX(15px) rotate(495deg) scale(0.8);
    opacity: 0;
  }
  75% {
    opacity: 0.8;
  }
  85% {
    transform: translateY(10px) translateX(-70px) rotate(585deg) scale(1.4);
    opacity: 0.7;
  }
  95% {
    transform: translateY(-15px) translateX(-45px) rotate(675deg) scale(0.9);
    opacity: 0.6;
  }
  100% {
    transform: translateY(25px) translateX(-55px) rotate(765deg) scale(1.1);
    opacity: 0;
  }
`;

const bounceNote4 = keyframes`
  0% {
    transform: translateY(-35px) translateX(20px) rotate(-30deg) scale(0.9);
    opacity: 0;
  }
  20% {
    opacity: 0.4;
  }
  30% {
    transform: translateY(-55px) translateX(-40px) rotate(60deg) scale(1.7);
    opacity: 0.8;
  }
  40% {
    transform: translateY(15px) translateX(-95px) rotate(150deg) scale(0.3);
    opacity: 0.9;
  }
  55% {
    transform: translateY(45px) translateX(-70px) rotate(240deg) scale(1.2);
    opacity: 1;
  }
  60% {
    opacity: 0;
  }
  70% {
    transform: translateY(35px) translateX(30px) rotate(330deg) scale(0.7);
    opacity: 0;
  }
  80% {
    transform: translateY(-25px) translateX(85px) rotate(420deg) scale(1.5);
    opacity: 0;
  }
  88% {
    opacity: 1;
  }
  95% {
    transform: translateY(-45px) translateX(50px) rotate(510deg) scale(0.8);
    opacity: 0.9;
  }
  100% {
    transform: translateY(-35px) translateX(20px) rotate(600deg) scale(0.9);
    opacity: 0;
  }
`;

const bounceNote5 = keyframes`
  0% {
    transform: translateY(18px) translateX(-65px) rotate(60deg) scale(1.3);
    opacity: 0;
  }
  18% {
    opacity: 0.3;
  }
  25% {
    transform: translateY(-40px) translateX(-45px) rotate(150deg) scale(0.5);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-65px) translateX(-15px) rotate(240deg) scale(1.8);
    opacity: 0.8;
  }
  42% {
    transform: translateY(-30px) translateX(70px) rotate(330deg) scale(0.4);
    opacity: 0.9;
  }
  45% {
    opacity: 0;
  }
  55% {
    transform: translateY(25px) translateX(95px) rotate(420deg) scale(1.1);
    opacity: 0;
  }
  60% {
    transform: translateY(55px) translateX(80px) rotate(510deg) scale(0.7);
    opacity: 0;
  }
  70% {
    opacity: 1;
  }
  80% {
    transform: translateY(40px) translateX(25px) rotate(600deg) scale(1.4);
    opacity: 0.9;
  }
  90% {
    transform: translateY(-18px) translateX(-20px) rotate(690deg) scale(0.8);
    opacity: 0.7;
  }
  100% {
    transform: translateY(18px) translateX(-65px) rotate(780deg) scale(1.3);
    opacity: 0;
  }
`;

const shimmerAnimation = keyframes`
  0% {
    left: -100%;
  }
  15% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
`;

const MusicNote = styled('span')<{ noteIndex: number }>(({ noteIndex }) => ({
  position: 'absolute',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.7)',
  pointerEvents: 'none',
  userSelect: 'none',
  fontWeight: 'bold',
  ...(noteIndex === 1 && {
    top: '50%',
    left: '70%',
    animation: `${floatNote1} 6s infinite ease-in-out`,
  }),
  ...(noteIndex === 2 && {
    top: '30%',
    left: '20%',
    animation: `${bounceNote1} 7s infinite ease-in-out`,
  }),
  ...(noteIndex === 3 && {
    top: '70%',
    left: '60%',
    animation: `${floatNote3} 8s infinite ease-in-out`,
  }),
  ...(noteIndex === 4 && {
    top: '60%',
    left: '80%',
    animation: `${floatNote1} 9s infinite ease-in-out`,
  }),
  ...(noteIndex === 5 && {
    top: '40%',
    left: '50%',
    animation: `${bounceNote2} 10s infinite ease-in-out`,
  }),
  ...(noteIndex === 6 && {
    top: '20%',
    left: '40%',
    animation: `${floatNote1} 12s infinite ease-in-out`,
  }),
  ...(noteIndex === 7 && {
    top: '80%',
    left: '30%',
    animation: `${floatNote2} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 8 && {
    top: '10%',
    left: '70%',
    animation: `${floatNote3} 13s infinite ease-in-out`,
  }),
  ...(noteIndex === 9 && {
    top: '10%',
    left: '70%',
    animation: `${bounceNote4} 9s infinite ease-in-out`,
  }),
  ...(noteIndex === 10 && {
    top: '10%',
    left: '10%',
    animation: `${floatNote2} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 11 && {
    top: '10%',
    left: '10%',
    animation: `${bounceNote3} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 12 && {
    top: '30%',
    left: '10%',
    animation: `${bounceNote5} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 13 && {
    top: '50%',
    left: '50%',
    animation: `${bounceNote1} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 14 && {
    top: '20%',
    left: '90%',
    animation: `${bounceNote2} 11s infinite ease-in-out`,
  }),
}));

const DashboardButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 600,
  padding: '12px 28px',
  borderRadius: '8px',
  minHeight: '44px',
  border: '2px solid transparent',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: `0 4px 15px rgba(26, 143, 255, 0.3)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: `${shimmerAnimation} 6s infinite ease-out`,
  },
  '&:hover': {
    backgroundColor: 'transparent',
    border: `2px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: `0 8px 25px rgba(26, 143, 255, 0.5)`,
    '& .music-note': {
      color: theme.palette.primary.main,
    },
  },
  '&:hover::before': {
    animation: 'none',
    left: '100%',
    transition: 'left 0.6s ease',
  },
  '&:active': {
    transform: 'translateY(0) scale(1.02)',
  },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginTop: '12px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: `1px solid ${theme.palette.divider}`,
    minWidth: '240px',
    padding: '12px 0',
    backgroundColor: theme.palette.background.paper,
  },
  '& .MuiMenuItem-root.Mui-selected': {
    backgroundColor: 'transparent',
  },
  '& .MuiMenuItem-root.Mui-focusVisible': {
    backgroundColor: 'transparent',
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 500,
  position: 'relative',
  margin: '2px 12px',
  borderRadius: '6px',
  color: theme.palette.text.primary,
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '0',
    height: '2px',
    bottom: '6px',
    left: '50%',
    backgroundColor: theme.palette.secondary.main,
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  '&:hover': {
    backgroundColor: 'transparent',
  },
  '&:hover::after': {
    width: '60%',
  },
}));

export function Header() {
  const [featuresAnchorEl, setFeaturesAnchorEl] = useState<null | HTMLElement>(null);
  const featuresOpen = Boolean(featuresAnchorEl);

  const handleFeaturesMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    setFeaturesAnchorEl(event.currentTarget);
  };

  const handleFeaturesMouseLeave = () => {
    setFeaturesAnchorEl(null);
  };

  const handleMenuItemClick = (item: string) => {
    console.log(`Clicked: ${item}`);
    setFeaturesAnchorEl(null);
  };

  return (
    <StyledAppBar position="static" elevation={0}>
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        py: 2,
        px: 4,
        minHeight: '70px'
      }}>
        {/* Left side - Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FontAwesomeIcon 
            icon={faRecordVinyl} 
            size="2x" 
            style={{ color: '#FFFFFF' }}
          />
          <Typography 
            variant="h1"
            color="#FFFFFF"
            sx={{
              fontWeight: 500,
              fontSize: '24px'
            }}
          >
            EZ
          </Typography>
        </Box>

        {/* Right side - Navigation Menu + Dashboard Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NavButton onClick={() => console.log('Contact clicked')}>
            Contact
          </NavButton>
          
          <NavButton onClick={() => console.log('Pricing clicked')}>
            Pricing
          </NavButton>
          
          <Box
            onMouseEnter={handleFeaturesMouseEnter}
            onMouseLeave={handleFeaturesMouseLeave}
            sx={{ position: 'relative' }}
          >
            <FeaturesNavButton
              isMenuOpen={featuresOpen}
              aria-controls={featuresOpen ? 'features-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={featuresOpen ? 'true' : undefined}
              onMouseEnter={handleFeaturesMouseEnter}
            >
              Features
              <FontAwesomeIcon 
                icon={faChevronDown} 
                size="sm"
                style={{ 
                  marginLeft: '4px',
                  color: '#FFFFFF'
                }}
              />
            </FeaturesNavButton>
            
            <StyledMenu
              id="features-menu"
              anchorEl={featuresAnchorEl}
              open={featuresOpen}
              onClose={() => setFeaturesAnchorEl(null)}
              disableAutoFocusItem
              MenuListProps={{
                'aria-labelledby': 'features-button',
                onMouseLeave: handleFeaturesMouseLeave,
                disablePadding: false,
              }}
              transformOrigin={{ horizontal: 'center', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
            >
              <StyledMenuItem 
                onClick={() => handleMenuItemClick('Producer Features')}
              >
                Producer Features
              </StyledMenuItem>
              <StyledMenuItem 
                onClick={() => handleMenuItemClick('Client Features')}
              >
                Client Features
              </StyledMenuItem>
              <StyledMenuItem 
                onClick={() => handleMenuItemClick('Advocate Details')}
              >
                Advocate Details
              </StyledMenuItem>
            </StyledMenu>
          </Box>

          <DashboardButton onClick={() => console.log('Dashboard clicked')}>
            Dashboard
            <MusicNote className="music-note" noteIndex={1}>♪</MusicNote>
            <MusicNote className="music-note" noteIndex={2}>♫</MusicNote>
            <MusicNote className="music-note" noteIndex={3}>♪</MusicNote>
            <MusicNote className="music-note" noteIndex={4}>♬</MusicNote>
            <MusicNote className="music-note" noteIndex={5}>♩</MusicNote>
            <MusicNote className="music-note" noteIndex={6}>♫</MusicNote>
            <MusicNote className="music-note" noteIndex={7}>♪</MusicNote>
            <MusicNote className="music-note" noteIndex={8}>♬</MusicNote>
            <MusicNote className="music-note" noteIndex={9}>♪</MusicNote>
            <MusicNote className="music-note" noteIndex={10}>♫</MusicNote>
            <MusicNote className="music-note" noteIndex={11}>♪</MusicNote>
            <MusicNote className="music-note" noteIndex={12}>♬</MusicNote>
            <MusicNote className="music-note" noteIndex={13}>♪</MusicNote>
            <MusicNote className="music-note" noteIndex={14}>♫</MusicNote>
          </DashboardButton>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
}
