import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Slide,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Close,
  Star,
  LocationOn,
  Work,
  ContactPhone,
  Email,
  Visibility,
  Person,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import { ReviewPopover } from '../creative/ReviewPopover';
import type { Review } from '../../../views/creative/tabs/ProfileTab';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface CreativeDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  creative: {
    id: string;
    name: string;
    avatar: string | null;
    specialty: string;
    email: string;
    rating: number;
    reviewCount: number;
    servicesCount: number;
    isOnline: boolean;
    color: string;
    status: string;
    // Additional fields for detail view
    description?: string;
    primary_contact?: string;
    secondary_contact?: string;
    availability_location?: string;
    profile_highlights?: string[];
    profile_highlight_values?: Record<string, string>;
  };
}

// Mock reviews data for the creative
const MOCK_CREATIVE_REVIEWS: Review[] = [
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
];

export function CreativeDetailPopover({ open, onClose, creative }: CreativeDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reviewsOpen, setReviewsOpen] = useState(false);

  // Use creative's actual rating and review data
  const averageRating = creative.rating;
  const reviewCount = creative.reviewCount;

  const handleViewReviews = () => {
    setReviewsOpen(true);
  };

  const handleCloseReviews = () => {
    setReviewsOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        fullScreen={isMobile}
        slots={{ transition: Transition }}
        sx={{
          zIndex: isMobile ? 10000 : 1300,
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: isMobile ? 0 : 3,
              p: 0,
              backgroundColor: '#fff',
              boxShadow: theme.shadows[8],
              height: isMobile ? '100dvh' : 'auto',
              maxHeight: isMobile ? '100dvh' : '90vh',
              ...(isMobile && {
                display: 'flex',
                flexDirection: 'column',
              }),
            },
          },
          backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          pb: 2, 
          flexShrink: 0,
          background: `linear-gradient(135deg, ${creative.color} 0%, ${creative.color}CC 100%)`,
          color: 'white',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${creative.color} 0%, ${creative.color}80 50%, ${creative.color}40 100%)`,
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={creative.avatar || undefined}
              sx={{
                width: 60,
                height: 60,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '1.5rem',
                border: '3px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {creative.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: 'white' }}>
                {creative.name}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem' }}>
                {creative.specialty}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              transition: 'background-color 0.2s ease',
            }}
            size="medium"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{
          p: 3,
          flex: '1 1 auto',
          overflowY: 'auto',
          minHeight: 0,
        }}>
          {/* 1. About Section */}
          {creative.description && (
            <Card sx={{ 
              my: 2,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Person sx={{ 
                    mr: 1.5, 
                    color: 'primary.main',
                    fontSize: '1.25rem'
                  }} />
                  <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary' }}>
                    About {creative.name}
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.95rem'
                  }}
                >
                  {creative.description}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* 2. Contact Information Section nice*/}
          {(creative.primary_contact || creative.secondary_contact) && (
            <Card sx={{ 
              my: 2,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <ContactPhone sx={{ 
                    mr: 1.5, 
                    color: 'primary.main',
                    fontSize: '1.25rem'
                  }} />
                  <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary' }}>
                    Contact Information
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {creative.primary_contact && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary', mb: 0.5 }}>
                        Primary Contact
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ 
                          mr: 1, 
                          color: 'text.secondary',
                          fontSize: '1.1rem'
                        }} />
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                          {creative.primary_contact}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {creative.secondary_contact && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary', mb: 0.5 }}>
                        Secondary Contact
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ContactPhone sx={{ 
                          mr: 1, 
                          color: 'text.secondary',
                          fontSize: '1.1rem'
                        }} />
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                          {creative.secondary_contact}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* 3. Location & Availability Section */}
          {creative.availability_location && (
            <Card sx={{ 
              my: 2,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <LocationOn sx={{ 
                    mr: 1.5, 
                    color: 'primary.main',
                    fontSize: '1.25rem'
                  }} />
                  <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary' }}>
                    Location & Availability
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ 
                    mr: 1, 
                    color: 'text.secondary',
                    fontSize: '1.1rem'
                  }} />
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {creative.availability_location}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* 4. Profile Highlights Section */}
          {creative.profile_highlights && creative.profile_highlights.length > 0 && (
            <Card sx={{ 
              my: 2,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Star sx={{ 
                    mr: 1.5, 
                    color: 'warning.main',
                    fontSize: '1.25rem'
                  }} />
                  <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary' }}>
                    Profile Highlights
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {creative.profile_highlights.map((highlight, index) => {
                    // Transform the highlight key to match the stored format
                    const statKey = highlight.replace(/\s+/g, '').toLowerCase();
                    const value = creative.profile_highlight_values?.[statKey] || 'Not set';
                    
                    return (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        py: 0.5,
                        gap: 1
                      }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {highlight}:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                          {value}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* 5. Rating & Reviews Section */}
          <Card sx={{ 
            my: 2,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Star sx={{ 
                  mr: 1.5, 
                  color: 'warning.main',
                  fontSize: '1.25rem'
                }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary' }}>
                  Rating & Reviews
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {reviewCount > 0 ? (
                    <>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 215, 0, 0.12)',
                        borderRadius: 2,
                        px: 2,
                        py: 1
                      }}>
                        <Star sx={{ color: '#FFD700', mr: 0.5, fontSize: '1.2rem' }} />
                        <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
                          {averageRating.toFixed(1)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      No reviews yet
                    </Typography>
                  )}
                </Box>
                {reviewCount > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleViewReviews}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                      }
                    }}
                  >
                    View All Reviews
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </DialogContent>

      </Dialog>

      {/* Reviews Popover */}
      <ReviewPopover
        open={reviewsOpen}
        onClose={handleCloseReviews}
        reviews={MOCK_CREATIVE_REVIEWS}
      />
    </>
  );
}
