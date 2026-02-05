import React, { useCallback, useEffect, useState } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import type { CallBackProps } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '../../context/onboarding';
import { mainTourSteps, getTotalSteps } from '../../config/mainTourSteps';
import { MainTourTooltip } from './MainTourTooltip';

export function MainTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMainTourActive, stopMainTour, setNeedsSettingsOpen } = useOnboarding();

  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);
  const [skippedSections, setSkippedSections] = useState<string[]>([]);

  // Filter out skipped sections
  const filteredSteps = mainTourSteps.filter(
    (step) => !step.section || !skippedSections.includes(step.section)
  );

  // Start tour when active - simplified
  useEffect(() => {
    if (isMainTourActive) {
      setStepIndex(0);
      setSkippedSections([]);
      const timer = setTimeout(() => setRun(true), 500);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [isMainTourActive]);

  // Handle navigation and settings - ONLY when step changes
  useEffect(() => {
    if (!isMainTourActive || !run || !filteredSteps[stepIndex]) return;
    
    const currentStep = filteredSteps[stepIndex];
    const target = currentStep.target;
    
    console.log(`📍 Navigation Effect - Step ${stepIndex}:`, target);
    
    // Determine target route with query params
    let targetRoute = currentStep.route;
    let targetSearch = '';
    let needsSettingsDelay = false;
    
    if (target === '[data-tour="activity-nav"]') {
      targetRoute = '/creative/activity';
      console.log('→ Navigating to Activity');
    } else if (target === '[data-tour="public-nav"]') {
      targetRoute = '/creative/public';
      console.log('→ Navigating to Public');
    } else if (target === '[data-tour="calendar-tab"]') {
      targetRoute = '/creative/public';
      targetSearch = '?tab=1';
      console.log('→ Navigating to Calendar tab');
    } else if (target === '[data-tour="profile-tab"]') {
      targetRoute = '/creative/public';
      targetSearch = '?tab=2';
      console.log('→ Navigating to Profile tab');
    } else if (target.includes('settings-billing') || target.includes('settings-storage')) {
      needsSettingsDelay = true;
      console.log('→ Opening settings popover');
    }
    
    // Navigate only if needed
    const currentPath = location.pathname + location.search;
    const targetPath = targetRoute + targetSearch;
    if (targetRoute && currentPath !== targetPath) {
      console.log(`🚀 Navigating from ${currentPath} to ${targetPath}`);
      navigate(targetPath, { replace: true });
    }
    
    // Handle settings popover with delay for DOM to render
    if (target.includes('settings-billing')) {
      console.log('⏸️ Pausing tour for billing settings...');
      // Pause tour briefly while popover opens
      setRun(false);
      setNeedsSettingsOpen(true, 'billing');
      // Resume tour after popover has time to render
      setTimeout(() => {
        console.log('▶️ Resuming tour after billing settings opened');
        setRun(true);
      }, 800);
    } else if (target.includes('settings-storage')) {
      console.log('⏸️ Pausing tour for storage settings...');
      setRun(false);
      setNeedsSettingsOpen(true, 'storage');
      setTimeout(() => {
        console.log('▶️ Resuming tour after storage settings opened');
        setRun(true);
      }, 800);
    } else {
      setNeedsSettingsOpen(false);
    }
  }, [stepIndex, run, isMainTourActive, location.pathname, location.search, navigate, setNeedsSettingsOpen]);

  // Handle tour callbacks - simplified
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, action, index, lifecycle } = data;
      
      console.log('🎯 Tour Event:', {
        type,
        action,
        status,
        lifecycle,
        currentIndex: index,
        currentStep: filteredSteps[index]?.target,
        totalSteps: filteredSteps.length
      });

      // Handle step changes
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        const nextIndex = index + 1;
        console.log(`➡️ Moving from step ${index} to ${nextIndex}`);
        if (nextIndex < filteredSteps.length) {
          setStepIndex(nextIndex);
        } else {
          console.log('✅ Tour complete!');
          // Tour complete
          stopMainTour();
          setRun(false);
          setStepIndex(0);
          setSkippedSections([]);
          setNeedsSettingsOpen(false);
        }
      } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        console.log(`⬅️ Going back from step ${index}`);
        setStepIndex(Math.max(0, index - 1));
      }

      // Handle tour close/skip
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        console.log('🛑 Tour closed/finished');
        stopMainTour();
        setRun(false);
        setStepIndex(0);
        setSkippedSections([]);
        setNeedsSettingsOpen(false);
      }

      // Handle target not found - wait longer for settings steps
      if (type === EVENTS.TARGET_NOT_FOUND) {
        const currentStep = filteredSteps[index];
        console.error('❌ TARGET NOT FOUND:', currentStep?.target);
        const isSettingsStep = currentStep?.target.includes('settings-');
        
        if (isSettingsStep) {
          // Settings steps need more time for popover to open
          console.warn('Settings target not found, waiting longer...', currentStep?.target);
          setTimeout(() => {
            if (index + 1 < filteredSteps.length) {
              setStepIndex(index + 1);
            }
          }, 1500);
        } else if (index + 1 < filteredSteps.length) {
          // Regular steps, shorter wait
          console.warn('Regular target not found, trying to continue...', currentStep?.target);
          setTimeout(() => setStepIndex(index + 1), 500);
        }
      }
    },
    [stopMainTour, setNeedsSettingsOpen, filteredSteps]
  );

  // Handle skip section
  const handleSkipSection = useCallback(() => {
    const currentStep = filteredSteps[stepIndex];
    if (!currentStep?.section) return;
    
    setSkippedSections((prev) => [...prev, currentStep.section!]);
    
    // Find next step with different section
    let nextIndex = stepIndex + 1;
    while (
      nextIndex < filteredSteps.length &&
      filteredSteps[nextIndex]?.section === currentStep.section
    ) {
      nextIndex++;
    }
    
    if (nextIndex < filteredSteps.length) {
      setStepIndex(nextIndex);
    } else {
      stopMainTour();
      setRun(false);
    }
  }, [stepIndex, filteredSteps, stopMainTour]);

  // Convert steps to Joyride format
  const joyrideSteps = filteredSteps.map((step) => ({
    target: step.target,
    content: step.content,
    placement: step.placement || 'auto',
    disableBeacon: step.disableBeacon || false,
    offset: (step as any).offset || 10,
    spotlightPadding: (step as any).spotlightPadding || 10,
  }));

  // Custom tooltip
  const renderTooltip = useCallback(
    (props: any) => (
      <MainTourTooltip
        {...props}
        onSkipSection={handleSkipSection}
        currentSection={filteredSteps[stepIndex]?.section}
        totalSteps={getTotalSteps()}
      />
    ),
    [stepIndex, filteredSteps, handleSkipSection]
  );

  if (!isMainTourActive) return null;

  return (
    <Joyride
      steps={joyrideSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress={false}
      showSkipButton={false}
      hideBackButton={false}
      disableOverlayClose={false}
      spotlightClicks={false}
      callback={handleJoyrideCallback}
      tooltipComponent={renderTooltip}
      styles={{
        options: {
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        spotlight: {
          borderRadius: 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        },
      }}
      scrollToFirstStep={true}
      scrollOffset={120}
      disableScrolling={false}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
}
