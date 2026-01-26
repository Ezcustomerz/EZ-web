import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box, 
  useTheme, 
  useMediaQuery, 
  Slide,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { DraftResumeCard } from '../../cards/DraftResumeCard';
import { hasDraft, loadDraft, clearDraft } from '../../../utils/serviceDraftManager';
import { successToast } from '../../toast/toast';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface ServiceCreationPopoverProps {
  open: boolean;
  onClose: () => void;
  onCreateService: () => void;
  onCreateBundle: () => void;
  onResumeDraft?: () => void;
}

export function ServiceCreationPopover({ 
  open, 
  onClose, 
  onCreateService, 
  onCreateBundle,
  onResumeDraft
}: ServiceCreationPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [draftExists, setDraftExists] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);

  // Check for draft when popover opens
  useEffect(() => {
    if (open) {
      const exists = hasDraft();
      setDraftExists(exists);
      if (exists) {
        const draft = loadDraft();
        setDraftData(draft);
      }
    }
  }, [open]);
  
  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'service-draft' && open) {
        // Draft was updated or deleted in another tab
        if (e.newValue === null) {
          // Draft was deleted
          setDraftExists(false);
          setDraftData(null);
        } else if (e.newValue) {
          // Draft was updated
          try {
            const draft = JSON.parse(e.newValue);
            setDraftExists(true);
            setDraftData(draft);
          } catch (error) {
            console.error('Failed to parse draft from storage event:', error);
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [open]);

  const handleResumeDraft = () => {
    if (onResumeDraft) {
      onResumeDraft();
      onClose();
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraftExists(false);
    setDraftData(null);
    successToast('Draft discarded successfully');
  };

  const steps = [
    'Service Details',
    'Pricing & Delivery',
    'Upload Photos',
    'Calendar Scheduling',
    'Customization & Review'
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      sx={{
        zIndex: isMobile ? 10000 : 1300, // Higher z-index on mobile to cover mobile menu
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: isMobile ? '100dvh' : 'auto',
            maxHeight: isMobile ? '100dvh' : '520px',
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
        flexShrink: 0
      }}>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Create New Service or Bundle
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose what you'd like to create for your clients
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: { xs: 2, sm: 3 },
        flex: '1 1 auto',
        overflowY: 'auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Draft Resume Card */}
        {draftExists && draftData && (
          <Box sx={{ mb: 3 }}>
            <DraftResumeCard
              activeStep={draftData.activeStep}
              totalSteps={5}
              stepName={steps[draftData.activeStep] || 'Service Details'}
              timestamp={draftData.timestamp}
              title={draftData.formData?.title}
              price={draftData.formData?.price}
              photoCount={draftData.photoData?.length || 0}
              onResume={handleResumeDraft}
              onDiscard={handleDiscardDraft}
            />
          </Box>
        )}

        <Box sx={{ 
          display: 'grid',
          gap: { xs: 2, sm: 3 },
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          mt: { xs: 0.5, sm: 1 }
        }}>
          {/* Service Card */}
          <Card
            onClick={onCreateService}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '2px solid',
              borderColor: 'divider',
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
                transform: 'translateY(-4px) scale(1.02)',
              }
            }}
          >
            <CardContent sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center',
              height: '100%',
              minHeight: 200
            }}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              }}>
                <FontAwesomeIcon 
                  icon={faGem} 
                  style={{ 
                    fontSize: '28px', 
                    color: '#fff' 
                  }} 
                />
              </Box>
              
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: 1
              }}>
                Create Service
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ 
                lineHeight: 1.5,
                mb: 2
              }}>
                Create a single service offering
              </Typography>
            </CardContent>
          </Card>

          {/* Bundle Card */}
          <Card
            onClick={onCreateBundle}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '2px solid',
              borderColor: 'divider',
              borderRadius: 2,
              '&:hover': {
                borderColor: 'secondary.main',
                boxShadow: '0 8px 32px rgba(245, 87, 108, 0.15)',
                transform: 'translateY(-4px) scale(1.02)',
              }
            }}
          >
            <CardContent sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center',
              height: '100%',
              minHeight: 200
            }}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
              }}>
                <FontAwesomeIcon 
                  icon={faLayerGroup} 
                  style={{ 
                    fontSize: '28px', 
                    color: '#fff' 
                  }} 
                />
              </Box>
              
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: 1
              }}>
                Create Bundle
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ 
                lineHeight: 1.5,
                mb: 2
              }}>
                Combine multiple services into a package deal
              </Typography>

            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
