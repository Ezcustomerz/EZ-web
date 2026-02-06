import type { TourStep } from '../types/onboarding';

/**
 * Main onboarding tour - 4 Steps to Get Started
 * Guides new creative users through essential setup actions
 */
export const mainTourSteps: TourStep[] = [
  // Step 1: Create a Service
  {
    target: '[data-tour="create-service-card"]',
    content: {
      title: 'Create Your First Service',
      description: 'Click here to create your first service. Define what you offer, set your pricing, delivery times, and service details to start attracting clients.',
    },
    placement: 'right',
    section: 'setup',
    route: '/creative/public',
    disableBeacon: true,
    spotlightPadding: 8,
    illustration: 'service',
  },

  // Step 2: Fill in Your Profile
  {
    target: '[data-tour="profile-info-card"]',
    content: {
      title: 'Complete Your Profile',
      description: 'Fill out your profile with a bio, profile picture, and portfolio. A complete profile helps clients trust you and increases your chances of getting booked.',
    },
    placement: 'right',
    section: 'setup',
    route: '/creative/public',
    search: '?tab=2',
    disableBeacon: true,
    spotlightPadding: 8,
    offset: 10,
    illustration: 'profile',
  },

  // Step 3: Connect Payouts
  {
    target: '[data-tour="settings-payouts"]',
    content: {
      title: 'Connect Your Bank Account',
      description: 'If you already have a Stripe account, connect it here. If not, click "Connect Bank Account" to create one with Stripe and start receiving payments.',
    },
    placement: 'left',
    section: 'setup',
    route: '/creative',
    disableBeacon: true,
    illustration: 'stripe',
    spotlightPadding: 0,
  },

  // Step 4: Start Making Money
  {
    target: '[data-tour="invite-client-popup"]',
    content: {
      title: 'Start Making Money!',
      description: 'This is your unique link that clients use to view your profile and book your services. Share it anywhere - clients don\'t need to create an account to book you!',
    },
    placement: 'left',
    section: 'setup',
    route: '/creative',
    disableBeacon: true,
    spotlightPadding: 20,
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
