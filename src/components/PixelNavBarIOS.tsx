import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';

interface PixelNavBarIOSProps {
  title: string;
  onBackPress?: () => void;
  onThemeToggle?: () => void;
  showBackButton?: boolean;
  showThemeToggle?: boolean;
  rightAction?: {
    icon: string;
    label: string;
    onPress: () => void;
  };
  subtitle?: string;
  progress?: number; // 0-100 for progress bar
  statusBarStyle?: 'light' | 'dark';
}

export default function PixelNavBarIOS({
  title,
  onBackPress,
  onThemeToggle,
  showBackButton = false,
  showThemeToggle = true,
  rightAction,
  subtitle,
  progress,
  statusBarStyle = 'dark'
}: PixelNavBarIOSProps) {
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [titleOpacity, setTitleOpacity] = useState(1);

  // Monitor scroll to add blur/shadow effects
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);
      
      // Fade title based on scroll for large title effect
      const opacity = Math.max(0.3, 1 - (scrollY / 100));
      setTitleOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set status bar style
  useEffect(() => {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'pixel' ? '#FFEAE6' : '#2C1810');
    }
    
    // For iOS status bar
    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBar) {
      statusBar.setAttribute('content', statusBarStyle);
    }
  }, [theme, statusBarStyle]);

  const handleThemeToggle = () => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onThemeToggle?.();
  };

  return (
    <>
      {/* Status Bar Background */}
      <div className="pixel-status-bar-bg" />
      
      {/* Main Navigation Bar */}
      <nav className={`pixel-nav-bar-ios ${isScrolled ? 'scrolled' : ''} ${theme}`}>
        {/* Background Effects */}
        <div className="pixel-nav-bg-primary" />
        <div className="pixel-nav-bg-pattern" />
        <div className="pixel-nav-bg-overlay" />
        
        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="pixel-nav-progress-container">
            <div 
              className="pixel-nav-progress-bar"
              style={{ 
                width: `${Math.max(0, Math.min(100, progress))}%`,
                transition: 'width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            />
          </div>
        )}
        
        {/* Navigation Content */}
        <div className="pixel-nav-content">
          {/* Left Side */}
          <div className="pixel-nav-left">
            {showBackButton && onBackPress && (
              <button 
                onClick={onBackPress}
                className="pixel-nav-button back-button"
                aria-label="Go back"
              >
                <div className="pixel-nav-button-bg" />
                <div className="pixel-nav-button-content">
                  <span className="pixel-nav-button-icon">←</span>
                  <span className="pixel-nav-button-text">Back</span>
                </div>
                <div className="pixel-nav-button-ripple" />
              </button>
            )}
          </div>

          {/* Center - Title */}
          <div className="pixel-nav-center">
            <div 
              className="pixel-nav-title-container"
              style={{ opacity: titleOpacity }}
            >
              <h1 className="pixel-nav-title">
                <span className="pixel-nav-title-text">
                  {title}
                </span>
                <div className="pixel-nav-title-decoration" />
              </h1>
              {subtitle && (
                <p className="pixel-nav-subtitle">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="pixel-nav-right">
            {rightAction && (
              <button 
                onClick={rightAction.onPress}
                className="pixel-nav-button action-button"
                aria-label={rightAction.label}
                title={rightAction.label}
              >
                <div className="pixel-nav-button-bg" />
                <div className="pixel-nav-button-content">
                  <span className="pixel-nav-button-icon">{rightAction.icon}</span>
                </div>
                <div className="pixel-nav-button-ripple" />
              </button>
            )}
            
            {showThemeToggle && onThemeToggle && (
              <button 
                onClick={handleThemeToggle}
                className="pixel-nav-button theme-button"
                aria-label="Toggle theme"
                title="Toggle Theme"
              >
                <div className="pixel-nav-button-bg" />
                <div className="pixel-nav-button-content">
                  <span className="pixel-nav-button-icon pixel-theme-icon">
                    {theme === 'pixel' ? '🌙' : '☀️'}
                  </span>
                </div>
                <div className="pixel-nav-button-ripple" />
              </button>
            )}
          </div>
        </div>

        {/* Large Title (iOS 11+ style) */}
        <div className="pixel-nav-large-title-container">
          <h1 className="pixel-nav-large-title">
            <span className="pixel-nav-large-title-text">
              {title}
            </span>
            <div className="pixel-nav-large-title-decoration" />
          </h1>
          {subtitle && (
            <p className="pixel-nav-large-subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </nav>

      {/* Spacer for fixed positioning */}
      <div className="pixel-nav-spacer" />
    </>
  );
}