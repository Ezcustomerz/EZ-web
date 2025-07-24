import { Box, Typography, Button, IconButton, useTheme } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useState, useEffect, useRef } from 'react';
import { ReviewCard } from '../../cards/producer/ReviewCard';
import type { Review } from '../../../views/producer/tabs/ProfileTab';

export function ReviewCardSection({ reviews, onSeeAll }: { reviews: Review[]; onSeeAll: () => void }) {
  const theme = useTheme();
  const [startIdx, setStartIdx] = useState(0);
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
        }, 300);
      }, 5);
      setPendingIdx(null);
    }
  }, [pendingIdx, cardsPerView]);
  const canScrollLeft = startIdx > 0;
  const canScrollRight = startIdx + cardsPerView < reviews.length;
  const showArrows = reviews.length > cardsPerView;
  const visibleCards = reviews.slice(startIdx, startIdx + cardsPerView);
  // Animation style for the grid
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPixelWidth, setCardPixelWidth] = useState(0);
  useEffect(() => {
    if (cardRef.current) {
      setCardPixelWidth(cardRef.current.offsetWidth + 16); // 16px for gap
    }
  }, [cardsPerView, startIdx]);
  let gridTransform = 'translateX(0)';
  if (isSliding && slideDirection === 'left') gridTransform = `translateX(-${cardPixelWidth}px)`;
  if (isSliding && slideDirection === 'right') gridTransform = `translateX(${cardPixelWidth}px)`;
  const handleLeft = () => {
    if (canScrollRight && !isSliding) {
      setSlideDirection('left');
      directionRef.current = 'left';
      setIsSliding(true);
      setTimeout(() => {
        setIsSliding(false);
        setPendingIdx(startIdx + 1);
      }, 500);
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
      }, 500);
    }
  };
  return (
    <Box sx={{ width: '100%' }}>
      {/* Section header row for Reviews and See all */}
      <Box sx={{ px: { xs: 1, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', letterSpacing: 0.2 }}>
            Reviews
          </Typography>
          <Button variant="text" size="small" aria-label="See all reviews" onClick={onSeeAll}
            sx={{ textTransform: 'none', fontWeight: 500, color: theme.palette.primary.main }}>
            See all
          </Button>
        </Box>
      </Box>
      {/* Carousel row with arrows outside the card row padding */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        {/* Left Arrow */}
        {showArrows && (
          <IconButton
            onClick={handleLeft}
            disabled={!canScrollRight || isSliding}
            aria-label="Scroll reviews left"
            sx={{
              position: 'absolute',
              left: { xs: 8, sm: 32 },
              top: '50%',
              transform: 'translateY(-50%) scale(1)',
              zIndex: 2,
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
                background: theme.palette.action.hover,
                borderColor: !canScrollRight || isSliding ? '#ccc' : theme.palette.primary.main,
                transform: 'translateY(-50%) scale(1.1)',
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
          >
            <ArrowBackIosNewIcon className="arrow-icon" sx={{ fontSize: 18, color: !canScrollRight || isSliding ? '#ccc' : '#444', transition: 'color 180ms' }} />
          </IconButton>
        )}
        {/* Card Grid with matching px as header */}
        <Box sx={{ width: '100%', px: { xs: 2, sm: 4 }, overflow: 'hidden', flex: 1, py: 1 }} className="hide-scrollbar">
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1.5, sm: 2.5 },
              justifyContent: 'center',
              transform: gridTransform,
              transition: isSliding ? 'transform 500ms cubic-bezier(0.4,0,0.2,1)' : 'none',
              alignItems: 'stretch',
            }}
          >
            {visibleCards.map((review, i) => {
              const isGrow = growIdx === i;
              return (
                <Box
                  key={review.id}
                  ref={i === 0 ? cardRef : undefined}
                  sx={{
                    flex: '0 0 auto',
                    width: { xs: '80%', sm: '45%', md: '30%', lg: '22%' },
                    mx: { xs: 'auto', sm: 0 },
                    transition: 'width 0.2s',
                    opacity: isGrow ? (shouldGrow ? 1 : 0) : 1,
                    transform: isGrow ? (shouldGrow ? 'scale(1)' : 'scale(0.7)') : 'scale(1)',
                    animation: isGrow && shouldGrow ? 'cardGrowIn 500ms cubic-bezier(0.4,0,0.2,1) forwards' : undefined,
                    py: 1,
                    display: 'flex',
                    alignItems: 'stretch',
                  }}
                >
                  <ReviewCard review={review} />
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
        {/* Right Arrow */}
        {showArrows && (
          <IconButton
            onClick={handleRight}
            disabled={!canScrollLeft || isSliding}
            aria-label="Scroll reviews right"
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 32 },
              top: '50%',
              transform: 'translateY(-50%) scale(1)',
              zIndex: 2,
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
                background: theme.palette.action.hover,
                borderColor: !canScrollLeft || isSliding ? '#ccc' : theme.palette.primary.main,
                transform: 'translateY(-50%) scale(1.1)',
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
          >
            <ArrowForwardIosIcon className="arrow-icon" sx={{ fontSize: 18, color: !canScrollLeft || isSliding ? '#ccc' : '#444', transition: 'color 180ms' }} />
          </IconButton>
        )}
        {/* Hide scrollbar with global style */}
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </Box>
    </Box>
  );
} 