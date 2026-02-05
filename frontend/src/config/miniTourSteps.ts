import type { MiniTourConfig } from '../types/onboarding';

/**
 * Mini-tours - Page-specific guided walkthroughs
 * Each tour focuses on features within a single page
 */

export const miniTours: Record<string, MiniTourConfig> = {
  // Dashboard Tour
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard Tour',
    route: '/creative',
    steps: [
      {
        target: '[data-mini-tour="welcome-card"]',
        content: {
          title: 'Your Dashboard',
          description: 'This is your command center. See quick stats about your bookings, earnings, and recent activity all in one place.',
        },
        placement: 'bottom',
      },
      {
        target: '[data-mini-tour="activity-feed"]',
        content: {
          title: 'Activity Feed',
          description: 'Stay updated with recent orders, client messages, and important notifications. Click any item to view details.',
        },
        placement: 'top',
      },
      {
        target: '[data-mini-tour="quick-actions"]',
        content: {
          title: 'Quick Actions',
          description: 'Access common tasks quickly - create payment requests, manage services, or update your profile without navigating away.',
        },
        placement: 'left',
      },
    ],
  },

  // Activity/Orders Tour
  activity: {
    id: 'activity',
    name: 'Activity & Orders Tour',
    route: '/creative/activity',
    steps: [
      {
        target: '[data-mini-tour="orders-tabs"]',
        content: {
          title: 'Order Views',
          description: 'Switch between Current Orders (active bookings), Past Orders (completed work), and Analytics (your performance metrics).',
        },
        placement: 'bottom',
      },
      {
        target: '[data-mini-tour="orders-table"]',
        content: {
          title: 'Orders List',
          description: 'All your bookings appear here. Each row shows the client, service, amount, and current status. Click any order to see full details.',
        },
        placement: 'top',
      },
      {
        target: '[data-mini-tour="order-status"]',
        content: {
          title: 'Order Status',
          description: 'Track where each booking stands: Pending Approval, Awaiting Payment, In Progress, or Complete. Update statuses as you work.',
        },
        placement: 'left',
      },
      {
        target: '[data-mini-tour="order-actions"]',
        content: {
          title: 'Order Actions',
          description: 'Click any order to view details, upload deliverables, send messages to clients, or mark work as complete.',
        },
        placement: 'left',
      },
      {
        target: '[data-mini-tour="analytics-card"]',
        content: {
          title: 'Your Analytics',
          description: 'Switch to the Analytics tab to see earnings over time, service breakdown, and performance insights to grow your business.',
        },
        placement: 'bottom',
      },
    ],
  },

  // Clients Tour
  clients: {
    id: 'clients',
    name: 'Client Management Tour',
    route: '/creative/clients',
    steps: [
      {
        target: '[data-mini-tour="clients-list"]',
        content: {
          title: 'Your Clients',
          description: 'See all clients who have booked your services. Track your relationship with each client and view their booking history.',
        },
        placement: 'top',
      },
      {
        target: '[data-mini-tour="client-details"]',
        content: {
          title: 'Client Information',
          description: 'Click any client to view contact details, past orders, total revenue, and communication history. Build stronger relationships!',
        },
        placement: 'left',
      },
      {
        target: '[data-mini-tour="client-communication"]',
        content: {
          title: 'Stay Connected',
          description: 'Send messages, schedule follow-ups, and keep notes about each client. Great customer service leads to repeat bookings.',
        },
        placement: 'left',
      },
    ],
  },

  // Public Profile Tour
  public: {
    id: 'public',
    name: 'Public Profile Tour',
    route: '/creative/public',
    steps: [
      {
        target: '[data-mini-tour="profile-tabs"]',
        content: {
          title: 'Your Public Presence',
          description: 'Manage your Profile (what clients see), Services (what you offer), and Calendar (your availability). This is your online storefront!',
        },
        placement: 'bottom',
      },
      {
        target: '[data-mini-tour="profile-card"]',
        content: {
          title: 'Your Profile',
          description: 'This is your professional showcase. Add a great photo, compelling bio, and highlight your best work to attract more clients.',
        },
        placement: 'bottom',
      },
      {
        target: '[data-mini-tour="services-section"]',
        content: {
          title: 'Services You Offer',
          description: 'Add and manage your services here. Set prices, delivery times, and descriptions. Make each service compelling to increase bookings.',
        },
        placement: 'top',
      },
      {
        target: '[data-mini-tour="calendar-view"]',
        content: {
          title: 'Availability Calendar',
          description: 'Set your availability so clients can book sessions when you\'re free. Block off busy times to prevent double-bookings.',
        },
        placement: 'top',
      },
      {
        target: '[data-mini-tour="calendar-actions"]',
        content: {
          title: 'Manage Sessions',
          description: 'Click any day to add available time slots, block off vacation days, or manage existing bookings. Keep your calendar up to date!',
        },
        placement: 'left',
      },
    ],
  },
};

/**
 * Get mini-tour by ID
 */
export function getMiniTour(tourId: string): MiniTourConfig | undefined {
  return miniTours[tourId];
}

/**
 * Get all mini-tour IDs
 */
export function getAllMiniTourIds(): string[] {
  return Object.keys(miniTours);
}

/**
 * Check if a tour ID is valid
 */
export function isValidTourId(tourId: string): boolean {
  return tourId in miniTours;
}
