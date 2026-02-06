export interface OnboardingStatus {
  completed: boolean;
  current_step: number;
  skipped_sections: string[];
  last_seen_at: string | null;
  version: string;
  mini_tours: Record<string, boolean>;
}

export interface UpdateProgressRequest {
  step: number;
}

export interface SkipSectionRequest {
  section: string;
}

export interface CompleteMiniTourRequest {
  tour_id: string;
}

export interface RestartMiniTourRequest {
  tour_id: string;
}

// Tour step interface for react-joyride
export interface TourStep {
  target: string;
  content: {
    title: string;
    description: string;
  };
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  section?: string;
  route?: string;
  search?: string;
  disableBeacon?: boolean;
  offset?: number;
  spotlightPadding?: number;
  illustration?: 'service' | 'profile' | 'stripe';
}

// Mini-tour configuration
export interface MiniTourConfig {
  id: string;
  name: string;
  route: string;
  steps: TourStep[];
}
