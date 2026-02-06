import React from 'react';
import { Box } from '@mui/material';

export function ConnectStripeIllustration() {
  return (
    <Box
      sx={{
        width: '100%',
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        borderRadius: '12px 12px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background decorative elements */}
        <circle cx="150" cy="20" r="45" fill="#635BFF" opacity="0.1" />
        <circle cx="20" cy="140" r="50" fill="#7A5FFF" opacity="0.1" />
        
        {/* Payment card */}
        <rect x="30" y="40" width="120" height="75" rx="10" fill="white" stroke="#7A5FFF" strokeWidth="2" />
        
        {/* Card chip */}
        <rect x="45" y="55" width="25" height="20" rx="3" fill="#fbbf24" />
        <line x1="50" y1="60" x2="65" y2="60" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="50" y1="65" x2="65" y2="65" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="50" y1="70" x2="65" y2="70" stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Card number dots */}
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <circle cx={45 + i * 8} cy="88" r="2" fill="#9ca3af" />
            <circle cx={45 + i * 8} cy="88" r="2" fill="#9ca3af" />
            <circle cx={45 + i * 8} cy="88" r="2" fill="#9ca3af" />
            <circle cx={45 + i * 8} cy="88" r="2" fill="#9ca3af" />
          </React.Fragment>
        ))}
        
        {/* Stripe logo representation */}
        <rect x="90" y="58" width="50" height="18" rx="4" fill="#635BFF" />
        <text x="115" y="71" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">Stripe</text>
        
        {/* Money flow arrows */}
        <circle cx="90" cy="135" r="18" fill="#7A5FFF" opacity="0.2" />
        <text x="90" y="142" fontSize="20" textAnchor="middle">$</text>
        
        {/* Flow arrow */}
        <path d="M 108 135 L 125 135" stroke="#7A5FFF" strokeWidth="3" strokeLinecap="round" />
        <polygon points="125,135 120,130 120,140" fill="#7A5FFF" />
        
        {/* Checkmark circle */}
        <circle cx="145" cy="135" r="15" fill="#10b981" />
        <path d="M 138 135 L 142 139 L 152 129" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </Box>
  );
}
