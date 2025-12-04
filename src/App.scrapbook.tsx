import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlansSection from "./components/PlansSection.scrapbook.tsx";
import BucketListSection from "./components/BucketListSection.scrapbook.tsx";
import DreamsSection from "./components/DreamsSection.scrapbook.tsx";
import MilestonesSection from "./components/MilestonesSection.scrapbook.tsx";
import CinemaSection from "./components/CinemaSection.scrapbook.tsx";
import MoodBoardSection from "./components/MoodBoardSection.scrapbook.tsx";
import { ThemeProvider } from "./components/ThemeContext";

// Performance: Detect if we should reduce animations
const useReducedMotion = () => {
  const [shouldReduce, setShouldReduce] = useState(false);
  
  useEffect(() => {
    // Check for iOS/mobile or prefers-reduced-motion
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setShouldReduce(isIOS || isMobile || prefersReduced);
    
    // Listen for changes in preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setShouldReduce(e.matches || isIOS || isMobile);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return shouldReduce;
};

// Decorative elements
const WashiTape = ({ color, rotation, className }: { color: string; rotation: number; className?: string }) => {
  const colors: Record<string, string> = {
    pink: "bg-gradient-to-r from-pink-300 via-pink-200 to-pink-300",
    mint: "bg-gradient-to-r from-teal-200 via-emerald-200 to-teal-200",
    lavender: "bg-gradient-to-r from-purple-200 via-violet-200 to-purple-200",
    yellow: "bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-200",
    peach: "bg-gradient-to-r from-orange-200 via-amber-100 to-orange-200",
  };
  
  return (
    <div 
      className={`h-6 w-24 ${colors[color]} opacity-80 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    />
  );
};

const Sticker = memo(({ emoji, size = "text-2xl", className, reduceMotion = false }: { emoji: string; size?: string; className?: string; reduceMotion?: boolean }) => (
  reduceMotion ? (
    <span className={`${size} ${className}`}>{emoji}</span>
  ) : (
    <motion.span 
      className={`${size} ${className}`}
      whileHover={{ scale: 1.2, rotate: 10 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {emoji}
    </motion.span>
  )
));

const PushPin = ({ color = "red", className }: { color?: string; className?: string }) => {
  const colors: Record<string, string> = {
    red: "from-red-400 to-red-600",
    blue: "from-blue-400 to-blue-600",
    yellow: "from-yellow-400 to-yellow-600",
    green: "from-green-400 to-green-600",
    pink: "from-pink-400 to-pink-600",
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${colors[color]} shadow-md`}>
        <div className="absolute inset-1 rounded-full bg-white/30" />
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-2 bg-gradient-to-b from-gray-400 to-gray-600 rounded-b" />
    </div>
  );
};

// Tab configuration
const tabs = [
  { id: "plans", label: "Adventures", icon: "🗺️", stickerColor: "bg-amber-100" },
  { id: "bucket-list", label: "Bucket List", icon: "✨", stickerColor: "bg-pink-100" },
  { id: "dreams", label: "Dreams", icon: "🌙", stickerColor: "bg-purple-100" },
  { id: "milestones", label: "Memories", icon: "📸", stickerColor: "bg-rose-100" },
  { id: "cinema", label: "Movies", icon: "🎬", stickerColor: "bg-blue-100" },
  { id: "mood-board", label: "Mood Board", icon: "💭", stickerColor: "bg-teal-100" },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState("plans");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Performance optimization
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const stored = sessionStorage.getItem("osp-auth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasscodeSubmit = useCallback((e: React.FormEvent) => {
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
  }, [passcode]);

  // Memoize tab content to prevent unnecessary re-renders
  const renderContent = useMemo(() => {
    switch (activeTab) {
      case "plans": return <PlansSection />;
      case "bucket-list": return <BucketListSection />;
      case "dreams": return <DreamsSection />;
      case "milestones": return <MilestonesSection />;
      case "cinema": return <CinemaSection />;
      case "mood-board": return <MoodBoardSection />;
      default: return <PlansSection />;
    }
  }, [activeTab]);
  
  // Memoized animation props
  const pageTransition = useMemo(() => 
    reduceMotion 
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.1 } }
      : { initial: { opacity: 0, y: 20, rotate: -1 }, animate: { opacity: 1, y: 0, rotate: 0 }, exit: { opacity: 0, y: -20, rotate: 1 }, transition: { duration: 0.3 } }
  , [reduceMotion]);

  return (
    <ThemeProvider>
      <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #d4a574 0%, #c4956a 50%, #b8865a 100%)' }}>
        {/* Cork board texture overlay */}
        <div 
          className="fixed inset-0 opacity-[0.08] pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            /* ===== SCRAPBOOK LOGIN ===== */
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex items-center justify-center p-4 relative z-10"
            >
              {/* Floating decorations - CSS animations for better performance */}
              {!reduceMotion && (
                <>
                  <div className="absolute top-20 left-10 text-4xl animate-float-1">💕</div>
                  <div className="absolute top-32 right-16 text-3xl animate-float-2">✨</div>
                  <div className="absolute bottom-32 left-20 text-3xl animate-float-3">🌸</div>
                </>
              )}

              <motion.div
                initial={{ y: 30, opacity: 0, rotate: -2 }}
                animate={{ y: 0, opacity: 1, rotate: -2 }}
                className={`w-full max-w-sm ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
              >
                {/* Main Card - Polaroid Style */}
                <div 
                  className="bg-white p-4 pb-8 shadow-2xl relative"
                  style={{ transform: 'rotate(-2deg)' }}
                >
                  {/* Push pin */}
                  <PushPin color="red" className="absolute -top-2 left-1/2 -translate-x-1/2 z-20" />
                  
                  {/* Washi tape decorations */}
                  <div className="absolute -top-3 -left-4 w-20 h-6 bg-gradient-to-r from-pink-300 to-pink-200 opacity-80" style={{ transform: 'rotate(-45deg)' }} />
                  <div className="absolute -top-3 -right-4 w-20 h-6 bg-gradient-to-r from-yellow-200 to-amber-100 opacity-80" style={{ transform: 'rotate(45deg)' }} />
                  
                  {/* Inner content area */}
                  <div className="bg-[#fdf6e3] p-6 rounded relative overflow-hidden">
                    {/* Lined paper effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e5d5c0 27px, #e5d5c0 28px)',
                      }}
                    />
                    
                    <div className="relative z-10">
                      {/* Title with stickers */}
                      <div className="text-center mb-6">
                        <div className={`text-5xl mb-3 ${reduceMotion ? '' : 'animate-pulse-gentle'}`}>
                          📔
                        </div>
                        <h1 
                          className="text-3xl text-gray-800 mb-1"
                          style={{ fontFamily: "'Caveat', cursive" }}
                        >
                          Our Special Place
                        </h1>
                        <p 
                          className="text-gray-500 text-sm"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          ~ a love story in pages ~
                        </p>
                      </div>

                      {/* Passcode Form */}
                      <form onSubmit={handlePasscodeSubmit} className="space-y-5">
                        <div>
                          <label 
                            className="block text-sm text-amber-700 mb-2"
                            style={{ fontFamily: "'Patrick Hand', cursive" }}
                          >
                            Enter our secret code... 🤫
                          </label>
                          <input
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            className="w-full px-4 py-3 bg-white/80 border-2 border-dashed border-amber-300 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:border-pink-400 transition-colors"
                            style={{ fontFamily: "'Caveat', cursive" }}
                            placeholder="• • • • • •"
                            disabled={isLoading}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || !passcode}
                          className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full shadow-lg disabled:opacity-50 transition-all active:scale-95"
                          style={{ 
                            fontFamily: "'Patrick Hand', cursive",
                            fontSize: '18px',
                            boxShadow: '0 4px 0 #d4547a, 0 6px 12px rgba(0,0,0,0.15)'
                          }}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className={reduceMotion ? '' : 'animate-spin'}>📖</span>
                              Opening...
                            </span>
                          ) : (
                            "Open Our Scrapbook 💖"
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Polaroid caption */}
                  <p 
                    className="text-center mt-4 text-gray-600"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}
                  >
                    ♥ Just for us two ♥
                  </p>
                </div>

                {/* Scattered stickers around the card */}
                {!reduceMotion && (
                  <>
                    <div className="absolute -bottom-6 -right-6 text-4xl animate-wiggle">💝</div>
                    <div className="absolute -top-8 -left-4 text-2xl" style={{ transform: 'rotate(-15deg)' }}>⭐</div>
                  </>
                )}
              </motion.div>
            </motion.div>
          ) : (
            /* ===== MAIN SCRAPBOOK APP ===== */
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-screen pb-24 md:pb-8 relative z-10"
            >
              {/* Header - Notebook Style */}
              <header className="sticky top-0 z-40 bg-[#fdf6e3] shadow-lg border-b-4 border-amber-200">
                {/* Spiral binding effect */}
                <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-around py-2 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-400 shadow-inner" />
                  ))}
                </div>

                <div className="max-w-6xl mx-auto px-4 pl-12 py-4">
                  <div className="flex items-center justify-between">
                    {/* Title with decorations */}
                    <div className="flex items-center gap-3">
                      <span className={`text-3xl ${reduceMotion ? '' : 'animate-wiggle'}`}>
                        📔
                      </span>
                      <div>
                        <h1 
                          className="text-2xl md:text-3xl text-gray-800"
                          style={{ fontFamily: "'Caveat', cursive" }}
                        >
                          Our Special Place
                        </h1>
                        <p 
                          className="text-xs text-amber-600 -mt-1 hidden sm:block"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          A collection of our favorite moments ✨
                        </p>
                      </div>
                    </div>

                    {/* Desktop Navigation - Tab stickers */}
                    <nav className="hidden lg:flex items-center gap-2">
                      {tabs.map((tab, index) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative px-4 py-2 rounded-lg transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${
                            activeTab === tab.id
                              ? `${tab.stickerColor} shadow-md border-2 border-white`
                              : "bg-white/60 hover:bg-white/80"
                          }`}
                          style={{ 
                            fontFamily: "'Patrick Hand', cursive",
                            transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)`,
                          }}
                        >
                          <span className="mr-1">{tab.icon}</span>
                          <span className="text-gray-700">{tab.label}</span>
                          {activeTab === tab.id && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs">♥</span>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Decorative washi tape border */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-200 via-yellow-200 via-teal-200 to-purple-200 opacity-60" />
              </header>

              {/* Main Content Area */}
              <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Page corner decoration */}
                {!reduceMotion && (
                  <div className="absolute top-24 right-4 hidden md:block">
                    <div className="text-4xl opacity-50 animate-float-1">📎</div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    {...pageTransition}
                    className="gpu-accelerate"
                  >
                    {renderContent}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Mobile Bottom Navigation - Sticky tabs */}
              <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fdf6e3] border-t-4 border-amber-200 shadow-2xl z-50 safe-area-bottom">
                {/* Top washi tape decoration */}
                <div className="absolute -top-2 left-0 right-0 h-4 bg-gradient-to-r from-pink-200 via-yellow-200 to-teal-200 opacity-70" 
                  style={{ clipPath: 'polygon(0 40%, 2% 60%, 4% 40%, 6% 60%, 8% 40%, 10% 60%, 12% 40%, 14% 60%, 16% 40%, 18% 60%, 20% 40%, 22% 60%, 24% 40%, 26% 60%, 28% 40%, 30% 60%, 32% 40%, 34% 60%, 36% 40%, 38% 60%, 40% 40%, 42% 60%, 44% 40%, 46% 60%, 48% 40%, 50% 60%, 52% 40%, 54% 60%, 56% 40%, 58% 60%, 60% 40%, 62% 60%, 64% 40%, 66% 60%, 68% 40%, 70% 60%, 72% 40%, 74% 60%, 76% 40%, 78% 60%, 80% 40%, 82% 60%, 84% 40%, 86% 60%, 88% 40%, 90% 60%, 92% 40%, 94% 60%, 96% 40%, 98% 60%, 100% 40%, 100% 100%, 0% 100%)' }}
                />
                
                <div className="flex justify-around items-center py-2 px-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center py-2 px-2 rounded-lg transition-all active:scale-90 min-w-[50px] ${
                        activeTab === tab.id
                          ? `${tab.stickerColor} shadow-sm`
                          : ""
                      }`}
                    >
                      <span className={`text-xl mb-0.5 ${activeTab === tab.id ? "scale-110" : ""} transition-transform`}>
                        {tab.icon}
                      </span>
                      <span 
                        className={`text-[10px] ${activeTab === tab.id ? "text-gray-800" : "text-gray-500"}`}
                        style={{ fontFamily: "'Patrick Hand', cursive" }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(-2deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-2deg); }
          20%, 40%, 60%, 80% { transform: translateX(4px) rotate(-2deg); }
        }
        
        /* Floating animations with CSS for better performance */
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-5deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        
        .animate-float-1 {
          animation: float-1 4s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float-3 {
          animation: float-3 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        /* Gentle pulse animation */
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        
        /* Wiggle animation */
        @keyframes wiggle {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .animate-wiggle {
          animation: wiggle 3s ease-in-out infinite;
        }
        
        /* GPU acceleration */
        .gpu-accelerate {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-float-1,
          .animate-float-2,
          .animate-float-3,
          .animate-pulse-gentle,
          .animate-wiggle,
          .animate-spin {
            animation: none;
          }
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
        
        .safe-area-bottom {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
      `}</style>
    </ThemeProvider>
  );
}
