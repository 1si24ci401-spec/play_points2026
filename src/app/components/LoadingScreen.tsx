import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const steps = 60;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + (100 / steps);
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-background)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-8 max-w-md px-6">
        <motion.div
          className="relative w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src="https://www.androidpolice.com/wp-content/uploads/2019/09/google-play-pass-animation.gif"
            alt="Loading animation"
            className="w-full h-auto rounded-[var(--radius-xl)]"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            }}
          />
        </motion.div>

        <div className="w-full flex flex-col gap-3">
          <motion.div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </motion.div>

          <div className="flex justify-between items-center text-sm">
            <motion.span
              style={{ color: 'var(--color-muted-foreground)' }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading amazing experience...
            </motion.span>
            <span
              className="font-medium tabular-nums"
              style={{ color: 'var(--color-primary)' }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
