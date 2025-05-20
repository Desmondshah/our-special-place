import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';

const ThemeTransition: React.FC = () => {
  const { theme } = useTheme();
  const [prevTheme, setPrevTheme] = useState<string>(theme);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  useEffect(() => {
    // Skip initial render
    if (prevTheme === theme) return;
    
    // Start transition
    setIsTransitioning(true);
    
    // End transition after animation completes
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setPrevTheme(theme);
    }, 500); // Match the CSS transition duration
    
    return () => clearTimeout(timer);
  }, [theme, prevTheme]);
  
  if (!isTransitioning) return null;
  
  const transitionClass = prevTheme === 'pixel' ? 'pixel-to-starry' : 'starry-to-pixel';
  
  return (
    <div className={`theme-transition ${transitionClass} active`} />
  );
};

export default ThemeTransition;