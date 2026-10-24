import React from 'react';

export const CubeLogo = ({ size = 38, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 4px 10px rgba(64, 91, 255, 0.35))' }}
    >
      <defs>
        {/* Top Face Gradient */}
        <linearGradient id="topFace" x1="15" y1="20" x2="85" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7E68F8" />
          <stop offset="100%" stopColor="#A594FF" />
        </linearGradient>

        {/* Left Face Gradient */}
        <linearGradient id="leftFace" x1="15" y1="35" x2="50" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#435DFE" />
          <stop offset="100%" stopColor="#2A42D8" />
        </linearGradient>

        {/* Right Face Gradient */}
        <linearGradient id="rightFace" x1="50" y1="55" x2="85" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5B73FF" />
          <stop offset="100%" stopColor="#3C54E8" />
        </linearGradient>

        {/* Core Glow */}
        <filter id="cubeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Isometric Cube Faces */}
      {/* Top Face */}
      <polygon
        points="50,15 85,34 50,53 15,34"
        fill="url(#topFace)"
      />
      
      {/* Left Face */}
      <polygon
        points="15,34 50,53 50,91 15,72"
        fill="url(#leftFace)"
      />

      {/* Right Face */}
      <polygon
        points="50,53 85,34 85,72 50,91"
        fill="url(#rightFace)"
      />

      {/* Subtle Highlights along the isometric inner edge */}
      <line x1="50" y1="53" x2="50" y2="91" stroke="#8799FF" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1="15" y1="34" x2="50" y2="53" stroke="#C2BAFF" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="85" y1="34" x2="50" y2="53" stroke="#B1A5FF" strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );
};

export default CubeLogo;
