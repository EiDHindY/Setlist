import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function SyncedHeadsetsIcon({ isActive, size = 26 }: { isActive: boolean; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex justify-center items-center">
      {/* Floating Group Animation */}
      <motion.div
        animate={isActive ? { y: [-1.5, 1.5, -1.5] } : { y: 0 }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative z-10"
      >
        <Users 
          size={size} 
          className={`transition-all duration-500 ${isActive ? 'text-[#2aa198] drop-shadow-[0_0_8px_rgba(42,161,152,0.4)]' : 'text-[#586e75]'}`} 
          strokeWidth={isActive ? 2.5 : 2}
        />
      </motion.div>

      {/* "Live" Indicator Dot */}
      {isActive && (
         <motion.div 
           className="absolute -top-[2px] -right-[2px] w-[6px] h-[6px] bg-[#2aa198] rounded-full shadow-[0_0_8px_rgba(42,161,152,0.6)]"
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
           transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
         />
      )}

      {/* Subtle Glow Background */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-[#2aa198]/10 rounded-full blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      )}
    </div>
  );
}
