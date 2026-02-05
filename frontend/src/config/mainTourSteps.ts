import type { TourStep } from '../types/onboarding';

/**
 * Main onboarding tour - 8 steps across multiple pages
 * Guides new creative users through key features
 */
export const mainTourSteps: TourStep[] = [
  // Step 1: Welcome (Dashboard button)
  {
    target: '[data-tour="dashboard-nav"]',
    content: {
      title: 'Welcome to Your Creative Dashboard!',
      description: 'This is your home base. Let\'s take a quick tour of the key features you\'ll use to manage bookings, showcase your work, and get paid.',
    },
    placement: 'right',
    section: 'intro',
    route: '/creative',
    disableBeacon: true,
    spotlightPadding: 0,
  },

  // Step 2: Activity Navigation (Sidebar)
  {
    target: '[data-tour="activity-nav"]',
    content: {
      title: 'View Your Bookings',
      description: 'Here you can see all your current and past orders from clients. Track progress, manage deliverables, and update order statuses.',
    },
    placement: 'right',
    section: 'bookings',
    route: '/creative/activity',
    disableBeacon: true,
    spotlightPadding: 0,
  },

  // Step 3: Current Orders (Activity Page)
  {
    target: '[data-tour="current-orders"]',
    content: {
      title: 'Manage Your Orders',
      description: 'This is where you\'ll track active bookings, update statuses, and communicate with clients. Each tab shows different views of your work.',
    },
    placement: 'bottom',
    section: 'bookings',
    route: '/creative/activity',
    offset: 20,
    disableBeacon: true,
    spotlightPadding: 8,
  },

  // Step 4: Calendar Access (Sidebar to Public)
  {
    target: '[data-tour="public-nav"]',
    content: {
      title: 'Your Public Profile',
      description: 'Here you can manage your public portfolio and availability calendar that clients see when booking your services.',
    },
    placement: 'right',
    section: 'portfolio',
    route: '/creative/public',
    disableBeacon: true,
    spotlightPadding: 0,
  },

  // Step 5: Calendar Features (Calendar Tab)
  {
    target: '[data-tour="calendar-tab"]',
    content: {
      title: 'Set Your Availability',
      description: 'Use the calendar to block off busy times and let clients see when you\'re available. Manage your sessions and bookings all in one place.',
    },
    placement: 'top',
    section: 'portfolio',
    route: '/creative/public',
    disableBeacon: true,
    spotlightPadding: 4,
  },

  // Step 6: Portfolio (Profile Tab)
  {
    target: '[data-tour="profile-tab"]',
    content: {
      title: 'Your Public Portfolio',
      description: 'This is what clients see - your profile, services, and reviews. Keep it updated to attract more bookings and showcase your best work.',
    },
    placement: 'top',
    section: 'portfolio',
    route: '/creative/public',
    disableBeacon: true,
    spotlightPadding: 4,
  },

  // Step 7: Payment Setup (Settings - Billing)
  {
    target: '[data-tour="settings-billing"]',
    content: {
      title: 'Get Paid',
      description: 'Connect your Stripe account here to receive payments from clients. Set up your banking info to start earning money from your bookings.',
    },
    placement: 'left',
    section: 'settings',
    route: '/creative', // Settings is a popover, so stay on dashboard
    disableBeacon: true,
  },

  // Step 8: Storage Management (Settings - Storage)
  {
    target: '[data-tour="settings-storage"]',
    content: {
      title: 'Monitor Your Storage',
      description: 'Track your file uploads and storage usage here. Upgrade your plan for more space if you need to store more photos, videos, or documents.',
    },
    placement: 'left',
    section: 'settings',
    route: '/creative', // Settings is a popover, so stay on dashboard
    disableBeacon: true,
  },
];

/**
 * Get steps filtered by section
 */
export function getStepsBySection(section: string): TourStep[] {
  return mainTourSteps.filter((step) => step.section === section);
}

/**
 * Get all sections in order
 */
export function getSections(): string[] {
  const sections: string[] = [];
  for (const step of mainTourSteps) {
    if (step.section && !sections.includes(step.section)) {
      sections.push(step.section);
    }
  }
  return sections;
}

/**
 * Get total number of steps
 */
export function getTotalSteps(): number {
  return mainTourSteps.length;
}
