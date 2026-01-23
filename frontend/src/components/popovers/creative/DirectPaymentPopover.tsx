import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Slide,
  Divider,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Autocomplete,
  Avatar,
  Chip,
  Card,
  InputAdornment,
  CircularProgress,
  List,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Payment, AttachMoney, Description, Person, CalendarToday, AccountBalance, Warning } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { userService, type CreativeClient, type CreativeProfile } from '../../../api/userService';
import { bookingService, type Order } from '../../../api/bookingService';
import { paymentRequestsService } from '../../../api/paymentRequestsService';
import { useAuth } from '../../../context/auth';
import { successToast, errorToast } from '../../../components/toast/toast';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface DirectPaymentPopoverProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (paymentData: DirectPaymentData) => void;
  onOpenSettings?: (section?: 'billing') => void; // Callback to open settings
}

export interface DirectPaymentData {
  paymentType: 'booking' | 'client';
  bookingId?: string;
  clientId?: string;
  amount: number;
  notes?: string;
}

type PaymentType = 'booking' | 'client';

export function DirectPaymentPopover({ 
  open, 
  onClose,
  onSubmit,
  onOpenSettings
}: DirectPaymentPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();
  
  const [paymentType, setPaymentType] = useState<PaymentType>('client');
  const [selectedBooking, setSelectedBooking] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<CreativeClient | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStripeSetupDialog, setShowStripeSetupDialog] = useState(false);
  
  // Data fetching states
  const [bookings, setBookings] = useState<Order[]>([]);
  const [allBookings, setAllBookings] = useState<Order[]>([]); // All fetched bookings
  const [displayedBookingsCount, setDisplayedBookingsCount] = useState(5); // Number of bookings to display
  const [clients, setClients] = useState<CreativeClient[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingMoreBookings, setLoadingMoreBookings] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  // Creative profile for fee calculation
  const [creativeProfile, setCreativeProfile] = useState<CreativeProfile | null>(null);

  // Fetch creative profile for fee calculation
  useEffect(() => {
    if (open && isAuthenticated) {
      fetchCreativeProfile();
    }
  }, [open, isAuthenticated]);

  // Fetch bookings when payment type is 'booking'
  useEffect(() => {
    if (open && paymentType === 'booking' && isAuthenticated) {
      fetchBookings();
    }
  }, [open, paymentType, isAuthenticated]);

  // Fetch clients when payment type is 'client'
  useEffect(() => {
    if (open && paymentType === 'client' && isAuthenticated) {
      fetchClients();
    }
  }, [open, paymentType, isAuthenticated]);

  const fetchCreativeProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await userService.getCreativeProfile();
      setCreativeProfile(profile);
    } catch (error) {
      console.error('Failed to fetch creative profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchBookings = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMoreBookings(true);
        // When loading more, just increase the displayed count
        setDisplayedBookingsCount(prev => prev + 5);
      } else {
        setLoadingBookings(true);
        setDisplayedBookingsCount(5); // Reset to initial count

        // Fetch both current and past orders
        const [currentOrders, pastOrders] = await Promise.all([
          bookingService.getCreativeCurrentOrders(),
          bookingService.getCreativePastOrders(),
        ]);

        // Combine and filter out cancelled and pending approval bookings
        const allOrders = [...currentOrders, ...pastOrders];
        const filtered = allOrders.filter(booking => {
          const creativeStatus = booking.creative_status?.toLowerCase();
          const clientStatus = booking.client_status?.toLowerCase();
          
          // Exclude cancelled or pending approval bookings
          return (
            creativeStatus !== 'cancelled' &&
            creativeStatus !== 'pending_approval' &&
            creativeStatus !== 'rejected' &&
            clientStatus !== 'cancelled'
          );
        });

        // Sort by order_date descending (most recent first)
        const sorted = filtered.sort((a, b) => {
          const dateA = a.order_date ? new Date(a.order_date).getTime() : 0;
          const dateB = b.order_date ? new Date(b.order_date).getTime() : 0;
          return dateB - dateA;
        });

        // Set all bookings and initial displayed bookings
        setAllBookings(sorted);
        setBookings(sorted.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoadingBookings(false);
      setLoadingMoreBookings(false);
    }
  };

  // Update displayed bookings when displayedBookingsCount changes
  useEffect(() => {
    if (allBookings.length > 0) {
      setBookings(allBookings.slice(0, displayedBookingsCount));
    }
  }, [displayedBookingsCount, allBookings]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await userService.getCreativeClients();
      setClients(response.clients);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handlePaymentTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as PaymentType;
    setPaymentType(newType);
    setSelectedBooking(null);
    setSelectedClient(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove leading zeros except for "0." or "0"
    if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
      value = value.replace(/^0+/, '') || '0';
    }
    
    // Allow only numbers and one decimal point
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setAmount(value);
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      errorToast('Invalid Amount', 'Please enter a valid payment amount greater than 0.');
      return;
    }

    if (paymentType === 'booking' && !selectedBooking) {
      errorToast('Booking Required', 'Please select a booking to associate with this payment request.');
      return;
    }

    if (paymentType === 'client' && !selectedClient) {
      errorToast('Client Required', 'Please select a client for this payment request.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create payment request via API
      // If booking_id is provided, backend will get client_user_id from the booking
      const requestData: {
        client_user_id?: string;
        amount: number;
        notes?: string;
        booking_id?: string;
      } = {
        amount: amountNum,
        notes: notes.trim() || undefined,
      };

      if (paymentType === 'client') {
        requestData.client_user_id = selectedClient!.user_id;
      } else {
        requestData.booking_id = selectedBooking!.id;
      }

      await paymentRequestsService.createPaymentRequest(requestData);

      // Call onSubmit callback if provided (for backwards compatibility)
      const paymentData: DirectPaymentData = {
        paymentType,
        bookingId: paymentType === 'booking' ? selectedBooking?.id : undefined,
        clientId: paymentType === 'client' ? selectedClient?.user_id : undefined,
        amount: amountNum,
        notes: notes.trim() || undefined,
      };

      if (onSubmit) {
        onSubmit(paymentData);
      }

      successToast(
        'Payment Request Created',
        `Payment request for $${amountNum.toFixed(2)} has been sent successfully.`
      );

      // Reset form and close
      handleClose();
    } catch (error: any) {
      console.error('Failed to create payment request:', error);
      
      // Check if error is due to Stripe not being set up
      if (error.message && error.message.includes('STRIPE_NOT_SETUP')) {
        setShowStripeSetupDialog(true);
      } else {
        errorToast(
          'Failed to Create Payment Request',
          error.message || 'An error occurred while creating the payment request. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPaymentType('client');
    setSelectedBooking(null);
    setSelectedClient(null);
    setAmount('');
    setNotes('');
    setBookingSearchTerm('');
    setClientSearchTerm('');
    setShowStripeSetupDialog(false);
    onClose();
  };

  const handleSetupBankAccount = () => {
    // Close this popover
    handleClose();
    
    // Open settings to billing section
    if (onOpenSettings) {
      onOpenSettings('billing');
    }
  };

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => {
    if (!bookingSearchTerm) return true;
    const searchLower = bookingSearchTerm.toLowerCase();
    return (
      booking.service_name?.toLowerCase().includes(searchLower) ||
      booking.creative_name?.toLowerCase().includes(searchLower) ||
      booking.id.toLowerCase().includes(searchLower)
    );
  });

  // Check if there are more bookings to load
  const hasMoreBookings = allBookings.length > displayedBookingsCount;

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.contact?.toLowerCase().includes(searchLower) ||
      client.user_id.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Custom ListboxComponent that includes the "Load More" button at the bottom
  const CustomListboxComponent = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLElement>>(
    function CustomListboxComponent(props, ref) {
      const { children, ...other } = props;
      return (
        <List
          ref={ref}
          {...other}
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            '& .MuiAutocomplete-option': {
              px: 0,
            },
          }}
        >
          {children}
          {hasMoreBookings && !loadingMoreBookings && (
            <Box component="li" sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchBookings(true);
                }}
                sx={{
                  py: 1,
                  textTransform: 'none',
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: `${theme.palette.primary.main}08`,
                  },
                }}
              >
                Load More Bookings ({allBookings.length - displayedBookingsCount} remaining)
              </Button>
            </Box>
          )}
          {loadingMoreBookings && (
            <Box component="li" sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </List>
      );
    }
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        zIndex: isMobile ? 10000 : 1300,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100vh' : '90vh',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        pt: 2.5,
        px: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}08 100%)`,
        borderBottom: `2px solid ${theme.palette.primary.main}20`,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
            }}
          >
            <Payment sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              Request Direct Payment
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Request payment from a client or associate with a booking
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2.5, pt: 0 }}>
        {/* Payment Type Selection */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 2, mt: 2 }}>
          <FormLabel component="legend" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary }}>
            Payment Association
          </FormLabel>
          <RadioGroup
            value={paymentType}
            onChange={handlePaymentTypeChange}
            sx={{ gap: 1 }}
          >
            <Card
              variant="outlined"
              sx={{
                border: paymentType === 'booking' 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : `1px solid ${theme.palette.divider}`,
                backgroundColor: paymentType === 'booking' 
                  ? `${theme.palette.primary.main}08` 
                  : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: `${theme.palette.primary.main}05`,
                },
              }}
            >
              <FormControlLabel
                value="booking"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                    <CalendarToday sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Associate with Booking
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Link this payment to a specific booking
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ m: 0, p: 1.5, width: '100%' }}
              />
            </Card>
            <Card
              variant="outlined"
              sx={{
                border: paymentType === 'client' 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : `1px solid ${theme.palette.divider}`,
                backgroundColor: paymentType === 'client' 
                  ? `${theme.palette.primary.main}08` 
                  : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: `${theme.palette.primary.main}05`,
                },
              }}
            >
              <FormControlLabel
                value="client"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                    <Person sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Select Client
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Request payment from a specific client
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ m: 0, p: 1.5, width: '100%' }}
              />
            </Card>
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Booking Selection */}
        {paymentType === 'booking' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
              Select Booking
            </Typography>
            {loadingBookings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <>
                <Autocomplete
                  options={filteredBookings}
                  getOptionLabel={(option) => {
                    const orderDateStr = option.order_date ? formatDate(option.order_date) : '';
                    return `${option.service_name || 'Service'} - ${option.creative_name || 'Client'}${orderDateStr ? ` (${orderDateStr})` : ''}`;
                  }}
                  value={selectedBooking}
                  onChange={(_, newValue) => setSelectedBooking(newValue)}
                  inputValue={bookingSearchTerm}
                  onInputChange={(_, newInputValue) => setBookingSearchTerm(newInputValue)}
                  loading={loadingBookings}
                  ListboxComponent={CustomListboxComponent}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search bookings..."
                      variant="outlined"
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          width: '100%',
                          p: 2,
                          border: selectedBooking?.id === option.id 
                            ? `2px solid ${theme.palette.primary.main}` 
                            : `1px solid ${theme.palette.divider}`,
                          backgroundColor: selectedBooking?.id === option.id 
                            ? `${theme.palette.primary.main}08` 
                            : 'transparent',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {option.service_name || 'Service'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                              Client: {option.creative_name || 'Unknown'}
                            </Typography>
                            {option.order_date && (
                              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                Order Date: {formatDate(option.order_date)}
                              </Typography>
                            )}
                          </Box>
                          <Chip
                            label={formatCurrency(option.price)}
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.primary.main,
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        {option.booking_date && (
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Booking Date: {formatDate(option.booking_date)}
                          </Typography>
                        )}
                      </Card>
                    </Box>
                  )}
                  noOptionsText="No bookings found"
                  sx={{ width: '100%' }}
                />
              </>
            )}
          </Box>
        )}

        {/* Client Selection */}
        {paymentType === 'client' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
              Select Client
            </Typography>
            {loadingClients ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Autocomplete
                options={filteredClients}
                getOptionLabel={(option) => option.name || 'Unknown Client'}
                value={selectedClient}
                onChange={(_, newValue) => setSelectedClient(newValue)}
                inputValue={clientSearchTerm}
                onInputChange={(_, newInputValue) => setClientSearchTerm(newInputValue)}
                loading={loadingClients}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search clients..."
                    variant="outlined"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.user_id}>
                    <Card
                      variant="outlined"
                      sx={{
                        width: '100%',
                        p: 2,
                        border: selectedClient?.user_id === option.user_id 
                          ? `2px solid ${theme.palette.primary.main}` 
                          : `1px solid ${theme.palette.divider}`,
                        backgroundColor: selectedClient?.user_id === option.user_id 
                          ? `${theme.palette.primary.main}08` 
                          : 'transparent',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={option.profile_picture_url}
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: theme.palette.primary.main,
                          }}
                        >
                          {option.name?.charAt(0)?.toUpperCase() || 'C'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {option.name || 'Unknown Client'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {option.contact || 'No contact info'}
                          </Typography>
                          {option.title && (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              {option.title}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={option.status === 'active' ? 'Active' : 'Inactive'}
                          size="small"
                          color={option.status === 'active' ? 'success' : 'default'}
                        />
                      </Box>
                    </Card>
                  </Box>
                )}
                noOptionsText="No clients found"
                sx={{ width: '100%' }}
              />
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Amount Input */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
            Payment Amount
          </Typography>
          <TextField
            fullWidth
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
            inputProps={{
              min: 0,
              step: 0.01,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '1.1rem',
                fontWeight: 600,
              },
            }}
          />
        </Box>

        {/* Earnings Breakdown - Show when amount is set and profile is loaded */}
        {amount && parseFloat(amount) > 0 && creativeProfile?.subscription_tier_fee_percentage !== undefined && (
          <Box sx={{
            p: 2.5,
            mb: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            overflow: 'visible'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'success.main' }}>
              💰 Your Earnings Breakdown
            </Typography>
            {(() => {
              const requestAmount = parseFloat(amount);
              const feePercentage = creativeProfile.subscription_tier_fee_percentage;
              const platformFee = requestAmount * feePercentage;
              const yourEarnings = requestAmount - platformFee;
              const feePercentageDisplay = (feePercentage * 100).toFixed(1);
              
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'visible' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Request Amount:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${requestAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Transaction Fee ({feePercentageDisplay}%):
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                      -${platformFee.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    pt: 2,
                    pb: 1,
                    borderTop: '1px solid rgba(76, 175, 80, 0.2)'
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Your Net Earnings:
                    </Typography>
                    <Typography 
                      component="div"
                      sx={{ 
                        fontWeight: 700, 
                        color: 'text.primary',
                        fontSize: '1.125rem',
                        fontFamily: 'inherit'
                      }}
                    >
                      ${yourEarnings.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              );
            })()}
          </Box>
        )}

        {/* Notes Input */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
            Notes (Optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or description for this payment request..."
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <Description sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleClose}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (paymentType === 'booking' && !selectedBooking) ||
              (paymentType === 'client' && !selectedClient)
            }
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Payment />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 6px 20px ${theme.palette.primary.main}50`,
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }}
          >
            Request Payment
          </Button>
        </Box>
      </DialogContent>

      {/* Stripe Setup Required Dialog */}
      <Dialog
        open={showStripeSetupDialog}
        onClose={() => setShowStripeSetupDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Warning sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Bank Account Setup Required
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowStripeSetupDialog(false)}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: theme.palette.text.secondary,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Before you can request payments, you need to set up your bank account to receive funds.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <AccountBalance sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Connect Your Bank Account
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Set up your Stripe account to start receiving payments securely
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setShowStripeSetupDialog(false)}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSetupBankAccount}
            startIcon={<AccountBalance />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 6px 20px ${theme.palette.primary.main}50`,
                transform: 'translateY(-2px)',
              },
            }}
          >
            Set Up Bank Account
          </Button>
        </Box>
      </Dialog>
    </Dialog>
  );
}

