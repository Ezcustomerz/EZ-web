import { Box } from '@mui/material';
import { LayoutAdvocate } from '../../layout/advocate/LayoutAdvocate';
import { WelcomeCard } from '../../components/cards/advocate/WelcomeCard';
import { ReferralLinkCard } from '../../components/cards/advocate/ReferralLinkCard';
import { ProgressCard } from '../../components/cards/advocate/ProgressCard';
export function DashAdvocate() {
  const handleRewardfulClick = () => {
    // No action for now as requested
  };

    return (
    <LayoutAdvocate selectedNavItem="dashboard">
      {({ isSidebarOpen: _isSidebarOpen, isMobile: _isMobile, advocateProfile: _advocateProfile }) => (
        <Box sx={{
        px: { xs: 1.5, sm: 1.5, md: 2.5 },
        pt: { xs: 1.5, sm: 1.5, md: 2.5 },
        pb: { xs: 1.5, sm: 1.5, md: 0.5 },
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'auto', md: '100vh' },
        overflow: { xs: 'visible', md: 'hidden' },
        animation: 'pageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '@keyframes pageSlideIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}>
        <WelcomeCard 
          userName={advocateProfile?.display_name || "Demo User"}
          userRole="Advocate"
          tierLabel={advocateProfile ? `${advocateProfile.tier} • ${advocateProfile.active_referrals}%` : "Silver • 18%"}
          onRewardfulClick={handleRewardfulClick}
        />
        
        <ReferralLinkCard />
        
        <ProgressCard />
      </Box>
      )}
    </LayoutAdvocate>
  );
}


