import { 
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Paper,
  Button,
  Fade,
  Alert
} from '@mui/material';
import { 
  CalendarToday,
  CheckCircle,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import React from 'react';
import type { BookingScheduleData } from './BookingSchedulePopover';

export interface ScheduleConfirmationStepProps {
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
  schedulingData: BookingScheduleData | null;
  onBack: () => void;
  onNext: () => void;
}

export function ScheduleConfirmationStep({
  service,
  schedulingData,
  onBack,
  onNext
}: ScheduleConfirmationStepProps) {
  return (
    <Fade in={true} timeout={300}>
      <Card sx={{ 
        border: `2px solid ${service.color}20`, 
        borderRadius: 3,
        boxShadow: `0 8px 24px ${service.color}15`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 32px ${service.color}20`,
        }
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
              boxShadow: `0 4px 12px ${service.color}30`
            }}>
              <CalendarToday sx={{ color: 'white', fontSize: 20 }} />
            </Avatar>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              fontSize: '1.1rem'
            }}>
              Schedule Confirmation
            </Typography>
          </Box>

          {schedulingData ? (
            <Paper sx={{ 
              p: 3, 
              bgcolor: `${service.color}08`,
              border: `1px solid ${service.color}20`,
              borderRadius: 2,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CheckCircle sx={{ 
                  color: service.color, 
                  fontSize: 24, 
                  mt: 0.25,
                  flexShrink: 0
                }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ 
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 1
                  }}>
                    Session Scheduled
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    mb: 2
                  }}>
                    Date: {schedulingData.selectedDate ? schedulingData.selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not selected'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    mb: 2
                  }}>
                    Time: {schedulingData.selectedTime ? new Date(`2000-01-01T${schedulingData.selectedTime}`).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    }) : 'Not selected'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6
                  }}>
                    Duration: {schedulingData.sessionDuration} minutes
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
              Please schedule your session to continue
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 2 }}>
            <Button
              onClick={onBack}
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{ 
                borderRadius: 2, 
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                color: 'text.secondary',
                borderColor: 'divider',
                minWidth: 100,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'text.secondary',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              Back
            </Button>
            
            <Button
              onClick={onNext}
              variant="contained"
              disabled={!schedulingData}
              endIcon={<ArrowForward />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                minWidth: 140,
                background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
                boxShadow: `0 4px 12px ${service.color}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: `linear-gradient(135deg, ${service.color}CC 0%, ${service.color} 100%)`,
                  boxShadow: `0 6px 16px ${service.color}40`,
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  background: 'rgba(0,0,0,0.12)',
                  color: 'rgba(0,0,0,0.26)',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              Next Step
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}
