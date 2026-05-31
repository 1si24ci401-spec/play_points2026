import { useEffect, useRef } from 'react';

export function PlayPointsMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Custom Google Play Points falling elements
    const playPointsChars = [
      '+10', '+50', '+100', '+500', '+1000',
      '★', '★', '★', // emphasize stars
      'PLAY', 'POINTS', 'GOOGLE', 'BONUS', 'WIN', 'LEVEL', 'UP'
    ];

    // Colors: Green, Blue, Yellow/Gold, Red (Google Play Theme)
    const playColors = [
      '#0F9D58', // Green
      '#4285F4', // Blue
      '#F4B400', // Yellow
      '#DB4437', // Red
      '#A142F4', // Purple
    ];

    const fontSize = 14;
    const columns = Math.ceil(canvas.width / 40); // spacing between columns

    // Track active falling drops
    interface Drop {
      x: number;
      y: number;
      speed: number;
      charIndex: number;
      color: string;
      scale: number;
    }

    const drops: Drop[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops.push({
        x: i * 40,
        y: Math.random() * -canvas.height, // start above screen
        speed: 1.5 + Math.random() * 3, // varying fall speed
        charIndex: Math.floor(Math.random() * playPointsChars.length),
        color: playColors[Math.floor(Math.random() * playColors.length)],
        scale: 0.8 + Math.random() * 0.5, // varying size for depth
      });
    }

    let animationId: number;

    const draw = () => {
      // Create a semi-transparent black overlay for the trails
      ctx.fillStyle = 'rgba(10, 10, 12, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 13px Courier New, monospace';
      ctx.shadowBlur = 4;

      drops.forEach((drop) => {
        // Draw the text
        const text = playPointsChars[drop.charIndex];
        
        ctx.fillStyle = drop.color;
        ctx.shadowColor = drop.color;

        // Apply scale/depth
        ctx.save();
        ctx.translate(drop.x, drop.y);
        ctx.scale(drop.scale, drop.scale);
        
        // Give the very head of the drop a bright white glow
        if (Math.random() > 0.98) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 10;
        }

        ctx.fillText(text, 0, 0);
        ctx.restore();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Increment drop's vertical position
        drop.y += drop.speed * 1.5;

        // Reset drop when it goes off screen
        if (drop.y > canvas.height) {
          drop.y = -50 - Math.random() * 150;
          drop.speed = 1.5 + Math.random() * 3;
          drop.charIndex = Math.floor(Math.random() * playPointsChars.length);
          drop.color = playColors[Math.floor(Math.random() * playColors.length)];
          drop.scale = 0.8 + Math.random() * 0.5;
        }

        // Periodically mutate characters during descent for more dynamic look
        if (Math.random() > 0.95) {
          drop.charIndex = Math.floor(Math.random() * playPointsChars.length);
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
      style={{
        mixBlendMode: 'screen',
      }}
    />
  );
}
