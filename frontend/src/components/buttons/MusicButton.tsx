import { Button, styled, keyframes } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import type { Theme } from '@mui/material/styles';

// Animation keyframes for music notes
const floatNote1 = keyframes`
  0% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.9;
  }
  25% {
    transform: translateY(-8px) translateX(4px) rotate(10deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-4px) translateX(-2px) rotate(-5deg);
    opacity: 0.95;
  }
  75% {
    transform: translateY(-10px) translateX(6px) rotate(15deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.9;
  }
`;

const floatNote2 = keyframes`
  0% {
    transform: translateY(-2px) translateX(2px) rotate(5deg);
    opacity: 0.85;
  }
  25% {
    transform: translateY(-12px) translateX(-4px) rotate(-10deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-6px) translateX(8px) rotate(20deg);
    opacity: 1;
  }
  75% {
    transform: translateY(-8px) translateX(-6px) rotate(-15deg);
    opacity: 0.95;
  }
  100% {
    transform: translateY(-2px) translateX(2px) rotate(5deg);
    opacity: 0.85;
  }
`;

const floatNote3 = keyframes`
  0% {
    transform: translateY(-4px) translateX(-3px) rotate(-8deg);
    opacity: 0.8;
  }
  25% {
    transform: translateY(-6px) translateX(5px) rotate(12deg);
    opacity: 0.95;
  }
  50% {
    transform: translateY(-14px) translateX(-1px) rotate(-3deg);
    opacity: 1;
  }
  75% {
    transform: translateY(-2px) translateX(7px) rotate(18deg);
    opacity: 0.9;
  }
  100% {
    transform: translateY(-4px) translateX(-3px) rotate(-8deg);
    opacity: 0.8;
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

const MusicNote = styled('span')<{ noteIndex: number; variant: 'header' | 'landing' }>(({ noteIndex, variant, theme }) => ({
  position: 'absolute',
  fontSize: variant === 'header' ? 'clamp(11px, 2vw, 14px)' : 'clamp(14px, 2.5vw, 18px)',
  color: variant === 'header' ? 'rgba(255,255,255,0.9)' : 'rgba(26, 143, 255, 0.95)',
  pointerEvents: 'none',
  userSelect: 'none',
  fontWeight: 'bold',
  willChange: 'transform, opacity',
  textShadow: variant === 'landing' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
  [theme.breakpoints.down('sm')]: {
    fontSize: variant === 'header' ? '11px' : '14px',
  },
  ...(noteIndex === 0 && {
    top: '50%',
    left: variant === 'header' ? '70%' : '15%',
    animation: `${floatNote1} 6s infinite ease-in-out`,
  }),
  ...(noteIndex === 1 && {
    top: '30%',
    left: variant === 'header' ? '20%' : '25%',
    animation: `${bounceNote1} 7s infinite ease-in-out`,
  }),
  ...(noteIndex === 2 && {
    top: '70%',
    left: variant === 'header' ? '60%' : '75%',
    animation: `${floatNote3} 8s infinite ease-in-out`,
  }),
  ...(noteIndex === 3 && {
    top: '60%',
    left: variant === 'header' ? '80%' : '85%',
    animation: `${floatNote1} 9s infinite ease-in-out`,
  }),
  ...(noteIndex === 4 && {
    top: '40%',
    left: variant === 'header' ? '50%' : '65%',
    animation: `${bounceNote2} 10s infinite ease-in-out`,
  }),
  ...(noteIndex === 5 && {
    top: variant === 'header' ? '20%' : '80%',
    left: variant === 'header' ? '40%' : '35%',
    animation: `${floatNote1} 12s infinite ease-in-out`,
  }),
  ...(noteIndex === 6 && {
    top: '80%',
    left: '30%',
    animation: `${floatNote2} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 7 && {
    top: '10%',
    left: '70%',
    animation: `${floatNote3} 13s infinite ease-in-out`,
  }),
  ...(noteIndex === 8 && {
    top: '10%',
    left: '70%',
    animation: `${bounceNote1} 9s infinite ease-in-out`,
  }),
  ...(noteIndex === 9 && {
    top: '10%',
    left: '10%',
    animation: `${floatNote2} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 10 && {
    top: '10%',
    left: '10%',
    animation: `${bounceNote2} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 11 && {
    top: '30%',
    left: '10%',
    animation: `${bounceNote1} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 12 && {
    top: '50%',
    left: '50%',
    animation: `${bounceNote1} 11s infinite ease-in-out`,
  }),
  ...(noteIndex === 13 && {
    top: '20%',
    left: '90%',
    animation: `${bounceNote2} 11s infinite ease-in-out`,
  }),
}));

const StyledAnimatedButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'buttonVariant' && prop !== 'borderColor',
})<{ buttonVariant: 'header' | 'landing'; borderColor?: string }>(({ theme, buttonVariant, borderColor }: { theme: Theme; buttonVariant: 'header' | 'landing'; borderColor?: string }) => ({
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 'clamp(6px, 1vw, 8px)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform, box-shadow',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: buttonVariant === 'header' 
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(26, 143, 255, 0.3), transparent)',
    animation: `${shimmerAnimation} 6s infinite ease-out`,
  },
  '&:hover::before': {
    animation: 'none',
    left: '100%',
    transition: 'left 0.6s ease',
  },
  '&:active': {
    transform: 'translateY(0) scale(1.02)',
  },
  // Header variant styles
  ...(buttonVariant === 'header' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontSize: 'clamp(13px, 1.8vw, 16px)',
    padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 2.5vw, 24px)',
    minHeight: 'clamp(36px, 5vw, 44px)',
    border: `2px solid ${theme.palette.background.default}`,
    boxShadow: `0 4px 15px rgba(26, 143, 255, 0.3)`,
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('xl')]: {
      fontSize: '15px',
      padding: '10px 20px',
      minHeight: '42px',
    },
    [theme.breakpoints.down('lg')]: {
      fontSize: '14px',
      padding: '9px 18px',
      minHeight: '40px',
    },
    [theme.breakpoints.down('md')]: {
      fontSize: '13px',
      padding: '8px 16px',
      minHeight: '38px',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '12px',
      padding: '7px 14px',
      minHeight: '36px',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '0',
      height: '2px',
      bottom: 'clamp(6px, 1vw, 8px)',
      left: '50%',
      backgroundColor: '#FFFFFF',
      transition: 'all 0.3s ease',
      transform: 'translateX(-50%)',
      zIndex: 1,
    },
    '&:hover': {
      backgroundColor: theme.palette.custom.amber,
      border: `2px solid ${theme.palette.primary.main}`,
      color: theme.palette.primary.main,
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: `0 6px 20px rgba(26, 143, 255, 0.4)`,
      '& .music-note': {
        color: `${theme.palette.primary.main} !important`,
        opacity: '1 !important',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      },
    },
    '&:hover::after': {
      width: '80%',
    },
  }),
  // Landing variant styles
  ...(buttonVariant === 'landing' && {
    backgroundColor: 'white',
    color: borderColor || theme.palette.primary.main,
    fontSize: 'clamp(16px, 2.2vw, 18px)',
    padding: 'clamp(12px, 2vw, 14px) clamp(24px, 4vw, 36px)',
    minWidth: 'clamp(160px, 22vw, 180px)',
    border: `2px solid ${borderColor || theme.palette.primary.main}`,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('xl')]: {
      fontSize: '17px',
      padding: '13px 32px',
      minWidth: '170px',
    },
    [theme.breakpoints.down('lg')]: {
      fontSize: '16px',
      padding: '12px 28px',
      minWidth: '160px',
    },
    [theme.breakpoints.down('md')]: {
      fontSize: '15px',
      padding: '11px 24px',
      minWidth: '150px',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '14px',
      padding: '10px 20px',
      minWidth: '140px',
    },
    '&:hover': {
      backgroundColor: theme.palette.custom.amber,
      border: `2px solid ${borderColor || theme.palette.primary.main}`,
      color: borderColor || theme.palette.primary.main,
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
      '& .music-note': {
        color: `${borderColor || theme.palette.primary.main} !important`,
        opacity: '1 !important',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      },
    },
  }),
}));

interface AnimatedButtonProps extends ButtonProps {
  text: string;
  buttonVariant: 'header' | 'landing';
  noteCount?: number;
  borderColor?: string;
}

export function AnimatedButton({ 
  text, 
  buttonVariant, 
  noteCount = buttonVariant === 'header' ? 14 : 12,
  borderColor,
  ...props 
}: AnimatedButtonProps) {
  const musicNotes = ['♪', '♫', '♪', '♬', '♩', '♫', '♪', '♬', '♪', '♫', '♪', '♬', '♪', '♫'];
  
  return (
    <StyledAnimatedButton buttonVariant={buttonVariant} borderColor={borderColor} variant="contained" {...props}>
      {text}
      {Array.from({ length: noteCount }, (_, index) => (
        <MusicNote 
          key={index + 1}
          className="music-note" 
          noteIndex={index + 1}
          variant={buttonVariant}
        >
          {musicNotes[index]}
        </MusicNote>
      ))}
    </StyledAnimatedButton>
  );
} 