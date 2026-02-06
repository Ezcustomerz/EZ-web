import React from 'react';
import { Box } from '@mui/material';

export function CreateServiceIllustration() {
  return (
    <Box
      sx={{
        width: '100%',
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        borderRadius: '12px 12px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background decorative circles */}
        <circle cx="20" cy="20" r="40" fill="#7A5FFF" opacity="0.05" />
        <circle cx="160" cy="140" r="60" fill="#7A5FFF" opacity="0.05" />
        
        {/* Main service card */}
        <rect x="30" y="30" width="120" height="100" rx="12" fill="white" stroke="#7A5FFF" strokeWidth="2" />
        
        {/* Image placeholder */}
        <rect x="42" y="42" width="40" height="40" rx="8" fill="#ede9fe" />
        <circle cx="62" cy="62" r="8" fill="#7A5FFF" opacity="0.3" />
        
        {/* Service name line */}
        <rect x="90" y="46" width="48" height="8" rx="4" fill="#7A5FFF" />
        
        {/* Price tag */}
        <rect x="90" y="62" width="32" height="12" rx="6" fill="#fbbf24" />
        <text x="106" y="71" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">$50</text>
        
        {/* Description lines */}
        <rect x="42" y="92" width="96" height="6" rx="3" fill="#e5e7eb" />
        <rect x="42" y="104" width="72" height="6" rx="3" fill="#e5e7eb" />
        
        {/* Plus icon */}
        <circle cx="150" cy="120" r="18" fill="#7A5FFF" />
        <line x1="150" y1="110" x2="150" y2="130" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="140" y1="120" x2="160" y2="120" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </Box>
  );
}
