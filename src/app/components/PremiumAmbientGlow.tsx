import { useEffect, useState } from 'react';

export function PremiumAmbientGlow() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    // Generate 15 slow-drifting premium ambient gold-dust particles
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // % left
      y: 100 + Math.random() * 20, // % top (start below screen)
      size: 1.5 + Math.random() * 2.5, // px
      speed: 0.5 + Math.random() * 0.8, // drift speed
      opacity: 0.15 + Math.random() * 0.2
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden select-none">
      {/* Dynamic ambient gold dust particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: 'var(--color-primary)',
            boxShadow: '0 0 10px var(--color-primary)',
            opacity: p.opacity,
            animation: `driftUp ${12 + Math.random() * 12}s linear infinite`,
            animationDelay: `${Math.random() * -12}s` // start scattered
          }}
        />
      ))}

      {/* Screen edge luxury glow vignette */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, transparent 75%, var(--color-primary-glow) 150%)',
          mixBlendMode: 'color-dodge',
          opacity: 0.15
        }}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes driftUp {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120vh) translateX(60px) scale(0.8);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}
