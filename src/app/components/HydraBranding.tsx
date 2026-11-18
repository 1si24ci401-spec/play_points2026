import React from 'react';
import { HYDRA_BILL_LOGO_DATA_URL, HYDRA_BILL_SEAL_DATA_URL } from '../../assets/hydraInvoiceAssets';

/**
 * Official Hydra Traders Bill Logo (Top Left on Tax Invoice)
 * Uses Image 1 provided by the user (Dragon crest with HYDDRRS banner)
 */
export function HydraCrestLogo({ className = "w-28 h-24" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={HYDRA_BILL_LOGO_DATA_URL}
        alt="Hydra Traders Bill Logo"
        className="w-full h-full object-contain"
        style={{
          mixBlendMode: 'multiply',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 91%, 0% 91%)',
        }}
      />
    </div>
  );
}

/**
 * Official Circular Purple Rubber Stamp / Seal (Bottom Right on Tax Invoice)
 * Uses Image 2 provided by the user (Official circular rubber stamp on paper with ESTD. 2022)
 */
export function HydraRubberStamp({ className = "w-32 h-32 sm:w-36 sm:h-36" }: { className?: string }) {
  return (
    <div
      className={`relative inline-block select-none pointer-events-none rounded-full overflow-hidden drop-shadow-sm ${className}`}
      style={{
        transform: 'rotate(-4deg)',
      }}
    >
      <img
        src={HYDRA_BILL_SEAL_DATA_URL}
        alt="Hydra Traders Authorized Seal"
        className="w-full h-full object-cover scale-[1.35]"
        style={{
          mixBlendMode: 'multiply',
          filter: 'contrast(1.22) brightness(1.05)',
        }}
      />
    </div>
  );
}

/**
 * Authentic Blue Fountain-Pen Cursive Signature
 * Matches the stylish "Signature" pen stroke in the image
 */
export function HandwrittenSignature({ className = "w-40 h-16" }: { className?: string }) {
  const inkBlue = "#1d4ed8"; // Rich blue pen ink

  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        viewBox="0 0 220 90"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Elegant cursive handwritten "Signature" with looping 'S', 'g', and underline flourish */}
        <path
          d="M20 70 C 25 50, 32 25, 45 18 C 55 12, 62 18, 55 35 C 48 48, 38 60, 48 65 C 55 68, 65 52, 70 42 C 73 36, 76 38, 77 46 C 79 56, 82 62, 88 50 C 92 42, 95 44, 98 52 C 102 60, 106 60, 110 46 C 114 36, 120 40, 122 55 C 124 68, 122 86, 115 88 C 110 88, 108 80, 116 72 C 128 62, 136 45, 142 45 C 146 45, 148 52, 154 52 C 160 52, 168 40, 175 42 C 182 45, 178 58, 185 58 C 192 58, 198 46, 205 48"
          stroke={inkBlue}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Cross on the t & flourish */}
        <path
          d="M132 46 L148 44"
          stroke={inkBlue}
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Dynamic sweeping underline flourish */}
        <path
          d="M50 74 C 95 68, 150 66, 205 58"
          stroke={inkBlue}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
