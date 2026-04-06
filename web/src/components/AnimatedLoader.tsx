import React from 'react';

export default function AnimatedLoader() {
  return (
    <div className="flex flex-col items-center justify-center">
      <style>{`
        .loader-geometric-s {
          fill: none;
          stroke: #fdf6e3;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 240;
          stroke-dashoffset: 240;
          animation: loadS 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
          filter: drop-shadow(0 0 8px rgba(253, 246, 227, 0.4));
        }

        .loader-note-head {
          fill: #fdf6e3;
          transform-origin: 30px 80px;
          animation: pulseNote 1.5s ease-in-out infinite alternate;
        }

        @keyframes loadS {
            0% { stroke-dashoffset: 240; }
            100% { stroke-dashoffset: 0; }
        }

        @keyframes pulseNote {
            0% { transform: scale(0.8) rotate(-30deg); opacity: 0.5; }
            100% { transform: scale(1) rotate(-15deg); opacity: 1; }
        }
      `}</style>
      
      <svg viewBox="0 0 100 120" className="w-16 h-16 overflow-visible mb-4">
        {/* Subtle static staff lines for structure */}
        <path d="M -20 40 Q 50 38 120 40" fill="none" stroke="#586e75" strokeWidth="1" opacity="0.4" />
        <path d="M -20 60 Q 50 62 120 60" fill="none" stroke="#586e75" strokeWidth="1" opacity="0.4" />
        <path d="M -20 80 Q 50 78 120 80" fill="none" stroke="#586e75" strokeWidth="1" opacity="0.4" />
        <path d="M -20 100 Q 50 102 120 100" fill="none" stroke="#586e75" strokeWidth="1" opacity="0.4" />

        <g>
          {/* Main S Path animated back and forth */}
          <path className="loader-geometric-s" d="M 30 80 A 20 20 0 0 0 50 100 A 20 20 0 0 0 70 80 A 20 20 0 0 0 50 60 A 16 16 0 0 1 34 44 A 16 16 0 0 1 50 28 A 16 16 0 0 1 66 44" />
          <ellipse cx="30" cy="80" rx="9" ry="6" className="loader-note-head" />
        </g>
      </svg>
      
      <span className="text-[#93a1a1] animate-pulse font-mono tracking-widest text-xs mt-2">TUNING ECOSYSTEM...</span>
    </div>
  );
}
