import { useState, useEffect } from "react";
import PlansSection from "./components/PlansSection";
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
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "012325") { // Consider moving passcode to an environment variable
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
                  {activeTab === "plans" && <PlansSection />}
                  {activeTab === "bucket-list" && <BucketListSection />}
                  {activeTab === "dreams" && <DreamsSection />}
                  {activeTab === "milestones" && <MilestonesSection />}
                  {activeTab === "cinema" && <CinemaSection />}
                  {activeTab === "mood-board" && <MoodBoardSection />}
                </div>
              </div>

              {/* iOS Tab Bar */}
              <div className="ios-tab-bar">
                <div className="ios-tab-bar-content">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`ios-tab-item ${activeTab === tab.id ? "active" : ""}`}
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
            <div className="min-h-screen p-4">
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

                  {activeTab === "plans" && <PlansSection />}
                  {activeTab === "bucket-list" && <BucketListSection />}
                  {activeTab === "dreams" && <DreamsSection />}
                  {activeTab === "milestones" && <MilestonesSection />}
                  {activeTab === "cinema" && <CinemaSection />}
                  {activeTab === "mood-board" && <MoodBoardSection />}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </ThemeProvider>
  );
}