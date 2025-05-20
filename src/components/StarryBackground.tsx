import React, { useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

const StarryBackground: React.FC = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    // Only show the canvas for starry theme
    if (theme !== 'starry') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match window size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize canvas size
    setCanvasSize();

    // Handle window resize
    window.addEventListener('resize', setCanvasSize);

    // Create stars
    const stars: { x: number; y: number; radius: number; color: string; speed: number }[] = [];
    const starColors = ['#FDFDFD', '#F4E2D8', '#E8C1C1', '#B497BD'];
    
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        speed: Math.random() * 0.03
      });
    }

    // Create a small number of shooting stars
    let shootingStars: { x: number; y: number; len: number; speed: number; opacity: number }[] = [];
    const createShootingStar = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height / 3; // Only in the top third
      shootingStars.push({
        x,
        y,
        len: Math.random() * 80 + 10,
        speed: Math.random() * 10 + 10,
        opacity: 1
      });
    };

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0D1B2A');
      gradient.addColorStop(1, '#1A1A40');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
        
        // Make stars twinkle
        star.radius += Math.sin(Date.now() * star.speed) * 0.1;
        
        // Ensure radius stays reasonable
        if (star.radius < 0.1) star.radius = 0.1;
        if (star.radius > 2) star.radius = 2;
      });
      
      // Randomly create shooting stars
      if (Math.random() < 0.01 && shootingStars.length < 5) {
        createShootingStar();
      }
      
      // Draw shooting stars
      ctx.lineCap = 'round';
      shootingStars.forEach((star, index) => {
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x + star.len, star.y + star.len);
        ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Move shooting star
        star.x += star.speed;
        star.y += star.speed;
        star.opacity -= 0.01;
        
        // Remove if off screen or faded
        if (star.x > canvas.width || star.y > canvas.height || star.opacity <= 0) {
          shootingStars.splice(index, 1);
        }
      });
      
      // Create subtle glow effect in random areas
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 80 + 20;
        
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, 'rgba(180, 151, 189, 0.03)');
        glow.addColorStop(1, 'rgba(180, 151, 189, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [theme]);

  if (theme !== 'starry') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 opacity-80"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default StarryBackground;