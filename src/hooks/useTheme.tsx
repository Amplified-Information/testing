import { createContext, useContext, useEffect, useState } from "react";
import carbonFiber from "@/assets/textures/carbon-fiber.jpg";
import abstractGeometric from "@/assets/backgrounds/abstract-geometric.jpg";
import digitalCircuit from "@/assets/backgrounds/digital-circuit.jpg";
import flowingWaves from "@/assets/backgrounds/flowing-waves.jpg";
import nightSky from "@/assets/backgrounds/night-sky.jpg";

type Theme = "default" | "ocean" | "sunset";
type BackgroundTexture = "none" | "carbon" | "abstract" | "circuit" | "waves" | "nightsky";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  backgroundTexture: BackgroundTexture;
  setBackgroundTexture: (texture: BackgroundTexture) => void;
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

const backgroundTextures = {
  none: "none",
  carbon: `url(${carbonFiber})`,
  abstract: `url(${abstractGeometric})`,
  circuit: `url(${digitalCircuit})`,
  waves: `url(${flowingWaves})`,
  nightsky: `url(${nightSky})`
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("hedera-theme");
    return (stored as Theme) || "default";
  });

  const [backgroundTexture, setBackgroundTexture] = useState<BackgroundTexture>(() => {
    const stored = localStorage.getItem("hedera-background-texture");
    return (stored as BackgroundTexture) || "none";
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

  useEffect(() => {
    const texture = backgroundTextures[backgroundTexture];
    
    // Apply background texture directly to body with proper cleanup
    const body = document.body;
    
    if (texture === "none") {
      body.style.backgroundImage = "none";
      body.style.backgroundSize = "";
      body.style.backgroundRepeat = "";
      body.style.backgroundPosition = "";
      body.style.backgroundAttachment = "";
    } else {
      body.style.backgroundImage = texture;
      
      // Different settings for textures vs background images
      if (backgroundTexture === 'abstract' || backgroundTexture === 'circuit' || backgroundTexture === 'waves' || backgroundTexture === 'nightsky') {
        // Full background images
        body.style.backgroundRepeat = "no-repeat";
        body.style.backgroundSize = "cover";
        body.style.backgroundPosition = "center";
        body.style.backgroundAttachment = "fixed";
      } else {
        // Repeating textures
        body.style.backgroundRepeat = "repeat";
        body.style.backgroundSize = "200px 200px";
        body.style.backgroundPosition = "center";
        body.style.backgroundAttachment = "fixed";
      }
    }

    // Store in localStorage
    localStorage.setItem("hedera-background-texture", backgroundTexture);
  }, [backgroundTexture]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, backgroundTexture, setBackgroundTexture }}>
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