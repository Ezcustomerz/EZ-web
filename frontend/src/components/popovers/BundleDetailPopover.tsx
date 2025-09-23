import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Slide,
  Divider,
  Chip,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { ServicesDetailPopover, type ServiceDetail } from './ServicesDetailPopover';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface BundleDetail {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  pricing_option: string;
  fixed_price?: number;
  discount_percentage?: number;
  total_services_price: number;
  final_price: number;
  services: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: string;
    status: string;
    color: string;
    photos?: Array<{
      photo_url: string;
      photo_filename?: string;
      photo_size_bytes?: number;
      is_primary: boolean;
      display_order: number;
    }>;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creative_name?: string;
  creative_display_name?: string;
  creative_title?: string;
  creative_avatar_url?: string;
}

export interface BundleDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  bundle: BundleDetail | null;
  context: 'invite-page' | 'client-connected' | 'services-tab' | 'profile-tab';
  onBook?: () => void;
}

export function BundleDetailPopover({
  open,
  onClose,
  bundle,
  context,
  onBook,
}: BundleDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);

  const handleServiceClick = (service: any) => {
    // Debug: Log the service photos
    console.log('Bundle service photos:', service.photos);
    console.log('Bundle service data:', service);
    console.log('Bundle data:', bundle);
    
    // Convert bundle service to service detail format
    const serviceDetail: ServiceDetail = {
      id: service.id,
      title: service.title,
      description: service.description,
      price: service.price,
      delivery_time: service.delivery_time,
      color: service.color,
      status: service.status,
      creative_name: bundle?.creative_name,
      creative_display_name: bundle?.creative_display_name,
      creative_title: bundle?.creative_title,
      creative_avatar_url: bundle?.creative_avatar_url,
      photos: service.photos || [],
    };
    
    console.log('ServiceDetail photos:', serviceDetail.photos);
    setSelectedService(serviceDetail);
    setServiceDetailOpen(true);
  };

  const handleServiceDetailClose = () => {
    setServiceDetailOpen(false);
    setSelectedService(null);
  };

  if (!bundle) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'public':
        return 'success';
      case 'private':
        return 'default';
      case 'bundle-only':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getBundleIcon = () => {
    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: bundle.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
        }}
      >
        <FontAwesomeIcon icon={faLayerGroup} />
      </Box>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: isMobile ? '100vh' : '90vh',
            margin: isMobile ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            background: `linear-gradient(135deg, ${bundle.color || theme.palette.primary.main}15 0%, ${bundle.color || theme.palette.primary.main}08 100%)`,
            borderBottom: `2px solid ${bundle.color}30`,
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {getBundleIcon()}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h5" fontWeight={600} sx={{ color: 'text.primary' }}>
                  {bundle.title}
                </Typography>
                {context !== 'invite-page' && context !== 'client-connected' && (
                  <Chip
                    label={bundle.status}
                    size="small"
                    color={getStatusColor(bundle.status) as any}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Bundle Package
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, flex: 1, backgroundColor: 'background.paper' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Creative Information */}
            {bundle.creative_display_name && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}>
                  <Avatar 
                    src={bundle.creative_avatar_url}
                    sx={{ 
                      width: 48, 
                      height: 48,
                      backgroundColor: bundle.color || theme.palette.primary.main,
                      fontSize: '1.2rem',
                      fontWeight: 600
                    }}
                  >
                    {bundle.creative_display_name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                      {bundle.creative_display_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                      {bundle.creative_title || 'Creative Professional'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Bundle Description */}
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                Bundle Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ 
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {bundle.description}
              </Typography>
            </Box>

            {/* Bundle Services */}
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                Services Included ({bundle.services.length})
              </Typography>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                },
                gap: 2
              }}>
                {bundle.services.map((service) => (
                  <Card
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: service.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.7rem',
                          }}
                        >
                          <FontAwesomeIcon icon={faGem} />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
                          {service.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {service.description.length > 100 
                          ? `${service.description.substring(0, 100)}...` 
                          : service.description
                        }
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {formatPrice(service.price)}
                        </Typography>
                        <Chip
                          label={service.status}
                          size="small"
                          color={getStatusColor(service.status) as any}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Bundle Pricing */}
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                Bundle Pricing
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                p: 3,
                backgroundColor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body1" color="text.secondary">
                      Total Services Value:
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600} color="text.primary">
                    {formatPrice(bundle.total_services_price)}
                  </Typography>
                </Box>
                
                {bundle.pricing_option === 'discount' && bundle.discount_percentage && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalOfferIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      <Typography variant="body1" color="success.main" fontWeight={500}>
                        {bundle.discount_percentage}% Discount Applied
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="success.main" fontWeight={600}>
                      - {formatPrice(bundle.total_services_price - bundle.final_price)}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  pt: 2,
                  borderTop: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    Final Bundle Price:
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {formatPrice(bundle.final_price)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {context === 'client-connected' && onBook && (
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={onBook}
              variant="contained"
              startIcon={<BookOnlineIcon />}
              size="large"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Book This Bundle
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Service Detail Popover */}
      <ServicesDetailPopover
        open={serviceDetailOpen}
        onClose={handleServiceDetailClose}
        service={selectedService}
        context={context}
        onBook={onBook}
      />
    </>
  );
}
