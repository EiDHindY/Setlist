import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AnimatedLogo from './AnimatedLogo';

interface SplashScreenProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export default function SplashScreen({ onComplete, isLoading = false }: SplashScreenProps) {
  const [minTimePassed, setMinTimePassed] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 5500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimePassed && !isLoading) {
      onComplete();
    }
  }, [minTimePassed, isLoading, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#002b36]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <AnimatedLogo isLoading={isLoading || !minTimePassed} />
      
      <AnimatePresence>
        {isLoading && minTimePassed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 flex flex-col items-center gap-2"
          >
            <Loader2 className="w-6 h-6 text-[#2aa198] animate-spin" />
            <span className="text-[#586e75] text-[10px] tracking-[0.2em] font-mono uppercase">Syncing Hub...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
