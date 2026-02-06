import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import type { OnboardingStatus } from '../types/onboarding';
import * as onboardingService from '../api/onboardingService';

interface OnboardingContextType {
  // Status
  status: OnboardingStatus | null;
  isLoading: boolean;
  
  // Welcome modal state
  showWelcomeModal: boolean;
  dismissWelcomeModal: (skipTour?: boolean) => void;
  
  // Main tour state
  isMainTourActive: boolean;
  currentStep: number;
  needsSettingsOpen: boolean;
  settingsSection: 'billing' | 'storage' | null;
  needsInviteOpen: boolean;
  
  // Main tour actions
  startMainTour: () => void;
  stopMainTour: () => void;
  updateProgress: (step: number) => Promise<void>;
  completeMainTour: () => Promise<void>;
  skipSection: (section: string) => Promise<void>;
  restartMainTour: () => Promise<void>;
  setNeedsSettingsOpen: (needs: boolean, section?: 'billing' | 'storage' | null) => void;
  setNeedsInviteOpen: (needs: boolean) => void;
  
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
  const navigate = useNavigate();
  const { userProfile, isAuthenticated } = useAuth();
  
  // Backend status
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Main tour state
  const [isMainTourActive, setIsMainTourActive] = useState(false);
  const [needsSettingsOpen, setNeedsSettingsOpenState] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'billing' | 'storage' | null>(null);
  const [needsInviteOpen, setNeedsInviteOpenState] = useState(false);
  
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

  // Clear settings and invite state when tour is not active
  useEffect(() => {
    if (!isMainTourActive) {
      setNeedsSettingsOpenState(false);
      setSettingsSection(null);
      setNeedsInviteOpenState(false);
    }
  }, [isMainTourActive]);

  // Auto-show welcome modal for first-time users on dashboard
  useEffect(() => {
    if (
      isAuthenticated &&
      userProfile?.roles?.includes('creative') &&
      status && // Status loaded
      !status.completed && // Tour not completed
      !showWelcomeModal &&
      !isMainTourActive &&
      window.location.pathname === '/creative'
    ) {
      // Check localStorage to see if they've seen it before
      const hasSeenBefore = localStorage.getItem('onboarding_welcome_shown') === 'true';
      
      if (!hasSeenBefore) {
        // Show welcome modal after a brief delay
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
          localStorage.setItem('onboarding_welcome_shown', 'true');
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, userProfile, status, showWelcomeModal, isMainTourActive]);

  // Main tour actions
  const completeMainTour = useCallback(async () => {
    try {
      const newStatus = await onboardingService.completeMainTour();
      setStatus(newStatus);
      setIsMainTourActive(false);
    } catch (error) {
      console.error('Failed to complete main tour:', error);
    }
  }, []);

  // Welcome modal actions
  const dismissWelcomeModal = useCallback((skipTour: boolean = false) => {
    setShowWelcomeModal(false);
    
    if (!skipTour) {
      // Clear any stored tab preference to ensure Services tab opens
      localStorage.removeItem('public-active-tab');
      
      // Navigate to Services tab explicitly (tab=0)
      navigate('/creative/public?tab=0', { replace: true });
      
      // Poll for the target element to exist before starting tour
      const firstTarget = '[data-tour="create-service-card"]';
      let attempts = 0;
      const maxAttempts = 20; // Max 2 seconds (20 * 100ms)
      
      console.log('🎯 Starting tour - looking for:', firstTarget);
      
      const checkInterval = setInterval(() => {
        const targetElement = document.querySelector(firstTarget);
        attempts++;
        
        console.log(`🔍 Attempt ${attempts}: Target ${targetElement ? 'FOUND' : 'not found'}`);
        
        if (targetElement || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          if (targetElement) {
            console.log('✅ Target found! Starting tour...');
            setIsMainTourActive(true);
          } else {
            console.warn('❌ Tour target not found after waiting 2 seconds');
            console.log('Current URL:', window.location.href);
            console.log('Current tab:', document.querySelector('[role="tabpanel"]'));
          }
        }
      }, 100);
    } else {
      // Mark tour as completed if they skip
      completeMainTour();
    }
  }, [completeMainTour, navigate]);

  // More main tour actions
  const startMainTour = useCallback(() => {
    setIsMainTourActive(true);
  }, []);

  const stopMainTour = useCallback(() => {
    setIsMainTourActive(false);
    setNeedsSettingsOpenState(false);
    setSettingsSection(null);
    setNeedsInviteOpenState(false);
  }, []);

  const setNeedsSettingsOpen = useCallback((needs: boolean, section: 'billing' | 'storage' | null = null) => {
    setNeedsSettingsOpenState(needs);
    setSettingsSection(section);
  }, []);

  const setNeedsInviteOpen = useCallback((needs: boolean) => {
    setNeedsInviteOpenState(needs);
  }, []);

  const updateProgress = useCallback(async (step: number) => {
    try {
      const newStatus = await onboardingService.updateMainTourProgress(step);
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to update progress:', error);
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
      // Reset localStorage
      localStorage.removeItem('onboarding_welcome_shown');
      // Ensure we start from the beginning
      setIsMainTourActive(false);
      // Show welcome modal
      setTimeout(() => {
        setShowWelcomeModal(true);
        localStorage.setItem('onboarding_welcome_shown', 'true');
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
    
    // Welcome modal state
    showWelcomeModal,
    dismissWelcomeModal,
    
    // Main tour state
    isMainTourActive,
    currentStep: status?.current_step ?? 0,
    needsSettingsOpen,
    settingsSection,
    needsInviteOpen,
    
    // Main tour actions
    startMainTour,
    stopMainTour,
    updateProgress,
    completeMainTour,
    skipSection,
    restartMainTour,
    setNeedsSettingsOpen,
    setNeedsInviteOpen,
    
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
