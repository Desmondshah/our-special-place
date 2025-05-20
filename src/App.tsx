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
    if (passcode === "012325") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect passcode!");
    }
  };

  return (
    <ThemeProvider>
      {/* Theme Toggle visible regardless of authentication */}
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
            
            <div className="pixel-card p-6">
              {/* Updated tab container with mobile-only scroll */}
              <div className="flex flex-row gap-1 sm:gap-2 mb-6 sm:overflow-hidden overflow-x-auto">
                {["plans", "bucket-list", "dreams", "milestones", "cinema", "mood-board"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pixel-button whitespace-nowrap text-xs sm:text-base px-2 sm:px-4 py-2 flex-1 ${
                      activeTab === tab
                        ? "active-tab"
                        : "inactive-tab"
                    }`}
                  >
                    {tab === "plans" && "Plans 📅"}
                    {tab === "bucket-list" && "List 🎯"}
                    {tab === "dreams" && "Dreams ✨"}
                    {tab === "milestones" && "Miles 💫"}
                    {tab === "cinema" && "Cinema 🎬"}
                    {tab === "mood-board" && "Mood 💭"}
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