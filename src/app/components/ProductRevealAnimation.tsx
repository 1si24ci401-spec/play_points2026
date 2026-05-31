import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ProductRevealAnimationProps {
  children: ReactNode;
  delay?: number;
}

export function ProductRevealAnimation({ children, delay = 0 }: ProductRevealAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: -15, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      whileHover={{
        y: -8,
        scale: 1.02,
        rotateY: 2,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      transition={{
        delay,
        duration: 0.6,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      <motion.div
        whileHover={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
