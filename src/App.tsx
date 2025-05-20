import { useState } from "react";
import PlansSection from "./components/PlansSection";
import BucketListSection from "./components/BucketListSection";
import DreamsSection from "./components/DreamsSection";
import MilestonesSection from "./components/MilestonesSection";
import CinemaSection from "./components/CinemaSection";
import MoodBoardSection from "./components/MoodBoardSection";
import ThemeToggle from "./components/ThemeToggle";
import StarryBackground from "./components/StarryBackground";
import ThemeTransition from "./components/ThemeTransition";
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
    { id: "plans", label: "Plans 📅", icon: "📅" },
    { id: "bucket-list", label: "List 🎯", icon: "🎯" },
    { id: "dreams", label: "Dreams ✨", icon: "✨" },
    { id: "milestones", label: "Miles 💫", icon: "💫" },
    { id: "cinema", label: "Cinema 🎬", icon: "🎬" },
    { id: "mood-board", label: "Mood 💭", icon: "💭" },
  ];

  return (
    <ThemeProvider>
      <ThemeToggle />
      <StarryBackground />
      <ThemeTransition />
      
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
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="pixel-title text-center mb-8 relative">
              Our Special Place 💕
            </h1>
            
            {/* Apply new styles to the pixel-card and tab container */}
            <div className="pixel-card"> {/* Ensure this has some padding, e.g., p-4 or p-6 from your CSS */}
              {/* Updated tab container with new class */}
              <div className="tab-container-cute">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    // Apply new classes to buttons
                    className={`tab-button-artistic ${
                      activeTab === tab.id
                        ? "active-tab-artistic" // New class for active tab
                        : "inactive-tab-artistic" // New class for inactive tab
                    }`}
                    title={tab.label} // Add title for accessibility and hover
                  >
                    {/* Using only icon for smaller tabs, or icon + text based on screen size */}
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
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}
