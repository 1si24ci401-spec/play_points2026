import React from 'react';
import { HYDRA_LOGO_DATA_URL } from '../../assets/hydraLogoBase64';

/**
 * Official Hydra Mascot Logo (Top Left on Tax Invoice)
 * Uses the exact 3-headed dragon mascot provided by the user
 */
export function HydraCrestLogo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-200/50 shadow-md p-0.5 ${className}`}>
      <img
        src={HYDRA_LOGO_DATA_URL}
        alt="Hydra Traders Logo"
        className="w-full h-full object-contain rounded-xl"
      />
    </div>
  );
}

/**
 * Authentic Circular Purple Rubber Stamp / Seal
 * Features dual circular borders, curved text "HYDRA TRADERS" on top, "BENGALURU" on bottom,
 * side stars, and the official Hydra 3-headed mascot emblem inside the stamp center in violet ink.
 */
export function HydraRubberStamp({ className = "w-36 h-36" }: { className?: string }) {
  const inkColor = "#312e81"; // Authentic violet/indigo ink stamp shade

  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`} style={{ transform: 'rotate(-7deg)' }}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm opacity-95"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top Arc for HYDRA TRADERS */}
          <path
            id="hydra-top-arc"
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
          />
          {/* Bottom Arc for BENGALURU: curves along bottom from left to right so text is upright */}
          <path
            id="hydra-bottom-arc"
            d="M 32 105 A 68 68 0 0 0 168 105"
            fill="none"
          />
          {/* Circular mask for center mascot */}
          <clipPath id="hydra-seal-center-clip">
            <circle cx="100" cy="100" r="50" />
          </clipPath>
        </defs>

        {/* Outer Ring with slight rubber stamp grunge texture */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={inkColor}
          strokeWidth="3.5"
          strokeDasharray="98 1 80 1.5 60 1"
          opacity="0.9"
        />

        {/* Middle Ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke={inkColor}
          strokeWidth="1.2"
          opacity="0.85"
        />

        {/* Inner Ring */}
        <circle
          cx="100"
          cy="100"
          r="54"
          fill="none"
          stroke={inkColor}
          strokeWidth="2.5"
          strokeDasharray="60 0.8 50 1"
          opacity="0.9"
        />

        {/* Top Arc Text: HYDRA TRADERS */}
        <text
          fill={inkColor}
          fontSize="18.5"
          fontWeight="900"
          fontFamily="'Arial Black', Impact, sans-serif"
          letterSpacing="4"
          opacity="0.92"
        >
          <textPath
            href="#hydra-top-arc"
            startOffset="50%"
            textAnchor="middle"
          >
            HYDRA TRADERS
          </textPath>
        </text>

        {/* Left and Right Stars */}
        <circle cx="34" cy="100" r="3" fill={inkColor} opacity="0.9" />
        <circle cx="166" cy="100" r="3" fill={inkColor} opacity="0.9" />

        {/* Bottom Arc Text: BENGALURU */}
        <text
          fill={inkColor}
          fontSize="17"
          fontWeight="900"
          fontFamily="'Arial Black', Impact, sans-serif"
          letterSpacing="5"
          opacity="0.92"
        >
          <textPath
            href="#hydra-bottom-arc"
            startOffset="50%"
            textAnchor="middle"
          >
            BENGALURU
          </textPath>
        </text>

        {/* Official Hydra Mascot Inside the Stamp Center */}
        <g clipPath="url(#hydra-seal-center-clip)">
          <image
            href={HYDRA_LOGO_DATA_URL}
            x="48"
            y="48"
            width="104"
            height="104"
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: 'contrast(1.3) grayscale(0.2)' }}
            opacity="0.92"
          />
          {/* Violet Ink Tint Overlay */}
          <circle
            cx="100"
            cy="100"
            r="51"
            fill={inkColor}
            opacity="0.35"
            style={{ mixBlendMode: 'multiply' }}
          />
        </g>
      </svg>
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
