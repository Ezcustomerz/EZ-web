import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth';
import type { OnboardingStatus } from '../types/onboarding';
import * as onboardingService from '../api/onboardingService';

interface OnboardingContextType {
  // Status
  status: OnboardingStatus | null;
  isLoading: boolean;
  
  // Main tour state
  isMainTourActive: boolean;
  currentStep: number;
  needsSettingsOpen: boolean;
  settingsSection: 'billing' | 'storage' | null;
  
  // Main tour actions
  startMainTour: () => void;
  stopMainTour: () => void;
  updateProgress: (step: number) => Promise<void>;
  completeMainTour: () => Promise<void>;
  skipSection: (section: string) => Promise<void>;
  restartMainTour: () => Promise<void>;
  setNeedsSettingsOpen: (needs: boolean, section?: 'billing' | 'storage' | null) => void;
  
  // Mini tours state
  activeMiniTour: string | null;
  
  // Mini tours actions
  startMiniTour: (tourId: string) => void;
  stopMiniTour: () => void;
  completeMiniTour: (tourId: string) => Promise<void>;
  restartMiniTour: (tourId: string) => Promise<void>;
  isMiniTourCompleted: (tourId: string) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { userProfile, isAuthenticated } = useAuth();
  
  // Backend status
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Main tour state
  const [isMainTourActive, setIsMainTourActive] = useState(false);
  const [hasShownTourThisSession, setHasShownTourThisSession] = useState(false);
  const [needsSettingsOpen, setNeedsSettingsOpenState] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'billing' | 'storage' | null>(null);
  
  // Mini tour state
  const [activeMiniTour, setActiveMiniTour] = useState<string | null>(null);

  // Fetch onboarding status from backend
  useEffect(() => {
    async function fetchStatus() {
      if (!isAuthenticated || !userProfile?.roles?.includes('creative')) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await onboardingService.getOnboardingStatus();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [isAuthenticated, userProfile]);

  // Auto-start main tour for first-time users on dashboard
  useEffect(() => {
    if (
      isAuthenticated &&
      userProfile?.roles?.includes('creative') &&
      status && // Status loaded
      !status.completed && // Tour not completed
      !hasShownTourThisSession && // Haven't shown tour yet this session
      !isMainTourActive &&
      window.location.pathname === '/creative'
    ) {
      // Auto-start after a brief delay
      const timer = setTimeout(() => {
        setIsMainTourActive(true);
        setHasShownTourThisSession(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userProfile, status, hasShownTourThisSession, isMainTourActive]);

  // Main tour actions
  const startMainTour = useCallback(() => {
    setIsMainTourActive(true);
    setHasShownTourThisSession(true);
  }, []);

  const stopMainTour = useCallback(() => {
    setIsMainTourActive(false);
    setNeedsSettingsOpenState(false);
    setSettingsSection(null);
  }, []);

  const setNeedsSettingsOpen = useCallback((needs: boolean, section: 'billing' | 'storage' | null = null) => {
    setNeedsSettingsOpenState(needs);
    setSettingsSection(section);
  }, []);

  const updateProgress = useCallback(async (step: number) => {
    try {
      const newStatus = await onboardingService.updateMainTourProgress(step);
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }, []);

  const completeMainTour = useCallback(async () => {
    try {
      const newStatus = await onboardingService.completeMainTour();
      setStatus(newStatus);
      setIsMainTourActive(false);
    } catch (error) {
      console.error('Failed to complete main tour:', error);
    }
  }, []);

  const skipSection = useCallback(async (section: string) => {
    try {
      const newStatus = await onboardingService.skipSection(section);
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to skip section:', error);
    }
  }, []);

  const restartMainTour = useCallback(async () => {
    try {
      const newStatus = await onboardingService.restartMainTour();
      setStatus(newStatus);
      // Ensure we start from the beginning
      setIsMainTourActive(false);
      setHasShownTourThisSession(false);
      // Small delay to reset state, then start tour
      setTimeout(() => {
        setIsMainTourActive(true);
        setHasShownTourThisSession(true);
      }, 100);
    } catch (error) {
      console.error('Failed to restart main tour:', error);
    }
  }, []);

  // Mini tour actions
  const startMiniTour = useCallback((tourId: string) => {
    setActiveMiniTour(tourId);
  }, []);

  const stopMiniTour = useCallback(() => {
    setActiveMiniTour(null);
  }, []);

  const completeMiniTour = useCallback(async (tourId: string) => {
    try {
      const newStatus = await onboardingService.completeMiniTour(tourId);
      setStatus(newStatus);
      setActiveMiniTour(null);
    } catch (error) {
      console.error('Failed to complete mini-tour:', error);
    }
  }, []);

  const restartMiniTour = useCallback(async (tourId: string) => {
    try {
      const newStatus = await onboardingService.restartMiniTour(tourId);
      setStatus(newStatus);
      setActiveMiniTour(tourId);
    } catch (error) {
      console.error('Failed to restart mini-tour:', error);
    }
  }, []);

  const isMiniTourCompleted = useCallback((tourId: string) => {
    return status?.mini_tours?.[tourId] === true;
  }, [status]);

  // Context value
  const value: OnboardingContextType = {
    // Status
    status,
    isLoading,
    
    // Main tour state
    isMainTourActive,
    currentStep: status?.current_step ?? 0,
    needsSettingsOpen,
    settingsSection,
    
    // Main tour actions
    startMainTour,
    stopMainTour,
    updateProgress,
    completeMainTour,
    skipSection,
    restartMainTour,
    setNeedsSettingsOpen,
    
    // Mini tours state
    activeMiniTour,
    
    // Mini tours actions
    startMiniTour,
    stopMiniTour,
    completeMiniTour,
    restartMiniTour,
    isMiniTourCompleted,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
