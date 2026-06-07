import React, { useState, useEffect, useRef } from 'react';

export function MinionRobot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [focusedInput, setFocusedInput] = useState<HTMLInputElement | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // 1. Mouse movement tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 2. Poll active element to ensure reliable focus and value tracking
    const checkActiveElement = () => {
      const active = document.activeElement as HTMLInputElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        const isPassword = 
          active.type === 'password' || 
          active.name?.toLowerCase().includes('password') ||
          active.placeholder?.toLowerCase().includes('password') ||
          active.id?.toLowerCase().includes('password');

        setIsPasswordFocused(isPassword);
        setFocusedInput(active);
        setCharCount(active.value?.length || 0);
      } else {
        setIsPasswordFocused(false);
        setFocusedInput(null);
        setCharCount(0);
      }
    };

    const intervalId = setInterval(checkActiveElement, 80);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(intervalId);
    };
  }, []);

  // Update pupil offsets dynamically based on target coordinate
  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const minionCX = rect.left + rect.width / 2;
    const minionCY = rect.top + 60; // Approximate vertical eye center

    let targetX = mousePos.x;
    let targetY = mousePos.y;

    if (focusedInput) {
      const inputRect = focusedInput.getBoundingClientRect();
      // Estimate text insertion point position (caret tracking)
      const textOffset = Math.min(inputRect.width - 24, 16 + charCount * 6.8);
      targetX = inputRect.left + textOffset;
      targetY = inputRect.top + inputRect.height / 2;
    }

    const dx = targetX - minionCX;
    const dy = targetY - minionCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = 5.5; // Boundary limit inside the sclera

    if (dist > 0.1) {
      setPupilOffset({
        x: (dx / dist) * Math.min(dist, maxOffset),
        y: (dy / dist) * Math.min(dist, maxOffset),
      });
    } else {
      setPupilOffset({ x: 0, y: 0 });
    }
  }, [mousePos, focusedInput, charCount]);

  const getMouth = () => {
    if (isPasswordFocused) {
      // Wavy/focused thin mouth
      return (
        <path
          d="M 52 82 Q 60 78 68 82"
          fill="none"
          stroke="#451a03"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      );
    }
    if (focusedInput) {
      // Concentrated open mouth (cute O-shape/happy)
      return (
        <g className="transition-all duration-300">
          <path
            d="M 50 78 Q 60 88 70 78 C 70 85 50 85 50 78 Z"
            fill="#881337"
            stroke="#451a03"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M 53 79 Q 60 82 67 79" fill="#ffffff" />
        </g>
      );
    }
    // Happy smile
    return (
      <path
        d="M 48 78 Q 60 88 72 78"
        fill="none"
        stroke="#451a03"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-[120px] h-[150px] mx-auto select-none pointer-events-none relative transition-transform duration-500 hover:scale-105"
      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 120 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Minion Skin Gradient */}
          <linearGradient id="minionSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="65%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Goggle Frame Metallic Gradient */}
          <linearGradient id="goggleMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Overall Denim Blue Gradient */}
          <linearGradient id="denimBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          {/* Eye Clip Paths */}
          <clipPath id="leftEyeClip">
            <circle cx="48" cy="54" r="10" />
          </clipPath>
          <clipPath id="rightEyeClip">
            <circle cx="72" cy="54" r="10" />
          </clipPath>
        </defs>

        {/* --- Hair Strands --- */}
        <path d="M 56 12 Q 52 2 48 5" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 60 12 Q 60 0 60 4" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 64 12 Q 68 2 72 5" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />

        {/* --- Yellow Body --- */}
        <rect x="28" y="12" width="64" height="120" rx="32" fill="url(#minionSkin)" />

        {/* --- Goggle Strap --- */}
        <rect x="23" y="49" width="74" height="10" rx="2" fill="#1e293b" />

        {/* --- Left Eye & Goggle --- */}
        <circle cx="48" cy="54" r="14" fill="url(#goggleMetal)" stroke="#334155" strokeWidth="1" />
        <circle cx="48" cy="54" r="11" fill="#0f172a" />
        <circle cx="48" cy="54" r="10" fill="#ffffff" />
        <g clipPath="url(#leftEyeClip)">
          {/* Bob Heterochromia: Left Iris is green/hazel */}
          <circle cx={48 + pupilOffset.x} cy={54 + pupilOffset.y} r="5.5" fill="#4d7c0f" />
          <circle cx={48 + pupilOffset.x} cy={54 + pupilOffset.y} r="2.8" fill="#000000" />
          <circle cx={46.5 + pupilOffset.x} cy={52.5 + pupilOffset.y} r="1" fill="#ffffff" />

          {/* Eyelid Dropdown */}
          <rect
            x="36"
            y="32"
            width="24"
            height="24"
            fill="#eab308"
            style={{
              transform: isPasswordFocused ? 'translateY(12px)' : 'translateY(-14px)',
              transition: 'transform 0.22s ease-in-out',
            }}
          />
        </g>

        {/* --- Right Eye & Goggle --- */}
        <circle cx="72" cy="54" r="14" fill="url(#goggleMetal)" stroke="#334155" strokeWidth="1" />
        <circle cx="72" cy="54" r="11" fill="#0f172a" />
        <circle cx="72" cy="54" r="10" fill="#ffffff" />
        <g clipPath="url(#rightEyeClip)">
          {/* Bob Heterochromia: Right Iris is brown/amber */}
          <circle cx={72 + pupilOffset.x} cy={54 + pupilOffset.y} r="5.5" fill="#78350f" />
          <circle cx={72 + pupilOffset.x} cy={54 + pupilOffset.y} r="2.8" fill="#000000" />
          <circle cx={70.5 + pupilOffset.x} cy={52.5 + pupilOffset.y} r="1" fill="#ffffff" />

          {/* Eyelid Dropdown */}
          <rect
            x="60"
            y="32"
            width="24"
            height="24"
            fill="#eab308"
            style={{
              transform: isPasswordFocused ? 'translateY(12px)' : 'translateY(-14px)',
              transition: 'transform 0.22s ease-in-out',
            }}
          />
        </g>

        {/* Cute closed eyelashes lines when password active */}
        <path
          d="M 41 54 Q 48 57 55 54"
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            opacity: isPasswordFocused ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
        <path
          d="M 65 54 Q 72 57 79 54"
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            opacity: isPasswordFocused ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />

        {/* --- Mouth --- */}
        {getMouth()}

        {/* --- Denim Overalls --- */}
        <path
          d="M 36 100 H 84 V 122 Q 84 132 74 132 H 46 Q 36 132 36 122 Z"
          fill="url(#denimBlue)"
        />
        <rect x="42" y="100" width="36" height="25" fill="url(#denimBlue)" />

        {/* Straps */}
        <path d="M 28 106 L 44 100 L 42 104 L 28 110 Z" fill="#1d4ed8" />
        <path d="M 92 106 L 76 100 L 78 104 L 92 110 Z" fill="#1d4ed8" />

        {/* Pocket */}
        <path d="M 52 108 H 68 V 116 Q 60 121 52 116 Z" fill="#1e3a8a" />
        {/* Tiny PlayPoints logo inside pocket (yellow star/triangle) */}
        <polygon points="58,111 62,111 60,115" fill="#facc15" />

        {/* Strap Buttons */}
        <circle cx="43" cy="102" r="2" fill="#0f172a" />
        <circle cx="77" cy="102" r="2" fill="#0f172a" />

        {/* --- Left Arm & Glove --- */}
        <path
          d={isPasswordFocused ? 'M 30 112 Q 20 78 44 58' : 'M 30 112 Q 18 116 14 126'}
          fill="none"
          stroke="#eab308"
          strokeWidth="8"
          strokeLinecap="round"
          style={{
            transition: 'd 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
        <circle
          cx={isPasswordFocused ? 44 : 14}
          cy={isPasswordFocused ? 58 : 126}
          r="6"
          fill="#0f172a"
          style={{
            transition: 'cx 0.35s cubic-bezier(0.25, 1, 0.5, 1), cy 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />

        {/* --- Right Arm & Glove --- */}
        <path
          d={isPasswordFocused ? 'M 90 112 Q 100 78 76 58' : 'M 90 112 Q 102 116 106 126'}
          fill="none"
          stroke="#eab308"
          strokeWidth="8"
          strokeLinecap="round"
          style={{
            transition: 'd 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
        <circle
          cx={isPasswordFocused ? 76 : 106}
          cy={isPasswordFocused ? 58 : 126}
          r="6"
          fill="#0f172a"
          style={{
            transition: 'cx 0.35s cubic-bezier(0.25, 1, 0.5, 1), cy 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
      </svg>
    </div>
  );
}
