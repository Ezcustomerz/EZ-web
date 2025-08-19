import { Card, CardContent, Box, Avatar, Typography, useTheme, Chip, Rating } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import type { Review } from '../../../views/creative/tabs/ProfileTab';

export function ReviewCard({ review }: { review: Review }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        minHeight: { xs: 135, sm: 170 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 1.5,
        boxShadow: '0px 1.5px 6px rgba(59,130,246,0.05)',
        p: { xs: 1.2, sm: 1.6 },
        transition: 'box-shadow 0.18s, transform 0.18s',
        cursor: 'pointer',
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          boxShadow: `0 4px 16px ${theme.palette.primary.main}20`,
          transform: 'scale(1.035) translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Reviewer Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              mr: 1.5,
              bgcolor: theme.palette.primary.main,
            }}
          >
            {review.reviewerAvatar ? (
              <img src={review.reviewerAvatar} alt={review.reviewerName} />
            ) : (
              <PersonIcon sx={{ fontSize: 16 }} />
            )}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
              }}
            >
              {review.reviewerName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem',
              }}
            >
              {new Date(review.date).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        {/* Rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Rating
            value={review.rating}
            readOnly
            size="small"
            sx={{
              '& .MuiRating-iconFilled': {
                color: theme.palette.primary.main,
              },
              '& .MuiRating-iconHover': {
                color: theme.palette.primary.main,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ ml: 0.5, color: theme.palette.text.secondary }}
          >
            {review.rating}/5
          </Typography>
        </Box>
        {/* Service Chip */}
        <Chip
          label={review.service}
          size="small"
          sx={{
            mb: 0.5,
            bgcolor: theme.palette.primary.main + '10',
            color: theme.palette.primary.main,
            fontWeight: 500,
            height: 20,
            fontSize: '0.7rem',
            px: 1.2,
            alignSelf: 'flex-start',
            borderRadius: 2,
          }}
        />
        {/* Review Text */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            lineHeight: 1.4,
            fontSize: '0.8rem',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 4, sm: 3 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexGrow: 1,
          }}
        >
          {review.review}
        </Typography>
      </CardContent>
    </Card>
  );
} 