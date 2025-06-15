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

  return (
    <ThemeProvider>
      
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <h1 className="pixel-title mb-8 relative">
              Our Special Place 💕
            </h1>
            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter our special code..."
                className="pixel-input w-full"
                required
              />
              <button
                type="submit"
                className="pixel-button w-full"
              >
                Enter Our Space 🔐
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="min-h-[100dvh] p-4 pb-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="pixel-title text-center mb-8 relative">
              Our Special Place 💕
            </h1>
            
            <div className="pixel-card">
              {/* Desktop navigation */}
              <div className="tab-container-cute desktop-nav hidden sm:flex">
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
                    <span className="hidden sm:inline">{tab.label}</span>
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
            
            {/* Bottom navigation for mobile - Fixed with iOS styling */}
            <nav className="bottom-nav-cute ios-bottom-nav sm:hidden" aria-label="Mobile navigation">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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