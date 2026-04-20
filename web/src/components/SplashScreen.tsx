import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#002b36]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <AnimatedLogo isLoading={isLoading || !minTimePassed} />
    </motion.div>
  );
}
