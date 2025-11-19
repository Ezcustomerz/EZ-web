import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Divider,
  Chip,
  Button,
  useTheme,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { DateRange, CalendarToday, CheckCircle, Folder, InsertDriveFile, Download as DownloadIcon } from '@mui/icons-material';
import { useState } from 'react';
import { DownloadOrderDetailPopover, type DownloadOrderDetail, type DownloadPaymentOption, type DownloadFile } from '../../popovers/client/DownloadOrderDetailPopover';

interface DownloadOrderCardProps {
  id: string;
  serviceName: string;
  creativeName: string;
  orderDate: string;
  description: string;
  price: number;
  approvedDate: string | null;
  completedDate: string | null;
  calendarDate: string | null;
  fileCount: number | null;
  fileSize: string | null;
  paymentOption?: DownloadPaymentOption;
  files?: DownloadFile[];
  serviceId?: string;
  serviceDescription?: string;
  serviceDeliveryTime?: string;
  serviceColor?: string;
  creativeAvatarUrl?: string;
  creativeDisplayName?: string;
  creativeTitle?: string;
  creativeId?: string;
  creativeEmail?: string;
  creativeRating?: number;
  creativeReviewCount?: number;
  creativeServicesCount?: number;
  creativeColor?: string;
}

export function DownloadOrderCard({
  id,
  serviceName,
  creativeName,
  orderDate,
  description,
  price,
  approvedDate,
  completedDate,
  calendarDate,
  fileCount,
  fileSize,
  paymentOption = 'payment_upfront',
  files = [],
  serviceId,
  serviceDescription,
  serviceDeliveryTime,
  serviceColor,
  creativeAvatarUrl,
  creativeDisplayName,
  creativeTitle,
  creativeId,
  creativeEmail,
  creativeRating,
  creativeReviewCount,
  creativeServicesCount,
  creativeColor
}: DownloadOrderCardProps) {
  const theme = useTheme();
  const statusColor = '#0097a7';
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open popover if clicking the download button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };

  const orderDetail: DownloadOrderDetail = {
    id,
    serviceName,
    creativeName,
    orderDate,
    description,
    price,
    approvedDate,
    completedDate,
    calendarDate,
    paymentOption,
    files,
    fileCount,
    fileSize,
    serviceId,
    serviceDescription,
    serviceDeliveryTime,
    serviceColor: serviceColor || statusColor,
    creativeAvatarUrl,
    creativeDisplayName,
    creativeTitle,
    creativeId,
    creativeEmail,
    creativeRating,
    creativeReviewCount,
    creativeServicesCount,
    creativeColor,
  };

  return (
    <>
      <Card 
        onClick={handleCardClick} 
      sx={{ 
        borderRadius: 2,
        transition: 'all 0.2s ease',
        border: '2px solid',
        borderColor: 'rgba(0, 151, 167, 0.3)',
        overflow: 'visible',
        minHeight: 'fit-content',
        height: 'auto',
        cursor: 'pointer',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(0, 151, 167, 0.05)'
          : 'rgba(0, 151, 167, 0.02)',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 151, 167, 0.3)'
            : '0 4px 20px rgba(0, 151, 167, 0.2)',
          borderColor: '#0097a7',
          transform: 'translateY(-2px)',
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: theme.palette.primary.main,
              fontSize: '1.2rem',
              fontWeight: 600,
            }}
          >
            {creativeName.charAt(0)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {serviceName}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: statusColor,
                  fontStyle: 'italic',
                  fontSize: '0.7rem',
                }}
              >
                • Creative files are ready to download
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              by {creativeName}
            </Typography>
          </Box>
          
          <Chip
            label="Download"
            size="small"
            sx={{
              bgcolor: statusColor,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
              alignSelf: 'flex-start',
            }}
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Box sx={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 0.5,
          alignItems: 'flex-end',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Ordered On
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DateRange sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {new Date(orderDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Typography>
            </Box>
          </Box>

          {approvedDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Approved On
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DateRange sx={{ fontSize: 16, color: '#4caf50' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(approvedDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          {calendarDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Booking Set For
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(calendarDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} at {new Date(calendarDate).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          {completedDate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Completed On
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(completedDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          )}

          {fileCount && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Files
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Folder sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {fileCount} files
                </Typography>
              </Box>
            </Box>
          )}

          {fileSize && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Size
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InsertDriveFile sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {fileSize}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          <Box sx={{ position: 'relative' }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
              size="small"
              onClick={handleDownload}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 2,
                px: 3,
                height: '40px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                position: 'relative',
                overflow: 'visible',
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                transition: 'all 0.2s ease-in-out',
                minWidth: 'auto',
                zIndex: 1,
                '@keyframes sparkle': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle2': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '60%': { transform: 'scale(1) rotate(240deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle3': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '40%': { transform: 'scale(1) rotate(120deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle4': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '55%': { transform: 'scale(1) rotate(200deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '@keyframes sparkle5': {
                  '0%': { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                  '45%': { transform: 'scale(1) rotate(160deg)', opacity: 1 },
                  '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '15%',
                  left: '20%',
                  width: 5,
                  height: 5,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                  zIndex: 10,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '70%',
                  left: '75%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                  zIndex: 10,
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.5)',
                  '&::before': {
                    animation: 'sparkle 0.5s ease-in-out infinite',
                  },
                  '&::after': {
                    animation: 'sparkle2 0.5s ease-in-out infinite 0.1s',
                  },
                  '& .sparkle-3': {
                    animation: 'sparkle3 0.5s ease-in-out infinite 0.2s',
                  },
                  '& .sparkle-4': {
                    animation: 'sparkle4 0.5s ease-in-out infinite 0.15s',
                  },
                  '& .sparkle-5': {
                    animation: 'sparkle5 0.5s ease-in-out infinite 0.25s',
                  },
                },
              }}
            >
              <Box
                className="sparkle-3"
                sx={{
                  position: 'absolute',
                  top: '30%',
                  right: '25%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
              <Box
                className="sparkle-4"
                sx={{
                  position: 'absolute',
                  top: '60%',
                  left: '35%',
                  width: 5,
                  height: 5,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
              <Box
                className="sparkle-5"
                sx={{
                  position: 'absolute',
                  top: '40%',
                  left: '80%',
                  width: 4,
                  height: 4,
                  background: 'radial-gradient(circle, white, transparent)',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
              Download Files
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>

    <DownloadOrderDetailPopover
      open={popoverOpen}
      onClose={handlePopoverClose}
      order={orderDetail}
      onDownloadProgress={(progress: string) => setDownloadProgress(progress)}
      onDownloadStateChange={(downloading: boolean) => setIsDownloading(downloading)}
    />

    {/* Persistent Download Progress Card */}
    {isDownloading && (
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1400,
          minWidth: 320,
          maxWidth: 400,
          boxShadow: theme.shadows[8],
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(156, 39, 176, 0.1)' 
              : 'rgba(156, 39, 176, 0.05)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <CircularProgress size={24} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Downloading Files
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {serviceName}
              </Typography>
            </Box>
          </Box>
          <LinearProgress sx={{ mt: 1 }} />
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}>
            {downloadProgress || 'Downloading files...'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Please wait while your files are being downloaded. You can continue working while this completes.
          </Typography>
        </Box>
      </Box>
    )}
  </>
  );
}

