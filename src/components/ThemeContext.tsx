import React, { createContext, useState, useContext, useEffect } from "react";

type ThemeType = "pixel" | "starry" | "ios";

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to get theme from localStorage, default to pixel if not found
  const [theme, setTheme] = useState<ThemeType>(() => {
  const savedTheme = localStorage.getItem("theme") as ThemeType | null;
  // Always default to 'pixel' if no theme is saved in localStorage.
  return savedTheme || "pixel";
});

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === "ios") return "pixel";
      if (prevTheme === "pixel") return "starry";
      return "ios";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};