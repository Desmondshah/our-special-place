import { useState, useEffect } from "react";
import PlansSection from "./components/PlansSection";
import PlansSectionIOS from "./components/PlansSectionIOS";
import BucketListSection from "./components/BucketListSection";
import DreamsSection from "./components/DreamsSection";
import MilestonesSection from "./components/MilestonesSection";
import CinemaSection from "./components/CinemaSection";
import MoodBoardSection from "./components/MoodBoardSection";
import PixelNavBarIOS from "./components/PixelNavBarIOS";
import { ThemeProvider, useTheme } from "./components/ThemeContext";

// Create AppContent component to access theme context
function AppContent() {
  const { theme, toggleTheme } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState("plans");
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Add mobile class to body for CSS targeting
      if (mobile) {
        document.body.classList.add('mobile-device');
        document.body.classList.remove('desktop-device');
      } else {
        document.body.classList.add('desktop-device');
        document.body.classList.remove('mobile-device');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add iOS-specific body classes
  useEffect(() => {
    if (isMobile) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSChrome = /CriOS/.test(navigator.userAgent);
      const isIOSFirefox = /FxiOS/.test(navigator.userAgent);
      const isIOSSafari = /Safari/.test(navigator.userAgent) && !isIOSChrome && !isIOSFirefox;
      
      if (isIOS) {
        document.body.classList.add('ios-device');
        if (isIOSSafari) document.body.classList.add('ios-safari');
      }
      
      // Handle iOS viewport height issues
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
  }, [isMobile]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "012325") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect passcode!");
    }
  };

  const tabs = [
    { id: "plans", label: "Plans", icon: "📅", subtitle: "Our Adventures" },
    { id: "bucket-list", label: "List", icon: "🎯", subtitle: "Dream Goals" },
    { id: "dreams", label: "Dreams", icon: "✨", subtitle: "Future Wishes" },
    { id: "milestones", label: "Miles", icon: "💫", subtitle: "Memory Lane" },
    { id: "cinema", label: "Cinema", icon: "🎬", subtitle: "Movie Night" },
    { id: "mood-board", label: "Mood", icon: "💭", subtitle: "Inspiration" },
  ];

  const getCurrentTabInfo = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab ? {
      title: currentTab.label,
      icon: currentTab.icon,
      subtitle: currentTab.subtitle,
      fullTitle: `${currentTab.label} ${currentTab.icon}`
    } : { 
      title: "Our Special Place", 
      icon: "💕", 
      subtitle: "Love & Adventures",
      fullTitle: "Our Special Place 💕" 
    };
  };

  // Calculate progress for different sections
  const getTabProgress = () => {
    // You can implement actual data-driven progress here
    // This is just example logic - replace with real data
    switch (activeTab) {
      case "plans":
        // Example: Could be calculated from actual plans data
        return 75; // 75% of plans completed
      case "bucket-list":
        // Example: Could be calculated from bucket list completion
        return 45; // 45% of bucket list completed
      case "milestones":
        // Example: Could show upload progress or memory completion
        return 90; // 90% of memories documented
      case "cinema":
        // Example: Movies watched vs total movies
        return 60; // 60% of movies watched
      default:
        return undefined; // No progress bar for other tabs
    }
  };

  // Handle settings modal/sheet
  const handleSettingsPress = () => {
    if (isMobile) {
      setShowSettings(true);
    } else {
      // On desktop, could open a modal or navigate differently
      alert("Settings coming soon!");
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      setIsAuthenticated(false);
      setPasscode("");
      setActiveTab("plans");
    }
  };

  // Render the appropriate content based on active tab and device type
  const renderTabContent = () => {
    switch (activeTab) {
      case "plans":
        return isMobile ? <PlansSectionIOS /> : <PlansSection />;
      case "bucket-list":
        return <BucketListSection />;
      case "dreams":
        return <DreamsSection />;
      case "milestones":
        return <MilestonesSection />;
      case "cinema":
        return <CinemaSection />;
      case "mood-board":
        return <MoodBoardSection />;
      default:
        return isMobile ? <PlansSectionIOS /> : <PlansSection />;
    }
  };

  const currentTabInfo = getCurrentTabInfo();

  return (
    <>
      {!isAuthenticated ? (
        <div className={isMobile ? "ios-content" : "min-h-screen flex items-center justify-center p-4"}>
          <div className={isMobile ? "ios-auth-container" : "max-w-md w-full space-y-6 text-center"}>
            <h1 className="pixel-title mb-8 relative">
              Our Special Place 💕
            </h1>
            <form onSubmit={handlePasscodeSubmit} className={isMobile ? "ios-form" : "space-y-4"}>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter our special code..."
                className={isMobile ? "ios-input" : "pixel-input w-full"}
                required
              />
              <button
                type="submit"
                className={isMobile ? "ios-button ios-button-primary ios-button-full" : "pixel-button w-full"}
              >
                Enter Our Space 🔐
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {isMobile ? (
            // iOS Native Mobile Layout with PixelNavBarIOS
            <div className="ios-app-container">
              {/* New Pixel Navigation Bar */}
              <PixelNavBarIOS
                title={currentTabInfo.title}
                subtitle={currentTabInfo.subtitle}
                onThemeToggle={toggleTheme}
                showThemeToggle={true}
                showBackButton={false}
                rightAction={{
                  icon: "⚙️",
                  label: "Settings",
                  onPress: handleSettingsPress
                }}
                progress={getTabProgress()}
                statusBarStyle={theme === 'pixel' ? 'dark' : 'light'}
              />

              {/* iOS Content Area - Updated to work with new nav */}
              <div className="ios-content-with-pixel-nav">
                <div className="ios-scroll-container">
                  {renderTabContent()}
                </div>
              </div>

              {/* iOS Tab Bar - Enhanced */}
              <div className="ios-tab-bar-enhanced">
                <div className="ios-tab-bar-content">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`ios-tab-item-enhanced ${activeTab === tab.id ? "active" : ""} no-select`}
                    >
                      <div className="ios-tab-icon-enhanced">{tab.icon}</div>
                      <div className="ios-tab-label-enhanced">{tab.label}</div>
                      {activeTab === tab.id && (
                        <div className="ios-tab-active-indicator" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Bottom Sheet */}
              {showSettings && (
                <div className="settings-bottom-sheet-overlay" onClick={() => setShowSettings(false)}>
                  <div className="settings-bottom-sheet" onClick={e => e.stopPropagation()}>
                    <div className="settings-drag-indicator" />
                    
                    <h3 className="settings-sheet-title">Settings</h3>
                    
                    <div className="settings-section">
                      <div className="settings-item">
                        <div className="settings-item-content">
                          <span className="settings-item-icon">🎨</span>
                          <span className="settings-item-label">Theme</span>
                          <span className="settings-item-value">{theme === 'pixel' ? 'Pixel' : 'Starry'}</span>
                        </div>
                        <button onClick={toggleTheme} className="settings-toggle-btn">
                          Switch
                        </button>
                      </div>
                      
                      <div className="settings-item">
                        <div className="settings-item-content">
                          <span className="settings-item-icon">📱</span>
                          <span className="settings-item-label">App Version</span>
                          <span className="settings-item-value">2.0.0</span>
                        </div>
                      </div>
                      
                      <div className="settings-item">
                        <div className="settings-item-content">
                          <span className="settings-item-icon">💕</span>
                          <span className="settings-item-label">Made with Love</span>
                          <span className="settings-item-value">Always</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="settings-actions">
                      <button onClick={handleLogout} className="settings-action-btn danger">
                        <span>🚪</span> Logout
                      </button>
                      <button onClick={() => setShowSettings(false)} className="settings-action-btn primary">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Desktop Layout (unchanged)
            <div className="min-h-screen p-4 desktop-only">
              <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="pixel-title text-center mb-8 relative">
                  Our Special Place 💕
                </h1>
                
                <div className="pixel-card">
                  <div className="tab-container-cute">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button-artistic ${
                          activeTab === tab.id
                            ? "active-tab-artistic"
                            : "inactive-tab-artistic"
                        }`}
                        title={tab.label}
                      >
                        <span className="sm:hidden">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label} {tab.icon}</span>
                      </button>
                    ))}
                  </div>

                  {renderTabContent()}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// Main App component with ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}