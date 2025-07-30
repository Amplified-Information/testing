import { createContext, useContext, useEffect, useState } from "react";

type Theme = "default" | "ocean" | "sunset";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeColors = {
  default: {
    primary: "142 76% 36%",
    primaryGlow: "142 76% 45%",
    ring: "142 76% 36%",
    up: "142 76% 36%",
    yes: "142 76% 36%",
  },
  ocean: {
    primary: "200 95% 40%",
    primaryGlow: "200 95% 50%", 
    ring: "200 95% 40%",
    up: "200 95% 40%",
    yes: "200 95% 40%",
  },
  sunset: {
    primary: "25 95% 53%",
    primaryGlow: "25 95% 63%",
    ring: "25 95% 53%", 
    up: "25 95% 53%",
    yes: "25 95% 53%",
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("hedera-theme");
    return (stored as Theme) || "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    const colors = themeColors[theme];
    
    // Update CSS variables
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-glow", colors.primaryGlow);
    root.style.setProperty("--ring", colors.ring);
    root.style.setProperty("--up", colors.up);
    root.style.setProperty("--yes", colors.yes);
    
    // Update gradient
    root.style.setProperty(
      "--gradient-primary", 
      `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.primaryGlow}) 100%)`
    );
    
    // Update glow shadow
    root.style.setProperty(
      "--shadow-glow", 
      `0 0 20px hsl(${colors.primary} / 0.3)`
    );

    // Store in localStorage
    localStorage.setItem("hedera-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}