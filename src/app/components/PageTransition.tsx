import { motion } from 'motion/react';
import { ReactNode } from 'react';

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 28,
        mass: 0.8
      }}
      className="size-full"
    >
      {children}
    </motion.div>
  );
}
