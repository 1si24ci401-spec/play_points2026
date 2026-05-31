import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Check } from 'lucide-react';

export function AddToCartAnimation({ show, position }: { show: boolean; position?: { x: number; y: number } }) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{
              left: position?.x || window.innerWidth / 2,
              top: position?.y || window.innerHeight / 2,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.2, 1],
              y: [0, -100],
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <motion.div
              className="relative flex items-center justify-center w-20 h-20 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 0.6 }}
            >
              <ShoppingCart size={32} style={{ color: 'var(--color-primary-foreground)' }} />
              <motion.div
                className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Check size={16} style={{ color: 'var(--color-primary-foreground)' }} strokeWidth={3} />
              </motion.div>
            </motion.div>
          </motion.div>

          {[...Array(12)].map((_, i) => {
            const angle = (i * Math.PI * 2) / 12;
            const distance = 60;
            return (
              <motion.div
                key={i}
                className="fixed z-40 pointer-events-none"
                style={{
                  left: position?.x || window.innerWidth / 2,
                  top: position?.y || window.innerHeight / 2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.8, delay: i * 0.03 }}
              />
            );
          })}
        </>
      )}
    </AnimatePresence>
  );
}
