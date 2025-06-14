import { useState, useEffect } from "react";
import PlansSection from "./components/PlansSection";
import PlansSectionIOS from "./components/PlansSectionIOS"; // New iOS Plans Component
import BucketListSection from "./components/BucketListSection";
import DreamsSection from "./components/DreamsSection";
import MilestonesSection from "./components/MilestonesSection";
import CinemaSection from "./components/CinemaSection";
import MoodBoardSection from "./components/MoodBoardSection";
import { ThemeProvider } from "./components/ThemeContext";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState("plans");
  const [isMobile, setIsMobile] = useState(false);

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
    { id: "plans", label: "Plans", icon: "📅" },
    { id: "bucket-list", label: "List", icon: "🎯" },
    { id: "dreams", label: "Dreams", icon: "✨" },
    { id: "milestones", label: "Miles", icon: "💫" },
    { id: "cinema", label: "Cinema", icon: "🎬" },
    { id: "mood-board", label: "Mood", icon: "💭" },
  ];

  const getCurrentTabTitle = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab ? `${currentTab.label} ${currentTab.icon}` : "Our Special Place 💕";
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

  return (
    <ThemeProvider>
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
            // iOS Native Mobile Layout
            <div className="ios-app-container">
              {/* iOS Navigation Bar */}
              <div className="ios-nav-bar">
                <div className="ios-nav-content">
                  <div className="ios-nav-title">{getCurrentTabTitle()}</div>
                </div>
              </div>

              {/* iOS Content Area */}
              <div className="ios-content">
                <div className="ios-scroll-container">
                  {renderTabContent()}
                </div>
              </div>

              {/* iOS Tab Bar */}
              <div className="ios-tab-bar">
                <div className="ios-tab-bar-content">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`ios-tab-item ${activeTab === tab.id ? "active" : ""} no-select`}
                    >
                      <div className="ios-tab-icon">{tab.icon}</div>
                      <div className="ios-tab-label">{tab.label}</div>
                    </button>
                  ))}
                </div>
              </div>
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
    </ThemeProvider>
  );
}