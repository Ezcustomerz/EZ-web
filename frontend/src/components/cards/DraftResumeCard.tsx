import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import DraftsIcon from '@mui/icons-material/Drafts';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { getRelativeTime } from '../../utils/serviceDraftManager';

export interface DraftResumeCardProps {
  activeStep: number;
  totalSteps: number;
  stepName: string;
  timestamp: number;
  title?: string;
  price?: string;
  photoCount?: number;
  onResume: () => void;
  onDiscard: () => void;
}

const steps = [
  'Service Details',
  'Pricing & Delivery',
  'Upload Photos',
  'Calendar Scheduling',
  'Customization & Review'
];

export function DraftResumeCard({
  activeStep,
  totalSteps,
  stepName,
  timestamp,
  title,
  price,
  photoCount = 0,
  onResume,
  onDiscard,
}: DraftResumeCardProps) {
  const progress = ((activeStep + 1) / totalSteps) * 100;
  const relativeTime = getRelativeTime(timestamp);

  return (
    <Card
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '2px solid',
        borderColor: 'transparent',
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -2,
          borderRadius: 2,
          padding: '2px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '&:hover': {
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
          transform: 'translateY(-2px)',
        },
        '@keyframes pulse': {
          '0%, 100%': {
            opacity: 0.6,
          },
          '50%': {
            opacity: 1,
          },
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with Icon and Time */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                animation: 'pulse-icon 2s ease-in-out infinite',
                '@keyframes pulse-icon': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                  },
                },
              }}
            >
              <DraftsIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                Resume Your Draft
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Saved {relativeTime}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Chip
            label={`Step ${activeStep + 1}/${totalSteps}`}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {stepName}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#667eea' }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          />
        </Box>

        {/* Preview Section */}
        {(title || price || photoCount > 0) && (
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: 1.5,
              backgroundColor: 'rgba(102, 126, 234, 0.05)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
              Draft Preview
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {title && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Title:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {title}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {price && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ${price}
                    </Typography>
                  </Box>
                )}
                
                {photoCount > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhotoLibraryIcon sx={{ fontSize: 16, color: 'info.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                      {photoCount} photo{photoCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PlayArrowIcon />}
            onClick={onResume}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: 600,
              py: 1.2,
              borderRadius: 1.5,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
              },
            }}
          >
            Resume Draft
          </Button>
          
          <Button
            variant="text"
            startIcon={<DeleteOutlineIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onDiscard();
            }}
            sx={{
              color: 'error.main',
              fontWeight: 600,
              py: 1.2,
              px: 2,
              borderRadius: 1.5,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
              },
            }}
          >
            Discard
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
