import React from 'react';
import { Box } from '@mui/material';

export function FillProfileIllustration() {
  return (
    <Box
      sx={{
        width: '100%',
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderRadius: '12px 12px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background decorative elements */}
        <circle cx="30" cy="140" r="50" fill="#fbbf24" opacity="0.1" />
        <circle cx="150" cy="30" r="40" fill="#7A5FFF" opacity="0.1" />
        
        {/* Main profile card */}
        <rect x="40" y="20" width="100" height="120" rx="12" fill="white" stroke="#7A5FFF" strokeWidth="2" />
        
        {/* Avatar circle */}
        <circle cx="90" cy="55" r="20" fill="#ede9fe" />
        <circle cx="90" cy="55" r="20" stroke="#7A5FFF" strokeWidth="2" />
        
        {/* Simple face */}
        <circle cx="85" cy="52" r="2" fill="#7A5FFF" />
        <circle cx="95" cy="52" r="2" fill="#7A5FFF" />
        <path d="M 85 62 Q 90 65 95 62" stroke="#7A5FFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Name line */}
        <rect x="55" y="85" width="70" height="8" rx="4" fill="#7A5FFF" />
        
        {/* Bio lines */}
        <rect x="50" y="100" width="80" height="5" rx="2.5" fill="#e5e7eb" />
        <rect x="50" y="110" width="60" height="5" rx="2.5" fill="#e5e7eb" />
        
        {/* Star rating */}
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon
            key={i}
            points="0,-8 2.4,-2.4 8,-2.4 3.6,1.2 5.6,7.2 0,3.6 -5.6,7.2 -3.6,1.2 -8,-2.4 -2.4,-2.4"
            fill="#fbbf24"
            transform={`translate(${60 + i * 12}, 125)`}
          />
        ))}
        
        {/* Edit pencil icon */}
        <circle cx="135" cy="45" r="15" fill="#7A5FFF" />
        <rect x="130" y="40" width="10" height="12" rx="1" fill="white" />
        <polygon points="130,40 135,35 140,40" fill="white" />
      </svg>
    </Box>
  );
}
