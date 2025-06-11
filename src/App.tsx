import { useState } from "react";
import PlansSection from "./components/PlansSection";
import BucketListSection from "./components/BucketListSection";
import DreamsSection from "./components/DreamsSection";
import MilestonesSection from "./components/MilestonesSection";
import CinemaSection from "./components/CinemaSection";
import MoodBoardSection from "./components/MoodBoardSection";

// Main App component wrapped with ThemeProvider
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState("plans");

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // IMPORTANT: This is not a secure way to handle passcodes in a real application.
    // This should be replaced with a proper authentication mechanism.
    if (passcode === "012325") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect passcode!");
    }
  };

  const tabs = [
    { id: "plans", label: "Plans 📅", icon: "📅", component: <PlansSection /> },
    { id: "bucket-list", label: "List 🎯", icon: "🎯", component: <BucketListSection /> },
    { id: "dreams", label: "Dreams ✨", icon: "✨", component: <DreamsSection /> },
    { id: "milestones", label: "Miles 💫", icon: "💫", component: <MilestonesSection /> },
    { id: "cinema", label: "Cinema 🎬", icon: "🎬", component: <CinemaSection /> },
    { id: "mood-board", label: "Mood 💭", icon: "💭", component: <MoodBoardSection /> },
  ];

  const renderActiveTabContent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab ? currentTab.component : null;
  };

  return (
    <>
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
             
              // Pixel theme: Render tabbed layout
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
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
                {renderActiveTabContent()}
              </div>
      )}
    </>
  );
}
