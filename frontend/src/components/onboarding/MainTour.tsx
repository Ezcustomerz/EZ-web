import React, { useCallback, useEffect, useState } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import type { CallBackProps } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/onboarding';
import { mainTourSteps, getTotalSteps } from '../../config/mainTourSteps';
import { EnhancedTourCard } from './EnhancedTourCard';
import { WelcomeModal } from './WelcomeModal';
import { CreateServiceIllustration } from './illustrations/CreateServiceIllustration';
import { FillProfileIllustration } from './illustrations/FillProfileIllustration';
import { ConnectStripeIllustration } from './illustrations/ConnectStripeIllustration';

export function MainTour() {
  const navigate = useNavigate();
  const { 
    isMainTourActive, 
    stopMainTour, 
    setNeedsSettingsOpen,
    setNeedsInviteOpen,
    showWelcomeModal,
    dismissWelcomeModal,
    completeMainTour,
  } = useOnboarding();

  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);

  // Start/stop tour - simplified with no delays
  useEffect(() => {
    console.log('🎬 MainTour effect - isMainTourActive:', isMainTourActive);
    
    if (isMainTourActive) {
      console.log('▶️ Starting tour with', mainTourSteps.length, 'steps');
      setStepIndex(0);
      setRun(true);
    } else {
      console.log('⏸️ Stopping tour');
      setRun(false);
      // Clean up settings state when tour stops
      setNeedsSettingsOpen(false);
    }
  }, [isMainTourActive, setNeedsSettingsOpen]);

  // Handle tour callbacks - all logic in one place
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, action, index } = data;
      const currentStep = mainTourSteps[index];
      
      console.log('🎪 Joyride callback:', { status, type, action, index, step: currentStep?.content?.title });

      // Handle step progression
      if (type === EVENTS.STEP_AFTER) {
        if (action === ACTIONS.NEXT) {
          const nextIndex = index + 1;
          
          if (nextIndex < mainTourSteps.length) {
            const nextStep = mainTourSteps[nextIndex];
            
            console.log('➡️ Moving to step', nextIndex + 1, ':', nextStep.content.title);
            
            // Pause tour during navigation
            setRun(false);
            
            // Handle navigation for specific steps
            if (nextStep.target === '[data-tour="profile-info-card"]') {
              console.log('📍 Navigating to Profile tab');
              // Step 2: Navigate to Profile tab
              const route = nextStep.route + (nextStep.search || '');
              navigate(route, { replace: true });
              
              // Wait for target before showing next step
              setTimeout(() => {
                let attempts = 0;
                const checkTarget = setInterval(() => {
                  const target = document.querySelector(nextStep.target);
                  attempts++;
                  if (target) {
                    console.log('✅ Profile target found, showing step');
                    clearInterval(checkTarget);
                    setStepIndex(nextIndex);
                    setRun(true);
                  } else if (attempts >= 20) {
                    console.warn('❌ Profile target not found after 2s');
                    clearInterval(checkTarget);
                    setStepIndex(nextIndex);
                    setRun(true);
                  }
                }, 100);
              }, 300);
              
            } else if (nextStep.target === '[data-tour="settings-payouts"]') {
              console.log('📍 Navigating to Settings - Payouts');
              // Step 3: Navigate to dashboard and open settings to payouts
              navigate('/creative', { replace: true });
              setTimeout(() => {
                setNeedsSettingsOpen(true, 'billing');
                
                // Wait for settings to open AND for all cards to load
                setTimeout(() => {
                  let attempts = 0;
                  const checkTarget = setInterval(() => {
                    // Check for both the main target AND count the cards
                    const mainTarget = document.querySelector(nextStep.target);
                    // Count how many cards are rendered inside the payouts section
                    const allCards = document.querySelectorAll('[data-tour="settings-payouts"] [class*="MuiCard-root"]');
                    
                    attempts++;
                    console.log(`🔍 Checking Step 3 - attempt ${attempts}, cards found: ${allCards.length}`);
                    
                    // Wait for at least 2 cards to appear (Bank + Payout Info or Bank + Important)
                    if ((mainTarget && allCards.length >= 2) || attempts >= 30) {
                      clearInterval(checkTarget);
                      if (mainTarget && allCards.length >= 2) {
                        console.log('✅ Settings content fully loaded, showing step');
                        setStepIndex(nextIndex);
                        setRun(true);
                      } else {
                        console.warn('❌ Settings content not fully loaded after 3s, showing anyway');
                        setStepIndex(nextIndex);
                        setRun(true);
                      }
                    }
                  }, 100);
                }, 800); // Longer initial delay for settings animation + data fetch
              }, 300);
              
            } else if (nextStep.target === '[data-tour="invite-client-popup"]') {
              console.log('📍 Closing settings and opening Invite popup');
              // Step 4: Close settings, then open invite popup and spotlight it
              setNeedsSettingsOpen(false);
              
              // Wait for settings to fully close
              setTimeout(() => {
                navigate('/creative', { replace: true });
                
                // Open the invite popup
                setTimeout(() => {
                  setNeedsInviteOpen(true);
                  
                  // Wait for popup to render, then show tooltip
                  setTimeout(() => {
                    let attempts = 0;
                    const checkTarget = setInterval(() => {
                      const target = document.querySelector(nextStep.target);
                      attempts++;
                      console.log(`🔍 Checking invite popup - attempt ${attempts}, found: ${!!target}`);
                      
                      if (target || attempts >= 20) {
                        clearInterval(checkTarget);
                        if (target) {
                          console.log('✅ Invite popup found, showing tooltip');
                          setStepIndex(nextIndex);
                          setRun(true);
                        } else {
                          console.warn('❌ Invite popup not found after 2s');
                          setStepIndex(nextIndex);
                          setRun(true);
                        }
                      }
                    }, 100);
                  }, 400);
                }, 300);
              }, 800);
              
            } else {
              // No navigation needed, move directly
              console.log('✅ No navigation needed, moving to next step');
              setStepIndex(nextIndex);
              setRun(true);
            }
          } else {
            // Tour complete - popup already opened in Step 4
            console.log('🎉 Tour complete!');
            completeMainTour();
          }
        } else if (action === ACTIONS.PREV) {
          console.log('⬅️ Going back to step', index);
          setStepIndex(Math.max(0, index - 1));
        }
      }

      // Handle tour close/skip
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        console.log('🛑 Tour stopped');
        stopMainTour();
      }

      // Handle target not found
      if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn('⚠️ Target not found for step:', currentStep?.target);
      }
    },
    [navigate, stopMainTour, setNeedsSettingsOpen, setNeedsInviteOpen, completeMainTour]
  );

  // Get illustration for current step
  const getIllustration = (illustrationType?: string) => {
    switch (illustrationType) {
      case 'service':
        return <CreateServiceIllustration />;
      case 'profile':
        return <FillProfileIllustration />;
      case 'stripe':
        return <ConnectStripeIllustration />;
      default:
        return null;
    }
  };

  // Custom tooltip with enhanced card
  const renderTooltip = useCallback(
    (props: any) => {
      const currentStep = mainTourSteps[stepIndex];
      const illustration = getIllustration(currentStep?.illustration);
      
      return (
        <EnhancedTourCard
          {...props}
          illustration={illustration}
          totalSteps={getTotalSteps()}
        />
      );
    },
    [stepIndex]
  );

  // Convert steps to Joyride format
  const joyrideSteps = mainTourSteps.map((step) => ({
    target: step.target,
    content: step.content,
    placement: step.placement || 'auto',
    disableBeacon: true,
    offset: step.offset || 10,
    spotlightPadding: step.spotlightPadding || 10,
  }));

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcomeModal}
        onStart={() => dismissWelcomeModal(false)}
        onSkip={() => dismissWelcomeModal(true)}
      />

      {/* Main Tour */}
      {isMainTourActive && (
        <>
          {console.log('🎭 Rendering Joyride - run:', run, 'stepIndex:', stepIndex, 'steps:', joyrideSteps.length)}
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
              },
            }}
            scrollToFirstStep={true}
            scrollOffset={200}
            disableScrolling={false}
            floaterProps={{
              disableAnimation: true,
            }}
          />
        </>
      )}
    </>
  );
}
