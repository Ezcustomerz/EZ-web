import { 
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Paper,
  Button,
  Fade
} from '@mui/material';
import { 
  Schedule,
  ArrowForward,
  Info
} from '@mui/icons-material';
import React from 'react';

export interface ScheduleSessionStepProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    creative_name: string;
    creative_display_name?: string;
    creative_title?: string;
    creative_avatar_url?: string;
    color: string;
    payment_option?: 'upfront' | 'split' | 'later';
    requires_booking?: boolean;
  };
  activeStep: number;
  stepTransition: boolean;
  onScheduleClick: () => void;
}

export function ScheduleSessionStep({
  service,
  activeStep,
  stepTransition,
  onScheduleClick
}: ScheduleSessionStepProps) {
  return (
    <Fade in={stepTransition} timeout={300}>
      <Card sx={{ 
        border: '2px solid',
        borderColor: activeStep === 0 ? service.color : 'divider',
        borderRadius: 3,
        mt: 2,
        transition: 'all 0.3s ease',
        boxShadow: activeStep === 0 
          ? `0 8px 24px ${service.color}20` 
          : '0 4px 12px rgba(0,0,0,0.1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: activeStep === 0 
            ? `0 12px 32px ${service.color}25` 
            : '0 8px 20px rgba(0,0,0,0.15)',
        }
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3, 
            mb: 3 
          }}>
            <Avatar sx={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
              boxShadow: `0 4px 12px ${service.color}30`
            }}>
              <Schedule sx={{ color: 'white', fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 0.5
              }}>
                Schedule Your Session
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}>
                This service requires calendar scheduling
              </Typography>
            </Box>
          </Box>
          
          <Paper sx={{ 
            p: 3, 
            bgcolor: `${service.color}08`,
            border: `1px solid ${service.color}20`,
            borderRadius: 2,
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Info sx={{ 
                color: service.color, 
                fontSize: 20, 
                mt: 0.25,
                flexShrink: 0
              }} />
              <Box>
                <Typography variant="body1" sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  mb: 1
                }}>
                  Booking Required
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.6
                }}>
                  This service requires advance scheduling. Please proceed to the next step to complete your booking and select your preferred time slot.
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              onClick={onScheduleClick}
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
                boxShadow: `0 4px 12px ${service.color}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: `linear-gradient(135deg, ${service.color}CC 0%, ${service.color} 100%)`,
                  boxShadow: `0 6px 16px ${service.color}40`,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Schedule Session
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}
