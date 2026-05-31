import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShoppingBag, Sparkles, Gift } from 'lucide-react';

export function CheckoutSuccessAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <motion.div
            className="relative"
            initial={{ scale: 0, y: -100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 100 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 200,
              mass: 1,
            }}
          >
            {/* Radial glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            <motion.div
              className="relative bg-card rounded-[var(--radius-xl)] p-12 flex flex-col items-center gap-6 shadow-2xl"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '2px solid rgba(34, 197, 94, 0.5)',
                minWidth: '400px',
              }}
            >
              {/* Success Icon */}
              <motion.div
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: 'spring',
                  damping: 10,
                  stiffness: 200,
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  animate={{
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
                <div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgb(34, 197, 94)',
                    boxShadow: '0 20px 60px rgba(34, 197, 94, 0.4)',
                  }}
                >
                  <CheckCircle2
                    size={48}
                    style={{ color: 'white' }}
                    strokeWidth={3}
                  />
                </div>
              </motion.div>

              {/* Confetti particles */}
              {[...Array(20)].map((_, i) => {
                const angle = (i * Math.PI * 2) / 20;
                const distance = 150 + Math.random() * 50;
                const delay = i * 0.03;

                return (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                      backgroundColor: ['rgb(34, 197, 94)', 'var(--color-primary)', 'var(--color-secondary)'][i % 3],
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, Math.cos(angle) * distance],
                      y: [0, Math.sin(angle) * distance, Math.sin(angle) * distance + 50],
                      opacity: [1, 1, 0],
                      rotate: [0, Math.random() * 360],
                    }}
                    transition={{
                      duration: 1.5,
                      delay,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}

              {/* Floating icons */}
              {[ShoppingBag, Sparkles, Gift].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  initial={{ scale: 0, x: '-50%', y: '-50%' }}
                  animate={{
                    scale: [0, 1, 1, 0],
                    y: ['-50%', '-150%'],
                    x: [
                      '-50%',
                      `${-50 + (i - 1) * 100}%`,
                    ],
                    rotate: [0, (i - 1) * 360],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.5 + i * 0.2,
                    ease: 'easeOut',
                  }}
                >
                  <Icon size={32} style={{ color: 'rgb(34, 197, 94)' }} />
                </motion.div>
              ))}

              {/* Text Content */}
              <motion.div
                className="flex flex-col items-center gap-3 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2
                  className="text-3xl font-medium"
                  style={{ color: 'var(--color-card-foreground)' }}
                >
                  Order Placed!
                </h2>
                <p
                  className="text-lg"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Your order has been successfully submitted
                </p>
              </motion.div>

              {/* Animated checkmark trail */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: '50%',
                      left: '50%',
                      width: 100 + i * 40,
                      height: 100 + i * 40,
                      border: '2px solid rgba(34, 197, 94, 0.2)',
                      borderRadius: '50%',
                      marginTop: -(50 + i * 20),
                      marginLeft: -(50 + i * 20),
                    }}
                    animate={{
                      scale: [1, 1.3],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
