import { Box, IconButton, useTheme, Typography, Button } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ServiceCardSimple } from './ServiceCard';
import { useEffect, useState, useRef } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

export interface ServiceCardRowProps {
  services?: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    delivery: string;
    color: string;
  }>;
}

const DEMO_SERVICES: ServiceCardRowProps['services'] = [
  { id: 'service-1', title: 'Mixing', description: 'Professional mixing for your tracks', price: 200, delivery: '3 days', color: '#F3E8FF' },
  { id: 'service-2', title: 'Mastering', description: 'High-quality mastering for release', price: 150, delivery: '2 days', color: '#E0F2FE' },
  { id: 'service-3', title: 'Vocal Tuning', description: 'Pitch correction and tuning for vocals', price: 100, delivery: '1 day', color: '#FEF9C3' },
  { id: 'service-4', title: 'Full Production', description: 'From songwriting to final mix', price: 1000, delivery: '10 days', color: '#FEE2E2' },
  { id: 'service-5', title: 'Beat Making', description: 'Custom beats for any genre', price: 300, delivery: '4 days', color: '#DCFCE7' },
  { id: 'service-6', title: 'Session Guitar', description: 'Professional guitar tracks for your song', price: 120, delivery: '2 days', color: '#E0E7FF' },
  { id: 'service-7', title: 'Drum Programming', description: 'Realistic drum programming for your track', price: 180, delivery: '3 days', color: '#FFE4E6' },
];

export function ServiceCardRow({ services }: ServiceCardRowProps) {
  const theme = useTheme();
  const data = services ?? DEMO_SERVICES ?? [];
  // Responsive: 4 desktop, 3 laptop, 2 tablet, 1 mobile
  const getCardsPerView = () => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w >= 1280) return 4;
    if (w >= 1024) return 3;
    if (w >= 640) return 2;
    return 1;
  };
  const [cardsPerView, setCardsPerView] = useState(getCardsPerView());
  const [startIdx, setStartIdx] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);
  const [growIdx, setGrowIdx] = useState<number | null>(null);
  const [shouldGrow, setShouldGrow] = useState(false);
  const directionRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    const handleResize = () => setCardsPerView(getCardsPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Clamp startIdx if cardsPerView changes
    if (startIdx > data.length - cardsPerView) {
      setStartIdx(Math.max(0, data.length - cardsPerView));
    }
  }, [cardsPerView, data.length, startIdx]);

  const canScrollLeft = startIdx > 0;
  const canScrollRight = startIdx + cardsPerView < data.length;
  const showArrows = data.length > cardsPerView;

  // Only render visible cards in a grid
  const visibleCards = data.slice(startIdx, startIdx + cardsPerView);

  // Card width for animation (using a ref)
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPixelWidth, setCardPixelWidth] = useState(0);
  useEffect(() => {
    if (cardRef.current) {
      setCardPixelWidth(cardRef.current.offsetWidth + 16); // 16px for gap
    }
  }, [cardsPerView, startIdx]);

  const handleLeft = () => {
    if (canScrollRight && !isSliding) {
      setSlideDirection('left');
      directionRef.current = 'left';
      setIsSliding(true);
      setTimeout(() => {
        setIsSliding(false);
        setPendingIdx(startIdx + 1);
      }, 700);
    }
  };
  const handleRight = () => {
    if (canScrollLeft && !isSliding) {
      setSlideDirection('right');
      directionRef.current = 'right';
      setIsSliding(true);
      setTimeout(() => {
        setIsSliding(false);
        setPendingIdx(startIdx - 1);
      }, 700);
    }
  };

  // After animation, update the index and render only the new visible set
  useEffect(() => {
    if (pendingIdx !== null) {
      const direction = directionRef.current;
      setStartIdx(pendingIdx);
      const idx = direction === 'left' ? cardsPerView - 1 : 0;
      setGrowIdx(idx);
      setShouldGrow(false);
      setTimeout(() => {
        setShouldGrow(true);
        setTimeout(() => {
          setGrowIdx(null);
          setShouldGrow(false);
          setSlideDirection(null);
          directionRef.current = null;
        }, 250);
      }, 10);
      setPendingIdx(null);
    }
  }, [pendingIdx, cardsPerView]);

  // Animation style for the grid
  let gridTransform = 'translateX(0)';
  if (isSliding && slideDirection === 'left') gridTransform = `translateX(-${cardPixelWidth}px)`;
  if (isSliding && slideDirection === 'right') gridTransform = `translateX(${cardPixelWidth}px)`;

  if (data.length === 0) {
    return (
      <Box sx={{ width: '100%', px: { xs: 1, sm: 4 }, pt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 320 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', letterSpacing: 0.2 }}>
          Services and bundles
        </Typography>
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'primary.main' }}>
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: theme => theme.palette.error.light + '22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}>
            <InfoOutlinedIcon sx={{ fontSize: 40, color: 'error.main' }} />
          </Box>
          <Typography variant="h6" color="error.main" sx={{ mb: 1, fontWeight: 700 }}>
            No services or bundles configured
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            You haven’t configured any services or bundles yet.<br />Edit your profile to get started!
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditOutlinedIcon />}
            onClick={() => {console.log('Edit profile clicked')}}
            sx={{
              borderColor: theme.palette.info.main,
              color: theme.palette.info.main,
              fontSize: '0.8rem',
              fontWeight: 500,
              px: 2.5,
              height: '40px',
              borderRadius: 1.5,
              textTransform: 'none',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease-in-out',
              zIndex: 1,
              '@keyframes sparkle': {
                '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
              },
              '@keyframes sparkle2': {
                '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
              },
              '@keyframes sparkle3': {
                '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '20%',
                left: '15%',
                width: 4,
                height: 4,
                background: theme.palette.info.main,
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '70%',
                right: '20%',
                width: 3,
                height: 3,
                background: theme.palette.info.main,
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              },
              '&:hover': {
                borderColor: theme.palette.info.main,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${theme.palette.info.main}20`,
                '&::before': {
                  animation: 'sparkle 0.8s ease-in-out',
                },
                '&::after': {
                  animation: 'sparkle2 0.8s ease-in-out 0.1s',
                },
                '& .spark-element': {
                  '&:nth-of-type(1)': {
                    animation: 'sparkle3 0.8s ease-in-out 0.2s',
                  },
                  '&:nth-of-type(2)': {
                    animation: 'sparkle 0.8s ease-in-out 0.3s',
                  },
                },
              },
            }}
          >
            <Box
              className="spark-element"
              sx={{
                position: 'absolute',
                top: '10%',
                right: '10%',
                width: 2,
                height: 2,
                background: theme.palette.info.main,
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              }}
            />
            <Box
              className="spark-element"
              sx={{
                position: 'absolute',
                bottom: '15%',
                left: '25%',
                width: 2,
                height: 2,
                background: theme.palette.info.main,
                borderRadius: '50%',
                transform: 'scale(0)',
                opacity: 0,
                transition: 'all 0.2s ease-in-out',
              }}
            />
            Edit Profile
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 4 }, pt: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            color: 'primary.main',
            letterSpacing: 0.2,
            textAlign: 'center',
          }}
        >
          Services and bundles
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '100%',
            justifyContent: 'center',
            position: 'relative',
            minHeight: { xs: 160, sm: 200 },
          }}
        >
          {showArrows && (
            <IconButton
              onClick={handleLeft}
              disabled={!canScrollRight || isSliding}
              sx={{
                position: 'static',
                mr: { xs: 0.5, sm: 1.5 },
                width: 32,
                height: 32,
                minWidth: 32,
                minHeight: 32,
                border: '1px solid',
                borderColor: !canScrollRight || isSliding ? '#ccc' : theme.palette.primary.main,
                background: '#fff',
                boxShadow: 'none',
                borderRadius: '50%',
                p: 0,
                display: 'flex',
                transition: 'border-color 180ms ease, transform 180ms cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  borderColor: !canScrollRight || isSliding ? '#ccc' : theme.palette.primary.main,
                  transform: 'scale(1.1)',
                  '& .arrow-icon': {
                    color: !canScrollRight || isSliding ? '#ccc' : theme.palette.primary.main,
                  },
                },
                '&:disabled': {
                  borderColor: '#ccc',
                  background: '#fafaff',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                },
              }}
              aria-label="Scroll left"
            >
              <ArrowBackIosNewIcon className="arrow-icon" sx={{ fontSize: 18, color: !canScrollRight || isSliding ? '#ccc' : '#444', transition: 'color 180ms' }} />
            </IconButton>
          )}
          {/* Card Grid */}
          <Box
            sx={{
              width: '100%',
              overflow: 'hidden',
              flex: 1,
              py: 1,
            }}
            className="hide-scrollbar"
          >
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1.5, sm: 2.5 },
                justifyContent: 'center',
                transform: gridTransform,
                transition: isSliding ? 'transform 700ms cubic-bezier(0.4,0,0.2,1)' : 'none',
              }}
            >
              {visibleCards.map((service, i) => {
                const isGrow = growIdx === i;
                return (
                  <Box
                    key={service.id}
                    ref={i === 0 ? cardRef : undefined}
                    sx={{
                      flex: '0 0 auto',
                      width: { xs: '90%', sm: '45%', md: '30%', lg: '22%' },
                      transition: 'width 0.2s',
                      opacity: isGrow ? (shouldGrow ? 1 : 0) : 1,
                      transform: isGrow ? (shouldGrow ? 'scale(1)' : 'scale(0.7)') : 'scale(1)',
                      animation: isGrow && shouldGrow ? 'cardGrowIn 500ms cubic-bezier(0.4,0,0.2,1) forwards' : undefined,
                    }}
                  >
                    <ServiceCardSimple {...service} color={service.color} />
                  </Box>
                );
              })}
              <style>{`
                @keyframes cardGrowIn {
                  from { opacity: 0; transform: scale(0.7); }
                  to { opacity: 1; transform: scale(1); }
                }
              `}</style>
            </Box>
          </Box>
          {showArrows && (
            <IconButton
              onClick={handleRight}
              disabled={!canScrollLeft || isSliding}
              sx={{
                position: 'static',
                ml: { xs: 0.5, sm: 1.5 },
                width: 32,
                height: 32,
                minWidth: 32,
                minHeight: 32,
                border: '1px solid',
                borderColor: !canScrollLeft || isSliding ? '#ccc' : theme.palette.primary.main,
                background: '#fff',
                boxShadow: 'none',
                borderRadius: '50%',
                p: 0,
                display: 'flex',
                transition: 'border-color 180ms ease, transform 180ms cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  borderColor: !canScrollLeft || isSliding ? '#ccc' : theme.palette.primary.main,
                  transform: 'scale(1.1)',
                  '& .arrow-icon': {
                    color: !canScrollLeft || isSliding ? '#ccc' : theme.palette.primary.main,
                  },
                },
                '&:disabled': {
                  borderColor: '#ccc',
                  background: '#fafaff',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                },
              }}
              aria-label="Scroll right"
            >
              <ArrowForwardIosIcon className="arrow-icon" sx={{ fontSize: 18, color: !canScrollLeft || isSliding ? '#ccc' : '#444', transition: 'color 180ms' }} />
            </IconButton>
          )}
        </Box>
      </Box>
      {/* Hide scrollbar with global style */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </Box>
  );
} 