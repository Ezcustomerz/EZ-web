import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Button, Box, Typography, Chip, Divider, FormControl, Select, MenuItem, useTheme, useMediaQuery, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Review } from '../../views/producer/tabs/ProfileTab';
import { ReviewCard } from '../cards/producer/ReviewCard';
import { useState } from 'react';
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface ReviewPopoverProps {
  open: boolean;
  onClose: () => void;
  reviews: Review[];
}

export function ReviewPopover({ open, onClose, reviews }: ReviewPopoverProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const serviceOptions = ['All', ...Array.from(new Set((reviews ?? []).map((r: Review) => r.service)))];
  const filteredReviews = (reviews ?? []).filter((r: Review) => {
    const starMatch = starFilter ? Math.floor(r.rating) === starFilter : true;
    const serviceMatch = serviceFilter === 'All' ? true : r.service === serviceFilter;
    return starMatch && serviceMatch;
  });
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      fullScreen={isMobile}
      slots={{ transition: Transition }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            p: 0,
            backgroundColor: '#fff',
            boxShadow: theme.shadows[8],
            height: isMobile ? '100dvh' : '700px', // Fixed height
            maxHeight: isMobile ? '100dvh' : '700px',
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
            }),
          },
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.32)' } }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0, mb: 0, flexShrink: 0 }}>
        All Reviews
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{
        p: { xs: 1, sm: 2 },
        px: { xs: 2.5, sm: 2 },
        flex: '1 1 auto',
        overflowY: 'auto',
        minHeight: 0,
        maxHeight: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#fff',
          borderBottom: '1.5px solid #eee',
          minHeight: 48,
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: '#fff',
            zIndex: -1,
            pointerEvents: 'none',
          },
          mx: { xs: -2.5, sm: -2 },
          px: { xs: 2.5, sm: 2 },
          flexShrink: 0,
        }}>
          <Typography variant="body2" sx={{ mr: 1 }}>Filter:</Typography>
          {[5, 4, 3, 2, 1].map((star: number) => (
            <Chip
              key={star}
              label={star + '★'}
              color={starFilter === star ? 'primary' : 'default'}
              onClick={() => setStarFilter(starFilter === star ? null : star)}
              size="small"
            />
          ))}
          <Chip
            label="All Stars"
            color={starFilter === null ? 'primary' : 'default'}
            onClick={() => setStarFilter(null)}
            size="small"
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value as string)}
              displayEmpty
            >
              {serviceOptions.map((opt: string) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, flex: 1 }}>
          {filteredReviews.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Typography variant="body2" color="text.secondary">No reviews found.</Typography>
            </Box>
          ) : (
            filteredReviews.map((r: Review) => <ReviewCard key={r.id} review={r} />)
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ py: 1, px: { xs: 1, sm: 2 }, minHeight: 0, height: 'auto', boxSizing: 'border-box', justifyContent: 'flex-end', flex: '0 0 auto', overflow: 'visible', alignItems: 'center', margin: 0, border: 'none', flexShrink: 0 }}>
        <Button onClick={onClose} size="small">Close</Button>
      </DialogActions>
    </Dialog>
  );
} 