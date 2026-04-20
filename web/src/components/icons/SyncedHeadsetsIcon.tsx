import React from 'react';
import { motion } from 'framer-motion';
import { Headphones } from 'lucide-react';

export default function SyncedHeadsetsIcon({ isActive, size = 26 }: { isActive: boolean; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex justify-center items-center">
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center gap-[2px] z-20 pointer-events-none">
          <motion.div
            className="w-[3px] rounded-full bg-[#fdf6e3]"
            animate={{ height: ['30%', '80%', '30%'] }}
            transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
          />
          <motion.div
            className="w-[3px] rounded-full bg-[#fdf6e3]"
            animate={{ height: ['20%', '100%', '20%'] }}
            transition={{ repeat: Infinity, duration: 0.3, ease: "easeInOut", delay: 0.1 }}
          />
          <motion.div
            className="w-[3px] rounded-full bg-[#fdf6e3]"
            animate={{ height: ['40%', '60%', '40%'] }}
            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      )}

      {/* Left Headphone (Cyan) - Lower opacity */}
      <motion.div
        className="absolute"
        initial={false}
        animate={{ 
          x: isActive ? -7 : -3, 
          y: 0, 
          opacity: isActive ? 0.4 : 0.3 
        }}
        transition={{ duration: 0.5, ease: "backOut" }}
      >
        <Headphones size={size * 0.9} color="#2aa198" strokeWidth={isActive ? 2 : 1.5} />
      </motion.div>

      {/* Right Headphone (Magenta) - Main focus */}
      <motion.div
        className="absolute"
        initial={false}
        animate={{ 
          x: isActive ? 7 : 3, 
          y: 0,
          opacity: isActive ? 1 : 0.7
        }}
        transition={{ duration: 0.5, ease: "backOut" }}
      >
        <Headphones size={size * 0.9} color={isActive ? '#d33682' : '#586e75'} strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
    </div>
  );
}
