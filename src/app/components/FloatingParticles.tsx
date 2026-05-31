import { motion } from 'motion/react';

export function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {[...Array(15)].map((_, i) => {
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 5;
        const xOffset = Math.random() * 100;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${xOffset}%`,
              backgroundColor: i % 3 === 0
                ? 'var(--color-primary)'
                : i % 3 === 1
                ? 'var(--color-secondary)'
                : 'var(--color-accent)',
              opacity: 0.3,
            }}
            initial={{ y: '100vh', x: 0 }}
            animate={{
              y: '-10vh',
              x: [0, Math.sin(i) * 100, 0],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}
