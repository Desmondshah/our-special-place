import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon: string;
  color?: string;
}

interface BrutalistPixelTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'desktop' | 'mobile';
  className?: string;
}

const BrutalistPixelTabs: React.FC<BrutalistPixelTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'desktop',
  className = ''
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [clickedTab, setClickedTab] = useState<string | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);

  // Glitch effect for active tab
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tabId: string) => {
    setClickedTab(tabId);
    setTimeout(() => setClickedTab(null), 200);
    onTabChange(tabId);
  };

  if (variant === 'mobile') {
    return (
      <nav 
        className={`brutal-mobile-nav-container ${className}`}
        aria-label="Mobile navigation"
      >
        <div className="brutal-mobile-nav-background" />
        <div className="brutal-mobile-nav-border-top" />
        <div className="brutal-mobile-nav-grid">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`brutal-mobile-tab-button ${
                activeTab === tab.id ? 'brutal-mobile-tab-active' : 'brutal-mobile-tab-inactive'
              } ${clickedTab === tab.id ? 'brutal-mobile-tab-clicked' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: activeTab === tab.id ? 1.05 : 1
              }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              whileTap={{ scale: 0.95 }}
              style={{
                '--tab-index': index,
                '--tab-color': tab.color || 'var(--cute-accent-primary)'
              } as React.CSSProperties}
            >
              {/* Pixelated background pattern */}
              <div className="brutal-mobile-tab-bg-pattern" />
              
              {/* Icon container with glitch effect */}
              <div className={`brutal-mobile-tab-icon-container ${
                activeTab === tab.id && glitchActive ? 'brutal-glitch-active' : ''
              }`}>
                <span className="brutal-mobile-tab-icon" data-icon={tab.icon}>
                  {tab.icon}
                </span>
                {activeTab === tab.id && (
                  <motion.span 
                    className="brutal-mobile-tab-icon-glitch"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: glitchActive ? 0.6 : 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {tab.icon}
                  </motion.span>
                )}
              </div>

              {/* Label with brutal typography */}
              <span className="brutal-mobile-tab-label">
                {tab.label}
              </span>

              {/* Active indicator */}
              {activeTab === tab.id && (
                <motion.div
                  className="brutal-mobile-tab-active-indicator"
                  layoutId="mobileActiveIndicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Hover effect */}
              {hoveredTab === tab.id && activeTab !== tab.id && (
                <motion.div
                  className="brutal-mobile-tab-hover-indicator"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Pixelated corner decorations */}
              <div className="brutal-mobile-tab-corner-tl" />
              <div className="brutal-mobile-tab-corner-tr" />
              <div className="brutal-mobile-tab-corner-bl" />
              <div className="brutal-mobile-tab-corner-br" />
            </motion.button>
          ))}
        </div>

        {/* Ambient pixel particles */}
        <div className="brutal-mobile-nav-particles">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="brutal-nav-particle"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.random() * 100 - 50,
                y: Math.random() * 20 - 10
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </nav>
    );
  }

  // Desktop variant
  return (
    <nav className={`brutal-desktop-nav-container ${className}`} aria-label="Desktop navigation">
      {/* Pixelated background texture */}
      <div className="brutal-desktop-nav-background" />
      
      {/* Main tab container */}
      <div className="brutal-desktop-tab-row">
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className={`brutal-desktop-tab-button ${
              activeTab === tab.id ? 'brutal-desktop-tab-active' : 'brutal-desktop-tab-inactive'
            } ${clickedTab === tab.id ? 'brutal-desktop-tab-clicked' : ''}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              rotateX: activeTab === tab.id ? 0 : hoveredTab === tab.id ? -5 : 0
            }}
            transition={{ 
              delay: index * 0.05,
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.2 }
            }}
            whileTap={{ 
              scale: 0.98,
              y: 2,
              transition: { duration: 0.1 }
            }}
            style={{
              '--tab-index': index,
              '--tab-color': tab.color || 'var(--cute-accent-primary)'
            } as React.CSSProperties}
          >
            {/* Pixelated border decoration */}
            <div className="brutal-desktop-tab-border-decoration" />
            
            {/* Icon with brutal effects */}
            <div className={`brutal-desktop-tab-icon-wrapper ${
              activeTab === tab.id && glitchActive ? 'brutal-glitch-active' : ''
            }`}>
              <span className="brutal-desktop-tab-icon">
                {tab.icon}
              </span>
              {activeTab === tab.id && (
                <>
                  <motion.span 
                    className="brutal-desktop-tab-icon-shadow"
                    animate={{ 
                      x: glitchActive ? [0, -2, 2, 0] : 0,
                      opacity: glitchActive ? [0.3, 0.7, 0.3] : 0.3
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {tab.icon}
                  </motion.span>
                  <motion.span 
                    className="brutal-desktop-tab-icon-glitch"
                    animate={{ 
                      x: glitchActive ? [0, 2, -1, 0] : 0,
                      opacity: glitchActive ? [0, 0.5, 0] : 0
                    }}
                    transition={{ duration: 0.1 }}
                  >
                    {tab.icon}
                  </motion.span>
                </>
              )}
            </div>

            {/* Label with brutal typography */}
            <span className="brutal-desktop-tab-label">
              {tab.label}
            </span>

            {/* Active state indicators */}
            {activeTab === tab.id && (
              <>
                <motion.div
                  className="brutal-desktop-tab-active-underline"
                  layoutId="desktopActiveUnderline"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <motion.div
                  className="brutal-desktop-tab-active-glow"
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </>
            )}

            {/* Hover effect */}
            <AnimatePresence>
              {hoveredTab === tab.id && activeTab !== tab.id && (
                <motion.div
                  className="brutal-desktop-tab-hover-effect"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>

            {/* Pixel corner accents */}
            <div className="brutal-desktop-tab-pixel-corners">
              <div className="brutal-pixel-corner-tl" />
              <div className="brutal-pixel-corner-tr" />
              <div className="brutal-pixel-corner-bl" />
              <div className="brutal-pixel-corner-br" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Ambient effects */}
      <div className="brutal-desktop-nav-ambient">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="brutal-ambient-pixel"
            animate={{
              opacity: [0, 0.4, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
            style={{
              left: `${10 + i * 10}%`,
              top: Math.random() * 20 + 10
            }}
          />
        ))}
      </div>
    </nav>
  );
};

export default BrutalistPixelTabs;