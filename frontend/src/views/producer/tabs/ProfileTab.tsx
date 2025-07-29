import { HeroSection } from '../../../components/sections/producer/HeroSection';
import { ServiceCardSection } from '../../../components/sections/producer/ServiceCardSection';
import { Box, Tabs, Tab, Typography, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import StarIcon from '@mui/icons-material/Star';
import { ReviewCardSection } from '../../../components/sections/producer/ReviewCardSection';
import { ReviewPopover } from '../../../components/popovers/ReviewPopover';
import { SessionPopover } from '../../../components/popovers/ServicePopover';

// Mock data for reviews
const MOCK_REVIEWS = [
  {
    id: 1,
    reviewerName: "Sarah Johnson",
    reviewerAvatar: null,
    rating: 5,
    review: "Absolutely amazing work! The mixing quality is professional grade and the turnaround time was incredible. Will definitely work with again.",
    service: "Mixing",
    date: "2024-01-15"
  },
  {
    id: 2,
    reviewerName: "Mike Chen",
    reviewerAvatar: null,
    rating: 4,
    review: "Great mastering service. The track sounds much more polished and radio-ready. Only giving 4 stars because the initial communication could have been faster.",
    service: "Mastering",
    date: "2024-01-10"
  },
  {
    id: 3,
    reviewerName: "Alex Rivera",
    reviewerAvatar: null,
    rating: 5,
    review: "Incredible vocal tuning work! You can barely tell it was processed, which is exactly what I wanted. The attention to detail is outstanding.",
    service: "Vocal Tuning",
    date: "2024-01-08"
  },
  {
    id: 4,
    reviewerName: "Emma Davis",
    reviewerAvatar: null,
    rating: 5,
    review: "Full production package was worth every penny. From the initial concept to the final mix, everything was handled professionally. The final product exceeded my expectations.",
    service: "Full Production",
    date: "2024-01-05"
  },
  {
    id: 5,
    reviewerName: "David Kim",
    reviewerAvatar: null,
    rating: 4,
    review: "Solid beat making skills. The track has great energy and the mix is clean. Would have given 5 stars but the genre wasn't exactly what I was looking for.",
    service: "Beat Making",
    date: "2024-01-03"
  },
  {
    id: 6,
    reviewerName: "Lisa Thompson",
    reviewerAvatar: null,
    rating: 5,
    review: "Session guitar work was phenomenal! The playing style perfectly matched the song's vibe and the recording quality is studio-grade. Highly recommend!",
    service: "Session Guitar",
    date: "2024-01-01"
  }
];

export interface Review {
  id: number;
  reviewerName: string;
  reviewerAvatar: string | null;
  rating: number;
  review: string;
  service: string;
  date: string;
}

export interface ProfileTabProps {
  seeAllDialogOpen?: boolean;
  onSeeAllDialogChange?: (open: boolean) => void;
}

export function ProfileTab({ seeAllDialogOpen, onSeeAllDialogChange }: ProfileTabProps = {}) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [seeAllOpen, setSeeAllOpen] = useState<'reviews' | 'services' | null>(null);

  // Notify parent when dialog opens/closes
  useEffect(() => {
    if (onSeeAllDialogChange) {
      onSeeAllDialogChange(!!seeAllOpen);
    }
  }, [seeAllOpen, onSeeAllDialogChange]);

  useEffect(() => {
    if (typeof seeAllDialogOpen === 'boolean' && !seeAllDialogOpen && seeAllOpen) {
      setSeeAllOpen(null);
    }
  }, [seeAllDialogOpen]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Import demo services from ServiceCardRow
  const DEMO_SERVICES = [
    { id: 'service-1', title: 'Mixing', description: 'Professional mixing for your tracks', price: 200, delivery: '3 days', color: '#F3E8FF', producer: 'Demo User' },
    { id: 'service-2', title: 'Mastering', description: 'High-quality mastering for release', price: 150, delivery: '2 days', color: '#E0F2FE', producer: 'Demo User' },
    { id: 'service-3', title: 'Vocal Tuning', description: 'Pitch correction and tuning for vocals', price: 100, delivery: '1 day', color: '#FEF9C3', producer: 'Demo User' },
    { id: 'service-4', title: 'Full Production', description: 'From songwriting to final mix', price: 1000, delivery: '10 days', color: '#FEE2E2', producer: 'Demo User' },
    { id: 'service-5', title: 'Beat Making', description: 'Custom beats for any genre', price: 300, delivery: '4 days', color: '#DCFCE7', producer: 'Demo User' },
    { id: 'service-6', title: 'Session Guitar', description: 'Professional guitar tracks for your song', price: 120, delivery: '2 days', color: '#E0E7FF', producer: 'Demo User' },
    { id: 'service-7', title: 'Drum Programming', description: 'Realistic drum programming for your track', price: 180, delivery: '3 days', color: '#FFE4E6', producer: 'Demo User' },
  ];

  return (
    <Box sx={{
      maxHeight: { xs: '100dvh', sm: 'none' },
      overflowY: { xs: 'auto', sm: 'visible' },
      animation: 'fadeSlideIn 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <HeroSection />
      {/* Instagram-style Subtabs */}
      <Box sx={{ position: 'relative', mb: 0 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="profile sections"
          TabIndicatorProps={{
            sx: {
              height: 2,
              background: theme.palette.primary.main,
              top: -1,
            }
          }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            '& .MuiTabs-flexContainer': {
              justifyContent: 'center',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: theme.palette.text.secondary,
              opacity: 0.7,
              minHeight: 48,
              minWidth: 0,
              padding: { xs: '12px 16px', sm: '12px 24px' },
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: 0.9,
                color: theme.palette.text.primary,
              },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                opacity: 1,
                fontWeight: 700,
              },
              '& .MuiTouchRipple-root': {
                display: 'none',
              },
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MusicNoteIcon sx={{ fontSize: 18 }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'inherit',
                    fontSize: 'inherit',
                    textTransform: 'inherit'
                  }}
                >
                  Services
                </Typography>
              </Box>
            }
            aria-label="services"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ fontSize: 18 }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'inherit',
                    fontSize: 'inherit',
                    textTransform: 'inherit'
                  }}
                >
                  Reviews
                </Typography>
              </Box>
            }
            aria-label="reviews"
          />
        </Tabs>
      </Box>
      {/* Content Section (no scroll styles here) */}
      <Box sx={{ mt: 1 }}>
        {activeTab === 0 ? (
            <ServiceCardSection 
              arrowPosition="inside" 
              showSeeAll={true}
              onSeeAll={() => setSeeAllOpen('services')}
            />
        ) : (
          <ReviewCardSection reviews={MOCK_REVIEWS} onSeeAll={() => setSeeAllOpen('reviews')} />
        )}
      </Box>
      {/* See All Dialog */}
      <ReviewPopover
        open={seeAllOpen === 'reviews'}
        onClose={() => setSeeAllOpen(null)}
        reviews={MOCK_REVIEWS}
      />
      <SessionPopover
        open={seeAllOpen === 'services'}
        onClose={() => setSeeAllOpen(null)}
        services={DEMO_SERVICES}
      />
    </Box>
  );
} 