import { 
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Paper,
  Button,
  Fade,
  Chip,
  Divider
} from '@mui/material';
import { 
  Payment,
  AccountBalanceWallet,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material';
import React from 'react';
import type { BookingScheduleData } from './BookingSchedulePopover';

export interface PaymentStepProps {
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
  isSubmitting: boolean;
  onBack?: () => void;
  onSubmit: () => void;
}

export function PaymentStep({
  service,
  schedulingData,
  isSubmitting,
  onBack,
  onSubmit
}: PaymentStepProps) {
  // Payment option utility functions
  const getPaymentOptionLabel = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return 'Free Service';
    }
    switch (option) {
      case 'upfront':
        return 'Payment Upfront';
      case 'split':
        return 'Split Payment';
      case 'later':
        return 'Payment Later';
      default:
        return 'Payment Upfront';
    }
  };

  const getPaymentOptionDescription = (option: 'upfront' | 'split' | 'later', price: number) => {
    if (price === 0) {
      return 'This is a complimentary service';
    }
    switch (option) {
      case 'upfront':
        return 'Full payment required before service begins';
      case 'split':
        return '50% deposit required to secure booking, remaining 50% due after completion';
      case 'later':
        return 'Payment due after service completion';
      default:
        return 'Full payment required before service begins';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate payment breakdown
  const paymentBreakdown = {
    isFree: service?.price === 0,
    totalAmount: service?.price || 0,
    amountPaid: 0, // For booking, no payment has been made yet
    amountRemaining: service?.price || 0,
  };

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
              <Payment sx={{ color: 'white', fontSize: 20 }} />
            </Avatar>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              fontSize: '1.1rem'
            }}>
              Payment Information
            </Typography>
          </Box>
        
          <Paper sx={{ 
            p: 3, 
            bgcolor: `${service.color}08`,
            border: `1px solid ${service.color}20`,
            borderRadius: 2,
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <AccountBalanceWallet sx={{ 
                fontSize: 24, 
                color: service.color, 
                mt: 0.25,
                flexShrink: 0
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 600, 
                  display: 'block', 
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.75rem'
                }}>
                  Payment Option
                </Typography>
                <Chip
                  label={getPaymentOptionLabel(service.payment_option || 'upfront', service.price)}
                  size="small"
                  sx={{
                    bgcolor: `${service.color}20`,
                    color: service.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mb: 2,
                    height: 28,
                    '& .MuiChip-label': {
                      px: 1.5
                    }
                  }}
                />
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary', 
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}>
                  {getPaymentOptionDescription(service.payment_option || 'upfront', service.price)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Payment Status - Colored sub-card */}
          {!paymentBreakdown.isFree && (
            <Box 
              sx={{ 
                p: 2,
                borderRadius: 2,
                bgcolor: `${service.color}10`,
                border: `1px solid ${service.color}30`,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 20, color: service.color }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Payment Status
                </Typography>
              </Box>

              {service.payment_option === 'split' ? (
                <>
                  {/* Deposit Required */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Deposit Required
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        50% deposit required to secure booking
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                      {formatCurrency(paymentBreakdown.totalAmount * 0.5)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Remaining Amount */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Remaining Balance
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Due after service completion
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {formatCurrency(paymentBreakdown.totalAmount * 0.5)}
                    </Typography>
                  </Box>
                </>
              ) : service.payment_option === 'upfront' ? (
                /* Payment Upfront */
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Full Payment Required
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Complete payment needed before service can begin
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                    {formatCurrency(paymentBreakdown.amountRemaining)}
                  </Typography>
                </Box>
              ) : (
                /* Payment Later */
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Payment Due After Completion
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Service can begin without upfront payment
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: service.color }}>
                    {formatCurrency(paymentBreakdown.amountRemaining)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: onBack ? 'space-between' : 'flex-end', 
            mt: 4, 
            gap: 2 
          }}>
            {onBack && (
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
            )}
            
            <Button
              onClick={onSubmit}
              variant="contained"
              disabled={isSubmitting}
              endIcon={isSubmitting ? null : <CheckCircle />}
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
              {isSubmitting ? 'Processing...' : 'Confirm Booking'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}
