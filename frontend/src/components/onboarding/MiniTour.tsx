import React, { useCallback, useEffect, useState } from 'react';
import Joyride, { STATUS, ACTIONS } from 'react-joyride';
import type { CallBackProps } from 'react-joyride';
import { useOnboarding } from '../../context/onboarding';
import { getMiniTour } from '../../config/miniTourSteps';
import { MiniTourTooltip } from './MiniTourTooltip';
import { useTheme } from '@mui/material/styles';

export function MiniTour() {
  const theme = useTheme();
  const { activeMiniTour, stopMiniTour } = useOnboarding();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Get current tour config
  const tourConfig = activeMiniTour ? getMiniTour(activeMiniTour) : null;

  // Start tour when active mini tour changes
  useEffect(() => {
    if (activeMiniTour && tourConfig) {
      setStepIndex(0);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [activeMiniTour, tourConfig]);

  // Handle tour callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action } = data;

      // Handle tour completion or close
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        stopMiniTour();
        setRun(false);
        setStepIndex(0);
      }
    },
    [stopMiniTour]
  );

  if (!activeMiniTour || !tourConfig) {
    return null;
  }

  // Convert our steps to Joyride format
  const joyrideSteps = tourConfig.steps.map((step) => ({
    target: step.target,
    content: step.content,
    placement: step.placement || 'auto',
    disableBeacon: true,
  }));

  // Custom tooltip component
  const renderTooltip = useCallback(
    (props: any) => {
      return <MiniTourTooltip {...props} totalSteps={tourConfig.steps.length} />;
    },
    [tourConfig.steps.length]
  );

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
      disableScrolling={false}
      callback={handleJoyrideCallback}
      tooltipComponent={renderTooltip}
      styles={{
        options: {
          zIndex: 10001, // Higher than main tour
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
        spotlight: {
          borderRadius: 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
        },
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'none',
          },
        },
      }}
    />
  );
}
