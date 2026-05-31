import { motion, AnimatePresence } from 'motion/react';
import { XCircle, AlertTriangle } from 'lucide-react';

export function OrderCancelledAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'var(--color-destructive)',
                filter: 'blur(40px)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.2, 0],
              }}
              transition={{ duration: 1.5 }}
            />

            <motion.div
              className="relative bg-card border-2 rounded-full p-8 flex items-center justify-center"
              style={{
                borderColor: 'var(--color-destructive)',
                backgroundColor: 'var(--color-card)',
                boxShadow: '0 20px 60px rgba(212, 24, 61, 0.4)',
              }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
              }}
            >
              <XCircle
                size={80}
                style={{ color: 'var(--color-destructive)' }}
                strokeWidth={2.5}
              />
            </motion.div>

            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                initial={{ scale: 0, x: '-50%', y: '-50%', rotate: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: ['-50%', `${Math.cos((i * Math.PI * 2) / 6) * 100}px`],
                  y: ['-50%', `${Math.sin((i * Math.PI * 2) / 6) * 100}px`],
                  rotate: [0, 360],
                  opacity: [1, 0],
                }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <AlertTriangle
                  size={20}
                  style={{ color: 'var(--color-destructive)' }}
                  fill="var(--color-destructive)"
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
            style={{
              backgroundColor: 'var(--color-destructive)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
