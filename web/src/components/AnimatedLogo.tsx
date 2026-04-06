import React from 'react';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600'] });

export default function AnimatedLogo() {
  return (
    <div className="logo-container-wrapper relative w-[350px] h-[450px] mx-auto flex justify-center items-center">
      <style>{`

        .staff-line {
          fill: none;
          stroke: #586e75;
          stroke-width: 0.5;
          opacity: 0.6;
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawStaff 3s ease-in-out forwards;
        }

        .geometric-s {
          fill: none;
          stroke: #fdf6e3;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: drawPath 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards 1s;
          filter: drop-shadow(0 4px 15px rgba(253, 246, 227, 0.4));
        }

        .geometric-s-ghost {
          fill: none;
          stroke: #2aa198;
          stroke-width: 1;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: drawPath 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards 1.3s;
          transform: translate(-3px, 3px);
          opacity: 0.6;
        }

        .note-head {
          fill: #fdf6e3;
          transform-origin: 30px 80px;
          opacity: 0;
          transform: scale(0.5) rotate(-30deg);
          animation: popHead 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 3.8s;
        }

        .note-head-ghost {
          fill: #2aa198;
          transform-origin: 30px 80px;
          opacity: 0;
          transform: scale(0.5) rotate(-30deg) translate(-3px, 3px);
          animation: popHead 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 4.1s;
        }

        .brand-text-logo {
          font-size: 38px;
          font-weight: 400;
          letter-spacing: 28px;
          color: #fdf6e3;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(15px);
          animation: fadeUp 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 2.5s;
          padding-left: 28px;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
          margin-top: -10px;
        }

        .brand-sub-logo {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 14px;
          color: #2aa198;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(10px);
          animation: fadeUp 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 3s;
          margin-top: 15px;
          padding-left: 14px;
        }

        @keyframes drawStaff { to { stroke-dashoffset: 0; } }
        @keyframes drawPath { to { stroke-dashoffset: 0; } }
        @keyframes popHead { to { opacity: 1; transform: scale(1) rotate(-15deg); } }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>


      {/* Logo Mark */}
      <div className="relative z-10 flex flex-col items-center">
        <svg viewBox="0 0 100 120" className="w-[180px] h-[180px] overflow-visible mb-12 mt-4">
          <path className="staff-line" d="M -40 40 Q 50 38 140 40" style={{ animationDelay: "0.2s" }} />
          <path className="staff-line" d="M -40 60 Q 50 62 140 60" style={{ animationDelay: "0.4s" }} />
          <path className="staff-line" d="M -40 80 Q 50 78 140 80" style={{ animationDelay: "0.6s" }} />
          <path className="staff-line" d="M -40 100 Q 50 102 140 100" style={{ animationDelay: "0.8s" }} />

          <g>
            <path className="geometric-s-ghost" d="M 30 80 A 20 20 0 0 0 50 100 A 20 20 0 0 0 70 80 A 20 20 0 0 0 50 60 A 16 16 0 0 1 34 44 A 16 16 0 0 1 50 28 A 16 16 0 0 1 66 44" />
            <ellipse cx="30" cy="80" rx="9" ry="6" className="note-head-ghost" />

            <path className="geometric-s" d="M 30 80 A 20 20 0 0 0 50 100 A 20 20 0 0 0 70 80 A 20 20 0 0 0 50 60 A 16 16 0 0 1 34 44 A 16 16 0 0 1 50 28 A 16 16 0 0 1 66 44" />
            <ellipse cx="30" cy="80" rx="9" ry="6" className="note-head" />
          </g>
        </svg>

        <div className={`brand-text-logo ${cinzel.className}`}>SETLIST</div>
      </div>
    </div>
  );
}
