import React from "react";
import { useTheme } from "./ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="theme-toggle-container">
      <button 
        onClick={toggleTheme}
        className="theme-toggle-button"
        aria-label={`Switch to ${theme === "pixel" ? "starry" : "pixel"} theme`}
        title={`Switch to ${theme === "pixel" ? "Starry Night" : "Pixel Art"} theme`}
      >
        {theme === "pixel" ? (
          <>
            <span className="theme-icon">🌌</span>
            <span className="theme-text">Starry</span>
          </>
        ) : (
          <>
            <span className="theme-icon">🎮</span>
            <span className="theme-text">Pixel</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;