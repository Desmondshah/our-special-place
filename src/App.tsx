import { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Add dramatic loading effect
    setTimeout(() => {
      if (passcode === "012325") {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        // Enhanced error notification
        alert("💀 ACCESS DENIED! INVALID SECURITY CODE! 💀");
      }
    }, 1000);
  };

  const tabs = [
    { id: "plans", label: "PLANS", icon: "📅", color: "var(--accent-light)" },
    { id: "bucket-list", label: "BUCKET", icon: "🎯", color: "var(--button-success)" },
    { id: "dreams", label: "DREAMS", icon: "✨", color: "var(--cute-accent-primary)" },
    { id: "milestones", label: "MILES", icon: "💫", color: "var(--accent-dark)" },
    { id: "cinema", label: "CINEMA", icon: "🎬", color: "var(--cinema-accent-neon-pink)" },
    { id: "mood-board", label: "MOOD", icon: "💭", color: "var(--moodboard-pin-color)" },
  ];

  return (
    <ThemeProvider>
      {!isAuthenticated ? (
        /* ENHANCED BRUTALIST AUTHENTICATION SCREEN */
        <div className="min-h-screen flex items-center justify-center p-4 brutal-auth-bg">
          <div className="max-w-md w-full space-y-8 text-center">
            
            {/* MEGA BRUTALIST TITLE */}
            <div className="brutal-mega-card p-8 mb-12">
              <h1 className="brutal-title mb-8 relative animate-bounce" data-text="OUR SPECIAL PLACE 💕">
                OUR SPECIAL PLACE 💕
              </h1>
              
              {/* Subtitle with pixel styling */}
              <div className="brutal-text-accent text-lg mb-4">
                ⚡ SECURE ACCESS TERMINAL ⚡
              </div>
              
              {/* Decorative pixel divider */}
              <div className="brutal-divider"></div>
              
              <div className="brutal-text-secondary text-sm">
                ENTER AUTHORIZATION CODE TO PROCEED
              </div>
            </div>

            {/* ENHANCED AUTHENTICATION FORM */}
            <form onSubmit={handlePasscodeSubmit} className="space-y-8">
              <div className="brutal-form-group">
                <label className="brutal-form-label" htmlFor="passcode">
                  Security Code
                </label>
                <div className="brutal-input-container">
                  <input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="ENTER ACCESS CODE..."
                    className="brutal-input w-full"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* ENHANCED SUBMIT BUTTON */}
              <button
                type="submit"
                className="brutal-button brutal-button-primary w-full relative"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="brutal-loading"></div>
                    <span>AUTHENTICATING...</span>
                  </div>
                ) : (
                  "⚡ BREACH SECURITY SYSTEM ⚡"
                )}
              </button>
            </form>

            {/* DECORATIVE SECURITY NOTICE */}
            <div className="brutal-notification">
              <div className="brutal-text-secondary text-xs pl-8">
                UNAUTHORIZED ACCESS PROHIBITED<br/>
                ALL ACTIVITIES MONITORED & LOGGED
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ENHANCED MAIN APPLICATION */
        <div className="min-h-[100dvh] p-4 pb-24 brutal-main-bg">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* ENHANCED MAIN TITLE */}
            <div className="text-center mb-12">
              <h1 className="brutal-title relative mb-4" data-text="OUR SPECIAL PLACE 💕">
                OUR SPECIAL PLACE 💕
              </h1>
              <div className="brutal-text-accent text-lg">
                ⭐ RELATIONSHIP COMMAND CENTER ⭐
              </div>
              <div className="brutal-divider mt-8"></div>
            </div>
            
            {/* ENHANCED MAIN CONTAINER */}
            <div className="brutal-main-container p-6">
              
              {/* ENHANCED DESKTOP NAVIGATION */}
              <div className="brutal-tab-container desktop-nav hidden sm:flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`brutal-tab-button ${
                      activeTab === tab.id
                        ? "brutal-tab-active"
                        : "brutal-tab-inactive"
                    }`}
                    title={tab.label}
                    style={{ 
                      '--tab-color': tab.color 
                    } as React.CSSProperties}
                  >
                    <span className="sm:hidden brutal-tab-icon text-xl">{tab.icon}</span>
                    <span className="hidden sm:inline brutal-tab-text">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* ENHANCED CONTENT AREA */}
              <div className="brutal-content-area">
                {activeTab === "plans" && (
                  <div className="animate-[brutalZoom_0.5s_ease-out]">
                    <PlansSection />
                  </div>
                )}
                {activeTab === "bucket-list" && (
                  <div className="animate-[brutalSlideIn_0.5s_ease-out]">
                    <BucketListSection />
                  </div>
                )}
                {activeTab === "dreams" && (
                  <div className="animate-[brutalZoom_0.5s_ease-out]">
                    <DreamsSection />
                  </div>
                )}
                {activeTab === "milestones" && (
                  <div className="animate-[brutalSlideIn_0.5s_ease-out]">
                    <MilestonesSection />
                  </div>
                )}
                {activeTab === "cinema" && (
                  <div className="animate-[brutalZoom_0.5s_ease-out]">
                    <CinemaSection />
                  </div>
                )}
                {activeTab === "mood-board" && (
                  <div className="animate-[brutalSlideIn_0.5s_ease-out]">
                    <MoodBoardSection />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ENHANCED MOBILE NAVIGATION */}
          <nav className="brutal-bottom-nav sm:hidden" aria-label="Mobile navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`brutal-mobile-tab ${
                  activeTab === tab.id ? "brutal-mobile-tab-active" : "brutal-mobile-tab-inactive"
                }`}
                title={tab.label}
                data-icon={tab.icon}
                data-label={tab.label}
                style={{ 
                  '--tab-color': tab.color 
                } as React.CSSProperties}
              >
                <span className="brutal-mobile-icon">{tab.icon}</span>
                <span className="brutal-mobile-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </ThemeProvider>
  );
}
