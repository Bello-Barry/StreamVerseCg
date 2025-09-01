'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
}

// Exportez tous les composants framer-motion nécessaires
export { motion, AnimatePresence };

// Optionnel: Créez un wrapper si vous le souhaitez
export const MotionDiv = ({ children, ...props }: any) => {
  return <motion.div {...props}>{children}</motion.div>;
};

export const MotionButton = ({ children, ...props }: any) => {
  return <motion.button {...props}>{children}</motion.button>;
};

