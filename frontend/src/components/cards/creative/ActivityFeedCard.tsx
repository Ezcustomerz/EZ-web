import { Box, Typography, Card, Chip, useTheme, useMediaQuery } from '@mui/material';
import {
  GraphicEqOutlined,
  PersonAddOutlined,
  Payment,
  Download,
  CheckCircleOutlined,
  History,
} from '@mui/icons-material';
import { ActivityNotificationCard } from '../ActivityNotificationCard';
import type { ActivityItem } from '../../../types/activity';
//smc
import { useNavigate } from 'react-router-dom';



interface ActivityFeedCardProps {
  items?: ActivityItem[];
}

export function ActivityFeedCard({ items }: ActivityFeedCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate(); //smc

  const testNotifications: ActivityItem[] = items ?? [
    {
      icon: GraphicEqOutlined,
      label: 'New Booking',
      description: "Client 'Sarah Wilson' booked your Full Production Package for Dec 15, 2024",
      counterpart: 'Sarah Wilson',
      date: '2 hours ago',
      status: 'booking',
      isNew: true,
    },
    {
      icon: Payment,
      label: 'Payment Received',
      description: 'Payment of $500 received for Mixing & Mastering session',
      counterpart: 'Mike Johnson',
      date: '1 day ago',
      status: 'payment',
      isNew: true,
    },
    {
      icon: Download,
      label: 'File Uploaded',
      description: 'Client uploaded new vocal tracks for revision',
      counterpart: 'Alex Thompson',
      date: '2 days ago',
      status: 'file',
    },
    {
      icon: PersonAddOutlined,
      label: 'New Connection',
      description: "Client 'Emma Davis' connected with your profile",
      counterpart: 'Emma Davis',
      date: '3 days ago',
      status: 'connection',
    },
    {
      icon: CheckCircleOutlined,
      label: 'Session Completed',
      description: "Vocal Recording session with 'David Chen' completed successfully",
      counterpart: 'David Chen',
      date: '1 week ago',
      status: 'completed',
    },
    {
      icon: History,
      label: 'Revision Request',
      description: 'Client requested changes to the final mix',
      counterpart: 'Lisa Rodriguez',
      date: '1 week ago',
      status: 'revision',
    },
    {
      icon: Payment,
      label: 'Payment Pending',
      description: 'Payment of $300 pending for Studio Session',
      counterpart: 'James Wilson',
      date: '2 weeks ago',
      status: 'payment',
    },
    {
      icon: GraphicEqOutlined,
      label: 'New Review',
      description: "Received 5-star review from 'Maria Garcia'",
      counterpart: 'Maria Garcia',
      date: '2 weeks ago',
      status: 'review',
    },
  ];

  const displayItems = testNotifications;
  const actualNewCount = displayItems.filter(n => n.isNew).length;

  return (
    <Card sx={{ 
      position: 'relative', 
      zIndex: 1, 
      flex: isMobile ? 'none' : 1, 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      height: '100%',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: 1,
      p: 3,
      transition: 'all 0.3s ease-in-out',
      animation: 'fadeIn 0.6s ease-out 0.4s both',
      mb: isMobile ? 4 : 0,
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
            Recent Activity
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            Latest updates and interactions
          </Typography>
        </Box>
        {actualNewCount > 0 && (
          <Chip
            label={`${actualNewCount} new`}
            size="small"
            sx={{
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 600,
              height: 24,
              '& .MuiChip-label': { px: 1.2, py: 0.3 },
            }}
          />
        )}
      </Box>

      <Box sx={{ ...(isMobile ? { maxHeight: '400px' } : { flex: 1, minHeight: 0 }), overflowY: displayItems.length === 0 ? 'visible' : 'auto', overflowX: 'visible', px: 2, py: 1, transition: 'all 0.3s ease-in-out', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, '&:hover': { backgroundColor: 'rgba(0,0,0,0.3)' } }, scrollBehavior: 'smooth' }}>
        {displayItems.map((item, index) => (
          <ActivityNotificationCard
            key={`${item.label}-${index}`}
            item={item}
            index={index}
            //smc
            onClick={() => {
              // Customize behavior per notification type
              if (item.label === 'New Booking') {
                navigate('/creative/activity'); // Navigate to activity page
              } else if (item.label === 'Payment Received') {
                navigate('/creative/payments'); // 
              }
              // We can add more cases in the future
            }}
          />
        ))}
      </Box>
    </Card>
  );
} 