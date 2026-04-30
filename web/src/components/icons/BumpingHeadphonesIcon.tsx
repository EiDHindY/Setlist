import React from 'react';
import { motion } from 'framer-motion';

export default function BumpingHeadphonesIcon({ isActive, size = 26 }: { isActive: boolean; size?: number }) {
  const themeColor = isActive ? '#2aa198' : 'rgba(88, 110, 117, 0.8)';

  return (
    <div style={{ width: size, height: size }} className="relative flex justify-center items-center">
      <motion.div
        className="absolute inset-0 flex justify-center items-center"
        animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={isActive ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : { duration: 0.3 }}
      >
        {/* Headband */}
        <div 
          className="absolute border-t-2 border-l-2 border-r-2"
          style={{ top: '10%', width: size * 0.75, height: size * 0.5, borderColor: themeColor, borderRadius: '50px 50px 0 0' }}
        />
        {/* Left Earpad */}
        <div 
          className="absolute rounded-full"
          style={{ bottom: '10%', left: '10%', width: size * 0.22, height: size * 0.45, backgroundColor: themeColor }}
        />
        {/* Right Earpad */}
        <div 
          className="absolute rounded-full"
          style={{ bottom: '10%', right: '10%', width: size * 0.22, height: size * 0.45, backgroundColor: themeColor }}
        />
      </motion.div>

      {isActive && (
        <>
          <motion.div
            className="absolute left-[-4px] bottom-1/2 text-[#d33682] select-none pointer-events-none text-xs"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], x: -12, y: -18, scale: 1.1 }}
            transition={{ repeat: Infinity, duration: 2.0, ease: "easeOut" }}
          >
            ♪
          </motion.div>
          <motion.div
            className="absolute right-[-2px] bottom-[40%] text-[#d33682] select-none pointer-events-none text-[10px]"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], x: 12, y: -15, scale: 1.2 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 1.0 }}
          >
            ♫
          </motion.div>
        </>
      )}
    </div>
  );
}
