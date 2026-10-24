import React from 'react';

export const RobotIllustration = ({ size = 90, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="botBody" x1="30" y1="30" x2="90" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDE6FF" />
        </linearGradient>

        <linearGradient id="botHead" x1="35" y1="25" x2="85" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E3EAFF" />
        </linearGradient>

        <linearGradient id="botVisor" x1="40" y1="40" x2="80" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E2749" />
          <stop offset="100%" stopColor="#0B1028" />
        </linearGradient>

        <linearGradient id="eyeGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#405BFF" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Floating Sparkles */}
      <path d="M18 42L21 35L24 42L31 45L24 48L21 55L18 48L11 45Z" fill="#8267F5" opacity="0.8" />
      <path d="M100 28L102 23L104 28L109 30L104 32L102 37L100 32L95 30Z" fill="#405BFF" opacity="0.9" />
      <path d="M105 82L106.5 78L108 82L112 83.5L108 85L106.5 89L105 85L101 83.5Z" fill="#F59E0B" opacity="0.7" />

      {/* Floating Soft Base Shadow */}
      <ellipse cx="60" cy="110" rx="30" ry="6" fill="#405BFF" fillOpacity="0.12" />

      {/* Bot Group with Shadow */}
      <g filter="url(#shadowFilter)">
        {/* Antennas / Ears */}
        <circle cx="34" cy="48" r="5" fill="#A5B4FC" />
        <circle cx="86" cy="48" r="5" fill="#A5B4FC" />

        {/* Head */}
        <rect x="36" y="28" width="48" height="40" rx="16" fill="url(#botHead)" stroke="#E0E7FF" strokeWidth="1.5" />

        {/* Visor Screen */}
        <rect x="42" y="36" width="36" height="24" rx="10" fill="url(#botVisor)" />

        {/* Expressive Glowing Eyes */}
        <path d="M47 48C47 45.5 49 44 52 44C55 44 57 45.5 57 48" stroke="url(#eyeGlow)" strokeWidth="3" strokeLinecap="round" />
        <path d="M63 48C63 45.5 65 44 68 44C71 44 73 45.5 73 48" stroke="url(#eyeGlow)" strokeWidth="3" strokeLinecap="round" />

        {/* Cute Smile */}
        <path d="M57 54Q60 56 63 54" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Torso / Hovering Body */}
        <path d="M44 72C44 69 49 68 60 68C71 68 76 69 76 72L73 94C73 98 68 100 60 100C52 100 47 98 47 94Z" fill="url(#botBody)" stroke="#E0E7FF" strokeWidth="1.5" />

        {/* Chest Accent Dot */}
        <circle cx="60" cy="82" r="3.5" fill="#405BFF" />

        {/* Little Floating Hands */}
        <ellipse cx="38" cy="82" rx="4.5" ry="6" transform="rotate(-15 38 82)" fill="#C7D2FE" />
        <ellipse cx="82" cy="82" rx="4.5" ry="6" transform="rotate(15 82 82)" fill="#C7D2FE" />
      </g>
    </svg>
  );
};

export default RobotIllustration;
