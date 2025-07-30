import { createContext, useContext, useEffect, useState } from "react";
import geometricPattern from "@/assets/textures/geometric-pattern.jpg";
import noiseTexture from "@/assets/textures/noise-texture.jpg";
import carbonFiber from "@/assets/textures/carbon-fiber.jpg";
import abstractGeometric from "@/assets/backgrounds/abstract-geometric.jpg";
import digitalCircuit from "@/assets/backgrounds/digital-circuit.jpg";
import flowingWaves from "@/assets/backgrounds/flowing-waves.jpg";

type Theme = "default" | "ocean" | "sunset";
type BackgroundTexture = "none" | "geometric" | "noise" | "carbon" | "abstract" | "circuit" | "waves";

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
  geometric: `url(${geometricPattern})`,
  noise: `url(${noiseTexture})`,
  carbon: `url(${carbonFiber})`,
  abstract: `url(${abstractGeometric})`,
  circuit: `url(${digitalCircuit})`,
  waves: `url(${flowingWaves})`
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
    const root = document.documentElement;
    const texture = backgroundTextures[backgroundTexture];
    
    // Apply background texture to body
    if (texture === "none") {
      document.body.style.backgroundImage = "none";
    } else {
      document.body.style.backgroundImage = texture;
      
      // Different settings for textures vs background images
      if (backgroundTexture === 'abstract' || backgroundTexture === 'circuit' || backgroundTexture === 'waves') {
        // Full background images
        document.body.style.backgroundRepeat = "no-repeat";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
      } else {
        // Repeating textures
        document.body.style.backgroundRepeat = "repeat";
        document.body.style.backgroundSize = "200px 200px";
        document.body.style.backgroundAttachment = "fixed";
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