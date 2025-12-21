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
  CardMedia,
  Modal,
  Backdrop,
  Fade,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import Visibility from '@mui/icons-material/Visibility';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faCalendar } from '@fortawesome/free-solid-svg-icons';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time?: string;
  creative_name?: string; // Made optional to handle CreativeService type
  color: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  creative_user_id?: string;
  requires_booking?: boolean;
  payment_option?: 'upfront' | 'split' | 'later';
  split_deposit_amount?: number;
  // Creative profile information
  creative_display_name?: string;
  creative_title?: string;
  creative_avatar_url?: string;
  // Service photos
  photos?: Array<{
    photo_url: string;
    photo_filename?: string;
    photo_size_bytes?: number;
    is_primary: boolean;
    display_order: number;
  }>;
}

export interface ServicesDetailPopoverProps {
  open: boolean;
  onClose: () => void;
  service: ServiceDetail | null;
  context: 'client-connected' | 'invite-page' | 'services-tab' | 'profile-tab' | 'creative-view';
  onBook?: (service: ServiceDetail) => void;
  onCreativeClick?: (creativeData: any) => void;
}

export function ServicesDetailPopover({ 
  open, 
  onClose, 
  service, 
  context,
  onBook,
  onCreativeClick
}: ServicesDetailPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Photo viewer state
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    photo_url: string;
    photo_filename?: string;
    is_primary: boolean;
    display_order: number;
  } | null>(null);

  if (!service) return null;

  // Only show booking button for client context - never for creative views
  const showBookButton = context === 'client-connected' && context !== 'creative-view';

  const handleBook = () => {
    if (onBook && service) {
      onBook(service);
    }
    onClose();
  };

  const handlePhotoClick = (photo: {
    photo_url: string;
    photo_filename?: string;
    is_primary: boolean;
    display_order: number;
  }) => {
    setSelectedPhoto(photo);
    setPhotoViewerOpen(true);
  };

  const handlePhotoViewerClose = () => {
    setPhotoViewerOpen(false);
    setSelectedPhoto(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover mobile menu
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
        pb: 1,
        background: `linear-gradient(135deg, ${service.color || theme.palette.primary.main}15 0%, ${service.color || theme.palette.primary.main}08 100%)`,
        borderBottom: `2px solid ${service.color || theme.palette.primary.main}20`,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${service.color || theme.palette.primary.main} 0%, ${service.color || theme.palette.primary.main}CC 100%)`,
            boxShadow: `0 4px 12px ${service.color || theme.palette.primary.main}30`
          }}>
            <FontAwesomeIcon 
              icon={faGem} 
              style={{ 
                fontSize: '20px', 
                color: 'white' 
              }} 
            />
          </Box>
           <Box sx={{ flex: 1, minWidth: 0 }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
               <Typography variant="h5" fontWeight={700} sx={{ 
                 color: 'text.primary',
                 overflow: 'hidden',
                 textOverflow: 'ellipsis',
                 whiteSpace: 'nowrap',
                 flex: 1
               }}>
                 {service.title}
               </Typography>
               {service.requires_booking && (
                 <Tooltip title="This service requires booking a session" arrow>
                   <Box
                     sx={{
                       display: 'inline-flex',
                       alignItems: 'center',
                       gap: 0.5,
                       px: 1,
                       py: 0.3,
                       borderRadius: 1.5,
                       backgroundColor: '#fef3c7',
                       border: '1px solid #f59e0b',
                       color: '#92400e',
                       fontWeight: 600,
                       fontSize: '0.7rem',
                       letterSpacing: '0.01em',
                       flexShrink: 0,
                       cursor: 'help',
                     }}
                   >
                     <FontAwesomeIcon
                       icon={faCalendar}
                       style={{ fontSize: 10, color: 'inherit' }}
                     />
                     Book
                   </Box>
                 </Tooltip>
               )}
               {service.status && (context === 'services-tab' || context === 'profile-tab') && (
                 <Chip 
                   label={service.status} 
                   size="small"
                   sx={{ 
                     backgroundColor: service.status === 'Public' ? 'success.main' : 
                                    service.status === 'Private' ? 'warning.main' : 'info.main',
                     color: 'white',
                     fontWeight: 600,
                     fontSize: '0.7rem',
                     height: 24,
                     '& .MuiChip-label': {
                       px: 1
                     }
                   }}
                 />
               )}
             </Box>
           </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'text.primary'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

       <DialogContent sx={{ p: 3, flex: 1 }}>
         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
           {/* Creative Information */}
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
                 src={service.creative_avatar_url}
                 sx={{ 
                   width: 48, 
                   height: 48,
                   backgroundColor: service.color || theme.palette.primary.main,
                   fontSize: '1.2rem',
                   fontWeight: 600
                 }}
               >
                 {(service.creative_display_name || service.creative_name || 'Creative').charAt(0).toUpperCase()}
               </Avatar>
               <Box sx={{ flex: 1 }}>
                 <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                   {service.creative_display_name || service.creative_name || 'Creative'}
                 </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                   {service.creative_title || 'Creative Professional'}
                 </Typography>
               </Box>
               {onCreativeClick && (
                 <IconButton
                   onClick={() => {
                     if (onCreativeClick && service) {
                       const creativeData = {
                         id: service.creative_name, // Using creative_name as ID for now
                         name: service.creative_display_name || service.creative_name,
                         avatar: service.creative_avatar_url,
                         specialty: service.creative_title || 'Creative Professional',
                         email: '', // Not available in service data
                         rating: 4.5, // Default rating
                         reviewCount: 0, // Default review count
                         servicesCount: 0, // Default services count
                         isOnline: true, // Default online status
                         color: service.color,
                         status: 'active', // Default status
                         description: `Professional creative offering ${service.title}`,
                         primary_contact: '',
                         secondary_contact: '',
                         availability_location: '',
                         profile_highlights: [],
                         profile_highlight_values: {}
                       };
                       onCreativeClick(creativeData);
                     }
                   }}
                   sx={{
                     color: 'text.secondary',
                     '&:hover': {
                       backgroundColor: 'rgba(0,0,0,0.04)',
                       color: 'text.primary'
                     }
                   }}
                 >
                   <Visibility sx={{ fontSize: 20 }} />
                 </IconButton>
               )}
             </Box>
           </Box>

           {/* Service Description */}
           <Box>
             <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
               Service Description
             </Typography>
             <Typography variant="body1" color="text.secondary" sx={{ 
               lineHeight: 1.6,
               whiteSpace: 'pre-wrap'
             }}>
               {service.description}
             </Typography>
           </Box>

           {/* Service Photos */}
           {service.photos && service.photos.length > 0 && (
             <Box>
               <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                 Service Photos
               </Typography>
               <Box sx={{ 
                 display: 'grid',
                 gridTemplateColumns: {
                   xs: 'repeat(2, 1fr)',
                   sm: service.photos.length === 1 ? '1fr' : 
                       service.photos.length === 2 ? 'repeat(2, 1fr)' :
                       service.photos.length === 3 ? 'repeat(3, 1fr)' :
                       service.photos.length === 4 ? 'repeat(2, 1fr)' :
                       service.photos.length === 5 ? 'repeat(3, 1fr)' :
                       service.photos.length === 6 ? 'repeat(3, 1fr)' :
                       'repeat(3, 1fr)'
                 },
                 gap: 1.5,
                 maxHeight: { xs: '300px', sm: '400px' },
                 overflow: 'hidden'
               }}>
                 {service.photos
                   .sort((a, b) => a.display_order - b.display_order)
                   .slice(0, 6)
                   .map((photo, index) => (
                     <Card
                       key={index}
                       onClick={() => handlePhotoClick(photo)}
                       sx={{
                         position: 'relative',
                         aspectRatio: '1',
                         borderRadius: 2,
                         overflow: 'hidden',
                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                         transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                         cursor: 'pointer',
                         '&:hover': {
                           transform: 'scale(1.02)',
                           boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                           zIndex: 1
                         }
                       }}
                     >
                       <CardMedia
                         component="img"
                         image={photo.photo_url}
                         alt={`Service photo ${index + 1}`}
                         sx={{
                           width: '100%',
                           height: '100%',
                           objectFit: 'cover',
                           transition: 'transform 0.2s ease'
                         }}
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.style.display = 'none';
                         }}
                       />
                       {photo.is_primary && (
                         <Box
                           sx={{
                             position: 'absolute',
                             top: 8,
                             right: 8,
                             backgroundColor: 'rgba(0,0,0,0.7)',
                             color: 'white',
                             px: 1,
                             py: 0.5,
                             borderRadius: 1,
                             fontSize: '0.7rem',
                             fontWeight: 600,
                             backdropFilter: 'blur(4px)'
                           }}
                         >
                           Primary
                         </Box>
                       )}
                     </Card>
                   ))}
               </Box>
             </Box>
           )}

          <Divider />

          {/* Service Details */}
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
              Service Details
            </Typography>
             <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
               {/* Price */}
               <Box sx={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: 2,
                 p: 2,
                 borderRadius: 2,
                 backgroundColor: 'rgba(76, 175, 80, 0.08)',
                 border: '1px solid rgba(76, 175, 80, 0.2)',
                 flex: 1,
                 minWidth: '200px'
               }}>
                 <Box sx={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   width: 40,
                   height: 40,
                   borderRadius: 1.5,
                   backgroundColor: 'success.main',
                   color: 'white'
                 }}>
                   <AttachMoneyIcon sx={{ fontSize: 20 }} />
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                     Price
                   </Typography>
                   <Typography variant="h6" fontWeight={600} sx={{ color: 'success.main' }}>
                     ${(service.price || 0).toLocaleString()}
                   </Typography>
                 </Box>
               </Box>

               {/* Delivery Time */}
               {service.delivery_time && service.delivery_time.trim() && (
                 <Box sx={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: 2,
                   p: 2,
                   borderRadius: 2,
                   backgroundColor: 'rgba(33, 150, 243, 0.08)',
                   border: '1px solid rgba(33, 150, 243, 0.2)',
                   flex: 1,
                   minWidth: '200px'
                 }}>
                   <Box sx={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     width: 40,
                     height: 40,
                     borderRadius: 1.5,
                     backgroundColor: 'primary.main',
                     color: 'white'
                   }}>
                     <AccessTimeIcon sx={{ fontSize: 20 }} />
                   </Box>
                   <Box sx={{ flex: 1 }}>
                     <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                       Delivery Time
                     </Typography>
                     <Typography variant="h6" fontWeight={600} sx={{ color: 'primary.main' }}>
                       {service.delivery_time}
                     </Typography>
                   </Box>
                 </Box>
               )}

              {/* Booking Type removed: single booking flow now */}

            </Box>

            {/* Payment Option - Full Width at Bottom */}
            {service.payment_option && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                mt: 2,
                borderRadius: 2,
                backgroundColor: service.payment_option === 'split' ? 'rgba(156, 39, 176, 0.08)' : 
                                service.payment_option === 'upfront' ? 'rgba(255, 152, 0, 0.08)' : 
                                'rgba(96, 125, 139, 0.08)',
                border: service.payment_option === 'split' ? '1px solid rgba(156, 39, 176, 0.2)' : 
                       service.payment_option === 'upfront' ? '1px solid rgba(255, 152, 0, 0.2)' : 
                       '1px solid rgba(96, 125, 139, 0.2)',
                width: '100%'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  backgroundColor: service.payment_option === 'split' ? '#9c27b0' : 
                                 service.payment_option === 'upfront' ? '#ff9800' : 
                                 '#607d8b',
                  color: 'white'
                }}>
                  <PaymentIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Payment Option
                  </Typography>
                  <Typography variant="h6" fontWeight={600} sx={{ 
                    color: service.payment_option === 'split' ? '#9c27b0' : 
                           service.payment_option === 'upfront' ? '#ff9800' : 
                           '#607d8b',
                    mb: service.payment_option === 'split' ? 0.5 : 0
                  }}>
                    {service.payment_option === 'upfront' ? 'Payment Upfront' : 
                     service.payment_option === 'split' ? 'Split Payment' : 
                     'Payment Later'}
                  </Typography>
                  {service.payment_option === 'split' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.75rem', 
                        color: '#9c27b0',
                        fontWeight: 500
                      }}>
                        Upfront: ${(() => {
                          const depositAmount = service.split_deposit_amount ?? (service.price * 0.5);
                          return depositAmount.toFixed(2);
                        })()}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.75rem', 
                        color: '#9c27b0',
                        fontWeight: 500
                      }}>
                        Later: ${(() => {
                          const depositAmount = service.split_deposit_amount ?? (service.price * 0.5);
                          const remainingAmount = service.price - depositAmount;
                          return remainingAmount.toFixed(2);
                        })()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
           </Box>
        </Box>
      </DialogContent>

      {showBookButton && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleBook}
            variant="contained"
            size="large"
            fullWidth
            startIcon={<BookOnlineIcon />}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${service.color || theme.palette.primary.main} 0%, ${service.color || theme.palette.primary.main}CC 100%)`,
              boxShadow: `0 4px 12px ${service.color || theme.palette.primary.main}30`,
              '&:hover': {
                background: `linear-gradient(135deg, ${service.color || theme.palette.primary.main}CC 0%, ${service.color || theme.palette.primary.main} 100%)`,
                boxShadow: `0 6px 16px ${service.color || theme.palette.primary.main}40`,
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Book This Service
          </Button>
        </DialogActions>
      )}

      {/* Photo Viewer Modal */}
      <Modal
        open={photoViewerOpen}
        onClose={handlePhotoViewerClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(4px)'
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Fade in={photoViewerOpen}>
          <Box
            sx={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={handlePhotoViewerClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Photo */}
            {selectedPhoto && (
              <Box
                component="img"
                src={selectedPhoto.photo_url}
                alt="Enlarged service photo"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}

            {/* Photo Info */}
            {selectedPhoto && (
              <Box
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  color: 'white'
                }}
              >
                {selectedPhoto.is_primary && (
                  <Chip
                    label="Primary Photo"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      mb: 1,
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                )}
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {selectedPhoto.photo_filename || 'Service Photo'}
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Dialog>
  );
}
