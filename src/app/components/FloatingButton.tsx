import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface FloatingButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export function FloatingButton({ children, onClick, className = '' }: FloatingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={className}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.button>
  );
}
