import { Box, Paper, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { motion, useReducedMotion } from 'framer-motion';
import { memo } from 'react';

type SpinnerSpeed = 'slow' | 'normal' | 'fast';
type SpinnerVariant = 'classic' | 'scratch';
type SpinnerBg = 'transparent' | 'panel';
type SpinnerContrast = 'auto' | 'light' | 'dark';

export type RecordSpinnerProps = {
  size?: number;
  speed?: SpinnerSpeed;
  labelText?: string;
  showNeedle?: boolean;
  variant?: SpinnerVariant;
  bg?: SpinnerBg;
  contrast?: SpinnerContrast;
  ariaLabel?: string;
};

const speedToDuration: Record<SpinnerSpeed, number> = {
  slow: 2.5,
  normal: 1.8,
  fast: 1.2,
};

const Panel = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape?.borderRadius || 4) * 2,
}));

function getVinylBase(themeMode: 'light' | 'dark') {
  return themeMode === 'light' ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.9)';
}

const PRIMARY = '#7A5FFF';
const SECONDARY = '#339BFF';
const ACCENT = '#FFCD38';

function getContrastAlpha(mode: 'light' | 'dark', override: SpinnerContrast) {
  if (override === 'light') return 0.35;
  if (override === 'dark') return 0.6;
  return mode === 'light' ? 0.35 : 0.6;
}

const MotionSVG = motion.svg;

const RecordSpinnerComponent = memo(function RecordSpinner({
  size = 120,
  speed = 'normal',
  labelText,
  showNeedle = true,
  variant = 'classic',
  bg = 'transparent',
  contrast = 'auto',
  ariaLabel = 'Loading',
}: RecordSpinnerProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion() || useMediaQuery('(prefers-reduced-motion: reduce)');
  const duration = speedToDuration[speed];
  const alpha = getContrastAlpha(theme.palette.mode, contrast);
  const vinylBase = getVinylBase(theme.palette.mode);
  const showLabel = !!labelText && size >= 80;

  const spinAnimation = reduceMotion
    ? { opacity: [0.6, 1, 0.6] }
    : { rotate: [0, 360] };

  const spinTransition = reduceMotion
    ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const }
    : { duration, repeat: Infinity, ease: 'linear' as const, repeatType: 'loop' as const };

  // Scratch variant: tiny reverse nudge every ~6s
  const scratchKeyframes = reduceMotion
    ? { opacity: [0.6, 1, 0.6] }
    : { rotate: [0, 360, 357, 364, 360] };
  const scratchTransition = reduceMotion
    ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const }
    : { times: [0, 0.96, 0.975, 0.99, 1], duration, repeat: Infinity, ease: 'linear' as const, repeatType: 'loop' as const };

  const Wrapper = bg === 'panel'
    ? (props: any) => (
        <Panel elevation={theme.palette.mode === 'dark' ? 2 : 0} variant={theme.palette.mode === 'light' ? 'outlined' : undefined} {...props} />
      )
    : (props: any) => <Box {...props} />;

  return (
    <Wrapper
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: bg === 'panel' ? 1.5 : 0,
        bgcolor: 'transparent',
      }}
    >
      <MotionSVG
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        style={{ width: '100%', height: '100%' }}
        layoutId="record-spinner-svg"
        animate={variant === 'scratch' ? scratchKeyframes : spinAnimation}
        transition={variant === 'scratch' ? scratchTransition : spinTransition}
      >
        <defs>
          {/* Radial gradient for vinyl body */}
          <radialGradient id="vinylGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={vinylBase} stopOpacity={1} />
            <stop offset="70%" stopColor={vinylBase} stopOpacity={0.95} />
            <stop offset="100%" stopColor={vinylBase} stopOpacity={0.9} />
          </radialGradient>

          {/* Highlight sweep mask */}
          <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0} />
            <stop offset="40%" stopColor="#fff" stopOpacity={alpha} />
            <stop offset="60%" stopColor="#fff" stopOpacity={alpha * 0.6} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>

          {/* Arc for label text */}
          <path id="labelArc" d="M 30 67 A 20 20 0 0 0 70 67" />
        </defs>

        {/* Outer vinyl disc */}
        <circle cx="50" cy="50" r="48" fill="url(#vinylGrad)" />

        {/* Grooves */}
        {Array.from({ length: 10 }).map((_, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={36 + i * 1.2}
            fill="none"
            stroke="#000"
            strokeOpacity={alpha * 0.5}
            strokeWidth={0.25}
          />
        ))}

        {/* Specular highlight wedge (rotates with disc) */}
        <g style={{ mixBlendMode: 'screen' }}>
          <path d="M10,50 A40,40 0 0 1 50,10" fill="none" stroke="url(#highlightGrad)" strokeWidth={6} />
        </g>

        {/* Center label split */}
        <circle cx="50" cy="50" r="15" fill={PRIMARY} />
        <path d="M50 35 A15 15 0 0 1 50 65 A15 15 0 0 0 50 35" fill={SECONDARY} />

        {/* Accent ring */}
        <circle cx="50" cy="50" r="17" fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={reduceMotion ? 0.85 : 1} />

        {/* Spindle hole */}
        <circle cx="50" cy="50" r="1.2" fill="#333" />
        <circle cx="49.6" cy="49.6" r="0.35" fill="#ddd" />

        {/* Optional curved label text */}
        {showLabel && (
          <text fontSize={3.1} fontWeight={500} letterSpacing={0.6} fill="#fff" opacity={0.9}>
            <textPath href="#labelArc" startOffset="50%" textAnchor="middle">
              {labelText}
            </textPath>
          </text>
        )}

        {/* Tonearm (optional) */}
        {showNeedle && (
          <motion.g
            style={{ originX: 76, originY: 22 }}
            animate={reduceMotion ? {} : { rotate: [0, 0.1, -0.1, 0] }}
            transition={reduceMotion ? {} : { repeat: Infinity, duration: 6.0, ease: 'easeInOut' }}
          >
            {/* Arm */}
            <path d="M76 22 L60 40" stroke="#cfcfcf" strokeWidth={1.6} strokeLinecap="round" />
            {/* Head */}
            <rect x="58.8" y="38.8" width="4.4" height="2.6" rx="0.6" fill="#e8e8e8" stroke="#bdbdbd" strokeWidth={0.4} />
          </motion.g>
        )}
      </MotionSVG>
    </Wrapper>
  );
});

export { RecordSpinnerComponent as RecordSpinner };


