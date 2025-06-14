import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './components/ThemeContext';

// Import your existing components
import PlansSection from './components/PlansSection';
import PlansSectionIOS from './components/PlansSectionIOS';
import BucketListSection from './components/BucketListSection';
import BucketListSectionMobile from './components/BucketListSectionMobile';
import DreamsSection from './components/DreamsSection';
import MilestonesSection from './components/MilestonesSection';
import CinemaSection from './components/CinemaSection';
import MoodBoardSection from './components/MoodBoardSection';
import PixelNavBarIOS from './components/PixelNavBarIOS';

// Types
interface TabConfig {
  id: string;
  label: string;
  icon: string;
  subtitle: string;
  component: React.ComponentType;
  mobileComponent?: React.ComponentType;
}

interface AppState {
  isAuthenticated: boolean;
  activeTab: string;
  isMobile: boolean;
  showSettings: boolean;
  isLoading: boolean;
}

// Tab configurations
const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'plans',
    label: 'Plans',
    icon: '📅',
    subtitle: 'Our Adventures',
    component: PlansSection,
    mobileComponent: PlansSectionIOS
  },
  {
    id: 'bucket-list',
    label: 'Dreams',
    icon: '🎯',
    subtitle: 'Bucket List',
    component: BucketListSection,
    mobileComponent: BucketListSectionMobile
  },
  {
    id: 'dreams',
    label: 'Wishes',
    icon: '✨',
    subtitle: 'Future Dreams',
    component: DreamsSection
  },
  {
    id: 'milestones',
    label: 'Memories',
    icon: '💫',
    subtitle: 'Our Journey',
    component: MilestonesSection
  },
  {
    id: 'cinema',
    label: 'Movies',
    icon: '🎬',
    subtitle: 'Watch List',
    component: CinemaSection
  },
  {
    id: 'mood-board',
    label: 'Vibes',
    icon: '💭',
    subtitle: 'Inspiration',
    component: MoodBoardSection
  }
];

// Authentication component
const AuthenticationScreen: React.FC<{
  onAuthenticate: (passcode: string) => void;
  isMobile: boolean;
}> = ({ onAuthenticate, isMobile }) => {
  const [passcode, setPasscode] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (passcode === '012325') {
      onAuthenticate(passcode);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setPasscode('');
    }
  };

  return (
    <div className={`auth-container ${isMobile ? 'mobile' : 'desktop'} ${theme}`}>
      <div className={`auth-content ${isShaking ? 'shake' : ''}`}>
        {/* Animated background */}
        <div className="auth-bg-pattern" />
        
        {/* Logo/Title */}
        <div className="auth-header">
          <div className="auth-logo">💕</div>
          <h1 className="auth-title">Our Special Place</h1>
          <p className="auth-subtitle">Enter to continue our journey</p>
        </div>

        {/* Input Form */}
        <div className="auth-form">
          <div className="auth-input-container">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              placeholder="Enter our special code..."
              className="auth-input"
              maxLength={6}
              autoFocus
            />
            <div className="auth-input-decoration" />
          </div>
          
          <button onClick={handleSubmit} className="auth-button">
            <span className="auth-button-text">Enter Our Space</span>
            <span className="auth-button-icon">🔐</span>
          </button>
        </div>

        {/* Hint */}
        <p className="auth-hint">
          Hint: Our special date ✨
        </p>
      </div>
    </div>
  );
};

// Settings modal component
const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isMobile: boolean;
}> = ({ isOpen, onClose, onLogout, isMobile }) => {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      onLogout();
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div 
        className={`settings-modal ${isMobile ? 'mobile' : 'desktop'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h3 className="settings-title">Settings</h3>
          <button onClick={onClose} className="settings-close">✕</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h4 className="settings-section-title">Appearance</h4>
            
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">🎨</span>
                <div>
                  <div className="settings-item-label">Theme</div>
                  <div className="settings-item-description">
                    {theme === 'pixel' ? 'Pixel Art' : 'Starry Night'}
                  </div>
                </div>
              </div>
              <button onClick={toggleTheme} className="settings-toggle">
                {theme === 'pixel' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h4 className="settings-section-title">About</h4>
            
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">📱</span>
                <div>
                  <div className="settings-item-label">Version</div>
                  <div className="settings-item-description">2.0.0</div>
                </div>
              </div>
            </div>
            
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">💕</span>
                <div>
                  <div className="settings-item-label">Made with Love</div>
                  <div className="settings-item-description">Always & Forever</div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button onClick={handleLogout} className="settings-button danger">
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main app content
const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    activeTab: 'plans',
    isMobile: false,
    showSettings: false,
    isLoading: true
  });

  // Initialize app and detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setState(prev => ({ ...prev, isMobile: mobile }));
      
      // Add device classes
      document.body.classList.toggle('mobile-device', mobile);
      document.body.classList.toggle('desktop-device', !mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Simulate loading
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 1000);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle iOS specific setup
  useEffect(() => {
    if (state.isMobile) {
      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        document.body.classList.add('ios-device');
        
        // Handle viewport height for iOS
        const setVH = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
        
        return () => {
          window.removeEventListener('resize', setVH);
          window.removeEventListener('orientationchange', setVH);
        };
      }
    }
  }, [state.isMobile]);

  // Handlers
  const handleAuthenticate = (passcode: string) => {
    setState(prev => ({ ...prev, isAuthenticated: true }));
  };

  const handleLogout = () => {
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      activeTab: 'plans',
      showSettings: false
    }));
  };

  const handleTabChange = (tabId: string) => {
    setState(prev => ({ ...prev, activeTab: tabId }));
  };

  const handleSettingsToggle = () => {
    setState(prev => ({ ...prev, showSettings: !prev.showSettings }));
  };

  // Get current tab info
  const getCurrentTab = () => {
    return TAB_CONFIGS.find(tab => tab.id === state.activeTab) || TAB_CONFIGS[0];
  };

  // Render tab content
  const renderTabContent = () => {
    const currentTab = getCurrentTab();
    const Component = state.isMobile && currentTab.mobileComponent 
      ? currentTab.mobileComponent 
      : currentTab.component;
    
    return <Component />;
  };

  // Loading screen
  if (state.isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-logo">💕</div>
          <div className="loading-text">Loading our special place...</div>
          <div className="loading-spinner">
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!state.isAuthenticated) {
    return (
      <AuthenticationScreen 
        onAuthenticate={handleAuthenticate}
        isMobile={state.isMobile}
      />
    );
  }

  // Main app
  return (
    <>
      {state.isMobile ? (
        // Mobile Layout
        <div className="app-container mobile">
          {/* Navigation Bar */}
          <PixelNavBarIOS
            title={getCurrentTab().label}
            subtitle={getCurrentTab().subtitle}
            onThemeToggle={toggleTheme}
            showThemeToggle={true}
            showBackButton={false}
            rightAction={{
              icon: '⚙️',
              label: 'Settings',
              onPress: handleSettingsToggle
            }}
            statusBarStyle={theme === 'pixel' ? 'dark' : 'light'}
          />

          {/* Content */}
          <div className="app-content mobile">
            <div className="app-scroll-container">
              {renderTabContent()}
            </div>
          </div>

          {/* Tab Bar */}
          <div className="app-tab-bar">
            <div className="tab-bar-content">
              {TAB_CONFIGS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`tab-item ${state.activeTab === tab.id ? 'active' : ''}`}
                >
                  <div className="tab-icon">{tab.icon}</div>
                  <div className="tab-label">{tab.label}</div>
                  {state.activeTab === tab.id && (
                    <div className="tab-indicator" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout
        <div className="app-container desktop">
          <div className="app-header">
            <h1 className="app-title">Our Special Place 💕</h1>
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'pixel' ? '🌙' : '☀️'}
            </button>
          </div>

          <div className="app-main">
            <div className="app-sidebar">
              {TAB_CONFIGS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`sidebar-item ${state.activeTab === tab.id ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{tab.icon}</span>
                  <span className="sidebar-label">{tab.label}</span>
                  <span className="sidebar-subtitle">{tab.subtitle}</span>
                </button>
              ))}
            </div>

            <div className="app-content desktop">
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={state.showSettings}
        onClose={handleSettingsToggle}
        onLogout={handleLogout}
        isMobile={state.isMobile}
      />
    </>
  );
};

// Main App component with providers
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;