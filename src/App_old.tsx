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

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "012325") { // Consider moving passcode to an environment variable
      setIsAuthenticated(true);
    } else {
      alert("INCORRECT PASSCODE! ACCESS DENIED!");
    }
  };

  const tabs = [
    { id: "plans", label: "PLANS", icon: "📅" },
    { id: "bucket-list", label: "BUCKET", icon: "🎯" },
    { id: "dreams", label: "DREAMS", icon: "✨" },
    { id: "milestones", label: "MILES", icon: "💫" },
    { id: "cinema", label: "CINEMA", icon: "🎬" },
    { id: "mood-board", label: "MOOD", icon: "💭" },
  ];

  return (
    <ThemeProvider>
      
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center p-4 brutal-auth-bg">
          <div className="max-w-md w-full space-y-8 text-center">
            <h1 className="brutal-title mb-12 relative" data-text="OUR SPECIAL PLACE 💕">
              OUR SPECIAL PLACE 💕
            </h1>
            <form onSubmit={handlePasscodeSubmit} className="space-y-6">
              <div className="brutal-input-container">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="ENTER ACCESS CODE..."
                  className="brutal-input w-full"
                  required
                />
              </div>
              <button
                type="submit"
                className="brutal-button brutal-button-primary w-full"
              >
                ⚡ BREACH SECURITY ⚡
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="min-h-[100dvh] p-4 pb-20 brutal-main-bg">
          <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="brutal-title text-center mb-12 relative" data-text="OUR SPECIAL PLACE 💕">
              OUR SPECIAL PLACE 💕
            </h1>
            
            <div className="brutal-card brutal-main-container">
              {/* Desktop navigation - BRUTALIST TABS */}
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
                  >
                    <span className="sm:hidden brutal-tab-icon">{tab.icon}</span>
                    <span className="hidden sm:inline brutal-tab-text">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content sections */}
              <div className="brutal-content-area">
                {activeTab === "plans" && <PlansSection />}
                {activeTab === "bucket-list" && <BucketListSection />}
                {activeTab === "dreams" && <DreamsSection />}
                {activeTab === "milestones" && <MilestonesSection />}
                {activeTab === "cinema" && <CinemaSection />}
                {activeTab === "mood-board" && <MoodBoardSection />}
              </div>
            </div>
            
            {/* Bottom navigation for mobile - BRUTALIST STYLE */}
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
                >
                  <span className="brutal-mobile-icon">{tab.icon}</span>
                  <span className="brutal-mobile-label">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}
                  className={`tab-button-artistic ${
                    activeTab === tab.id ? "active-tab-artistic" : "inactive-tab-artistic"
                  }`}
                  title={tab.label}
                  data-icon={tab.icon}
                  data-label={tab.label}
                >
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}