import React from 'react';
import { motion } from 'framer-motion';
import Music2 from 'lucide-react/dist/esm/icons/music-2';

export default function BleedingClashIcon({ isActive, size = 26 }: { isActive: boolean; size?: number }) {
  const themeColor = isActive ? '#d33682' : 'rgba(88, 110, 117, 0.8)';

  return (
    <div style={{ width: size, height: size }} className="relative flex justify-center items-center">
      <motion.div
        animate={isActive ? { 
          filter: ['drop-shadow(0px 0px 4px rgba(211, 54, 130, 0.4))', 'drop-shadow(0px 0px 0px rgba(211, 54, 130, 0))'],
          scale: [1, 1.05, 1]
        } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="relative z-10"
      >
        <Music2 size={size} color={themeColor} strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>

      {isActive && (
        <div className="absolute top-[70%] left-0 right-0 h-10 z-0 pointer-events-none">
          {/* Drip 1 */}
          <motion.div
            className="absolute bg-[#d33682] rounded-full"
            style={{ width: '4px', height: '6px', left: '42%' }}
            initial={{ opacity: 0, y: 0, scaleY: 0.5 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: [0, 5, 20, 20], 
              scaleY: [0.5, 1.5, 0.8, 0.5],
              scaleX: [1, 0.8, 1.2, 1]
            }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeIn" }}
          />
          {/* Drip 2 */}
          <motion.div
            className="absolute bg-[#d33682] rounded-full"
            style={{ width: '3px', height: '5px', left: '58%' }}
            initial={{ opacity: 0, y: 0, scaleY: 0.5 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: [0, 3, 15, 15], 
              scaleY: [0.5, 1.4, 0.9, 0.5],
              scaleX: [1, 0.9, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeIn", delay: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}
