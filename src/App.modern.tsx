import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlansSection from "./components/PlansSection.modern";
import BucketListSection from "./components/BucketListSection.modern";
import DreamsSection from "./components/DreamsSection.modern";
import MilestonesSection from "./components/MilestonesSection.modern";
import CinemaSection from "./components/CinemaSection.modern";
import MoodBoardSection from "./components/MoodBoardSection.modern";
import { ThemeProvider } from "./components/ThemeContext";

// Animation variants for smooth transitions
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 }
};

const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

// Tab configuration with modern styling
const tabs = [
  { id: "plans", label: "Plans", icon: "📅", gradient: "from-rose-400 to-pink-500" },
  { id: "bucket-list", label: "Bucket", icon: "🎯", gradient: "from-amber-400 to-orange-500" },
  { id: "dreams", label: "Dreams", icon: "✨", gradient: "from-purple-400 to-violet-500" },
  { id: "milestones", label: "Moments", icon: "💫", gradient: "from-pink-400 to-rose-500" },
  { id: "cinema", label: "Cinema", icon: "🎬", gradient: "from-indigo-400 to-purple-500" },
  { id: "mood-board", label: "Mood", icon: "💭", gradient: "from-teal-400 to-cyan-500" },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState("plans");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [shake, setShake] = useState(false);

  // Check for stored auth
  useEffect(() => {
    const stored = sessionStorage.getItem("osp-auth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (passcode === "012325") {
        setIsAuthenticated(true);
        sessionStorage.setItem("osp-auth", "true");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPasscode("");
      }
    }, 800);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "plans": return <PlansSection />;
      case "bucket-list": return <BucketListSection />;
      case "dreams": return <DreamsSection />;
      case "milestones": return <MilestonesSection />;
      case "cinema": return <CinemaSection />;
      case "mood-board": return <MoodBoardSection />;
      default: return <PlansSection />;
    }
  };

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* ===== MODERN LOGIN SCREEN ===== */
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  x: [0, 30, 0],
                  y: [0, -20, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  x: [0, -20, 0],
                  y: [0, 30, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-200/40 to-violet-200/40 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl"
              />
            </div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-full max-w-md ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
            >
              {/* Glass Card */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 md:p-10">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block text-5xl mb-4"
                  >
                    💕
                  </motion.div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                    Our Special Place
                  </h1>
                  <p className="text-gray-500 mt-2 text-sm">
                    Enter our secret code to continue
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handlePasscodeSubmit} className="space-y-6">
                  <div className="relative">
                    <input
                      type={showPasscode ? "text" : "password"}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter our secret code..."
                      className="w-full px-5 py-4 bg-white/80 border-2 border-rose-100 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 transition-all text-center text-lg tracking-widest"
                      disabled={isLoading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-400 transition-colors"
                    >
                      {showPasscode ? "🙈" : "👁️"}
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !passcode}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          💫
                        </motion.span>
                        Unlocking...
                      </span>
                    ) : (
                      "Enter Our World 💖"
                    )}
                  </motion.button>
                </form>

                {/* Hint */}
                <p className="text-center text-xs text-gray-400 mt-6">
                  🔐 Only for us two
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ===== MAIN APPLICATION ===== */
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-rose-50/80 via-pink-50/60 to-amber-50/80 pb-24 md:pb-8"
          >
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-display text-xl md:text-2xl font-bold"
                  >
                    <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                      Our Special Place
                    </span>
                    <span className="ml-2">💕</span>
                  </motion.h1>

                  {/* Desktop Navigation */}
                  <nav className="hidden md:flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-full p-1.5 border border-white/50 shadow-sm">
                    {tabs.map((tab) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? "text-white"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {activeTab === tab.id && (
                          <motion.div
                            layoutId="activeTab"
                            className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-full`}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </span>
                      </motion.button>
                    ))}
                  </nav>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-lg z-50 safe-area-bottom">
              <div className="flex justify-around items-center py-2 px-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px] ${
                      activeTab === tab.id
                        ? "text-rose-500"
                        : "text-gray-400"
                    }`}
                  >
                    <motion.span
                      animate={activeTab === tab.id ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="text-xl mb-0.5"
                    >
                      {tab.icon}
                    </motion.span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .safe-area-bottom {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
      `}</style>
    </ThemeProvider>
  );
}
