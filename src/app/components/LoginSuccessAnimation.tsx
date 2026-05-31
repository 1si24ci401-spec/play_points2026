import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles } from 'lucide-react';

export function LoginSuccessAnimation({ show }: { show: boolean }) {
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary)',
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
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--color-card)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <CheckCircle2
                size={80}
                style={{ color: 'var(--color-primary)' }}
                strokeWidth={2.5}
              />
            </motion.div>

            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                initial={{ scale: 0, x: '-50%', y: '-50%' }}
                animate={{
                  scale: [0, 1, 0],
                  x: ['-50%', `${Math.cos((i * Math.PI * 2) / 8) * 100}px`],
                  y: ['-50%', `${Math.sin((i * Math.PI * 2) / 8) * 100}px`],
                  opacity: [1, 0],
                }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <Sparkles
                  size={20}
                  style={{ color: 'var(--color-primary)' }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
