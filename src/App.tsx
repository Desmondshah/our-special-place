import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ConvexProvider, useConvex } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import PlansSection from './components/PlansSection';

// Initialize Convex client
const convex = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL!);

// Types for better TypeScript support
interface AppTheme {
  name: string;
  displayName: string;
  icon: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType;
  badge?: number;
  isActive?: boolean;
}

// Navigation components (you can add your other sections here)
const Dashboard = () => (
  <div className="section">
    <div className="section-header">
      <h1 className="section-title" style={{ 
        fontFamily: 'var(--pixel-font-main)', 
        color: 'var(--pixel-primary)',
        textShadow: '2px 2px 0 var(--pixel-shadow-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Dashboard
      </h1>
      <p className="section-subtitle">Welcome to your pixel-perfect life planner</p>
    </div>
    <div className="section-body">
      <div className="grid grid-cols-3" style={{ gap: 'var(--pixel-spacing-xl)' }}>
        <div className="card card-pixel">
          <div className="card-header">
            <h3 className="card-title">📋 Quick Stats</h3>
          </div>
          <div className="card-body">
            <p>Your life planning dashboard - coming soon with advanced analytics!</p>
          </div>
        </div>
        <div className="card card-pixel">
          <div className="card-header">
            <h3 className="card-title">🎯 Today's Focus</h3>
          </div>
          <div className="card-body">
            <p>Prioritize what matters most today.</p>
          </div>
        </div>
        <div className="card card-pixel">
          <div className="card-header">
            <h3 className="card-title">🌟 Achievements</h3>
          </div>
          <div className="card-body">
            <p>Celebrate your completed goals and milestones.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Additional placeholder components
const Milestones = () => (
  <div className="section">
    <div className="section-header">
      <h1 className="section-title" style={{ 
        fontFamily: 'var(--pixel-font-main)', 
        color: 'var(--pixel-secondary)',
        textShadow: '2px 2px 0 var(--pixel-shadow-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Milestones
      </h1>
      <p className="section-subtitle">Track your life's important moments</p>
    </div>
    <div className="section-body">
      <div className="empty-state">
        <div className="empty-icon">🏆</div>
        <h3 className="empty-title">Milestones Coming Soon</h3>
        <p className="empty-description">
          Create and celebrate your most important life achievements and memories.
        </p>
      </div>
    </div>
  </div>
);

const Dreams = () => (
  <div className="section">
    <div className="section-header">
      <h1 className="section-title" style={{ 
        fontFamily: 'var(--pixel-font-main)', 
        color: 'var(--pixel-accent)',
        textShadow: '2px 2px 0 var(--pixel-shadow-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Dreams
      </h1>
      <p className="section-subtitle">Visualize and pursue your aspirations</p>
    </div>
    <div className="section-body">
      <div className="empty-state">
        <div className="empty-icon">✨</div>
        <h3 className="empty-title">Dream Board Coming Soon</h3>
        <p className="empty-description">
          Create a visual board of your dreams and aspirations to manifest your future.
        </p>
      </div>
    </div>
  </div>
);

const Bucket = () => (
  <div className="section">
    <div className="section-header">
      <h1 className="section-title" style={{ 
        fontFamily: 'var(--pixel-font-main)', 
        color: 'var(--pixel-success)',
        textShadow: '2px 2px 0 var(--pixel-shadow-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Bucket List
      </h1>
      <p className="section-subtitle">Adventures waiting to be experienced</p>
    </div>
    <div className="section-body">
      <div className="empty-state">
        <div className="empty-icon">🎒</div>
        <h3 className="empty-title">Bucket List Coming Soon</h3>
        <p className="empty-description">
          Create your ultimate bucket list of experiences and adventures.
        </p>
      </div>
    </div>
  </div>
);

const Moodboard = () => (
  <div className="section">
    <div className="section-header">
      <h1 className="section-title" style={{ 
        fontFamily: 'var(--pixel-font-main)', 
        color: 'var(--pixel-warning)',
        textShadow: '2px 2px 0 var(--pixel-shadow-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Moodboard
      </h1>
      <p className="section-subtitle">Curate inspiration and aesthetic</p>
    </div>
    <div className="section-body">
      <div className="empty-state">
        <div className="empty-icon">🎨</div>
        <h3 className="empty-title">Moodboard Coming Soon</h3>
        <p className="empty-description">
          Collect and organize visual inspiration for your creative projects.
        </p>
      </div>
    </div>
  </div>
);

const Cinema = () => (
  <div className="section">
    <div className="section-header">
      <h1 className="section-title" style={{ 
        fontFamily: 'var(--pixel-font-main)', 
        color: 'var(--pixel-danger)',
        textShadow: '2px 2px 0 var(--pixel-shadow-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Cinema
      </h1>
      <p className="section-subtitle">Your personal movie collection</p>
    </div>
    <div className="section-body">
      <div className="empty-state">
        <div className="empty-icon">🎬</div>
        <h3 className="empty-title">Cinema Coming Soon</h3>
        <p className="empty-description">
          Track movies to watch and create your personal cinema experience.
        </p>
      </div>
    </div>
  </div>
);

// Theme configuration
const themes: AppTheme[] = [
  { name: 'pixel', displayName: 'Pixel Art', icon: '🎮' },
  { name: 'starry', displayName: 'Starry Night', icon: '✨' },
];

// Main App Component
const AppContent: React.FC = () => {
  // State management
  const [currentTheme, setCurrentTheme] = useState<string>('pixel');
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Navigation configuration
  const navigationItems: NavigationItem[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', component: Dashboard },
    { id: 'plans', label: 'Plans', icon: '📅', component: PlansSection },
    { id: 'milestones', label: 'Milestones', icon: '🏆', component: Milestones },
    { id: 'dreams', label: 'Dreams', icon: '✨', component: Dreams },
    { id: 'bucket', label: 'Bucket List', icon: '🎒', component: Bucket },
    { id: 'moodboard', label: 'Moodboard', icon: '🎨', component: Moodboard },
    { id: 'cinema', label: 'Cinema', icon: '🎬', component: Cinema },
  ], []);

  // Effects
  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Safari-specific optimizations
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      document.documentElement.style.setProperty('--webkit-backface-visibility', 'hidden');
      document.documentElement.style.setProperty('--webkit-transform', 'translate3d(0,0,0)');
    }
  }, [currentTheme]);

  useEffect(() => {
    // Handle responsive behavior
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Simulate loading for smooth transitions
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handlers
  const handleThemeChange = useCallback((themeName: string) => {
    setCurrentTheme(themeName);
    
    // Add theme transition animation
    document.body.style.transition = 'all 0.5s ease-in-out';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 500);
  }, []);

  const handleSectionChange = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    
    // Auto-collapse sidebar on mobile after selection
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Get current component
  const CurrentComponent = useMemo(() => {
    const item = navigationItems.find(item => item.id === activeSection);
    return item?.component || Dashboard;
  }, [activeSection, navigationItems]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="pixel-spinner"></div>
          <h2 style={{ 
            fontFamily: 'var(--pixel-font-main)', 
            color: 'var(--pixel-primary)',
            textShadow: '2px 2px 0 var(--pixel-shadow-secondary)',
            marginTop: 'var(--pixel-spacing-xl)',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Loading Your Life Planner...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-section">
            <div className="brand-icon">🎮</div>
            {!sidebarCollapsed && (
              <div className="brand-text">
                <h1 className="brand-title">PixelLife</h1>
                <p className="brand-subtitle">Your Digital Life Planner</p>
              </div>
            )}
          </div>
          
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => handleSectionChange(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="theme-selector">
              <label className="theme-label">Theme</label>
              <div className="theme-buttons">
                {themes.map((theme) => (
                  <button
                    key={theme.name}
                    className={`theme-button ${currentTheme === theme.name ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme.name)}
                    title={theme.displayName}
                  >
                    <span className="theme-icon">{theme.icon}</span>
                    <span className="theme-name">{theme.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="user-section">
            <div className="user-avatar">👤</div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">Life Planner</div>
                <div className="user-status">Online</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Bar */}
        <header className="app-header">
          <div className="header-left">
            {isMobile && (
              <button 
                className="mobile-menu-button"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                ☰
              </button>
            )}
            <div className="breadcrumb">
              <span className="breadcrumb-item">Home</span>
              <span className="breadcrumb-separator">→</span>
              <span className="breadcrumb-item current">
                {navigationItems.find(item => item.id === activeSection)?.label}
              </span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-icon">⚡</span>
                <span className="stat-value">98%</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🎯</span>
                <span className="stat-value">42</span>
              </div>
            </div>
            
            <div className="header-actions">
              <button className="action-button" title="Notifications">
                🔔
              </button>
              <button className="action-button" title="Settings">
                ⚙️
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-wrapper">
          <div className="content-container">
            <CurrentComponent />
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

// Root App Component with Convex Provider
const App: React.FC = () => {
  return (
    <ConvexProvider client={convex}>
      <AppContent />
    </ConvexProvider>
  );
};

export default App;

