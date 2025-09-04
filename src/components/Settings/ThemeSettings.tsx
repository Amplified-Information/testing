import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  {
    name: "Default",
    value: "default",
    primary: "hsl(142 76% 36%)",
    description: "Green-focused trading theme"
  },
  {
    name: "Ocean",
    value: "ocean", 
    primary: "hsl(200 95% 40%)",
    description: "Cool blue ocean theme"
  },
  {
    name: "Sunset",
    value: "sunset",
    primary: "hsl(25 95% 53%)",
    description: "Warm orange sunset theme"
  }
];

const backgroundTextures = [
  {
    name: "None",
    value: "none",
    description: "Clean solid background",
    preview: null
  }
];

interface ThemeSettingsProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  currentTexture: string;
  onTextureChange: (texture: string) => void;
}

const ThemeSettings = ({ currentTheme, onThemeChange, currentTexture, onTextureChange }: ThemeSettingsProps) => {
  return (
    <div className="space-y-8">
      {/* Color Theme Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Color Theme</h3>
          <p className="text-sm text-muted-foreground">
            Choose your preferred color theme for the interface
          </p>
        </div>
        
        <div className="grid gap-3">
          {themes.map((theme) => (
            <Button
              key={theme.value}
              variant="outline"
              onClick={() => onThemeChange(theme.value)}
              className={cn(
                "h-auto p-4 justify-start text-left relative",
                currentTheme === theme.value && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-start space-x-3 w-full">
                <div 
                  className="w-4 h-4 rounded-full mt-1 border-2 border-border"
                  style={{ backgroundColor: theme.primary }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {theme.description}
                  </div>
                </div>
                {currentTheme === theme.value && (
                  <Check className="h-4 w-4 text-primary mt-1" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Background Texture Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Background Texture</h3>
          <p className="text-sm text-muted-foreground">
            Add subtle texture to enhance the visual appeal
          </p>
        </div>
        
        <div className="grid gap-3">
          {backgroundTextures.map((texture) => (
            <Button
              key={texture.value}
              variant="outline"
              onClick={() => onTextureChange(texture.value)}
              className={cn(
                "h-auto p-4 justify-start text-left relative",
                currentTexture === texture.value && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-start space-x-3 w-full">
                <div 
                  className="w-8 h-8 rounded mt-1 border-2 border-border bg-muted"
                  style={{
                    backgroundImage: texture.preview ? `url(${texture.preview})` : 'none',
                    backgroundSize: '16px 16px',
                    backgroundRepeat: 'repeat',
                    backgroundPosition: 'center'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{texture.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {texture.description}
                  </div>
                </div>
                {currentTexture === texture.value && (
                  <Check className="h-4 w-4 text-primary mt-1" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;