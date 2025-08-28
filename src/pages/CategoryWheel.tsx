import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Zap,
  Globe,
  Briefcase,
  Gamepad2,
  Activity,
  Heart,
  TreePine,
  Building2,
  Microscope,
  Stethoscope,
  MapPin,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  label: string;
  icon: any;
  count: number;
  color: string;
  volume: number;
  trending: number;
}

const CategoryWheel = () => {
  const navigate = useNavigate();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const getIconForCategory = (name: string) => {
    const iconMap: { [key: string]: any } = {
      'Politics': Trophy,
      'Sports': Activity,
      'Culture': Heart,
      'Crypto': TrendingUp,
      'Climate': TreePine,
      'Economics': DollarSign,
      'Mentions': Activity,
      'Companies': Building2,
      'Financials': Briefcase,
      'Tech & Science': Microscope,
      'Health': Stethoscope,
      'World': MapPin
    };
    return iconMap[name] || Globe;
  };

  const getColorForCategory = (name: string) => {
    const colorMap: { [key: string]: string } = {
      'Politics': 'hsl(0 84% 60%)',
      'Sports': 'hsl(142 76% 36%)',
      'Culture': 'hsl(330 76% 45%)',
      'Crypto': 'hsl(45 84% 60%)',
      'Climate': 'hsl(120 60% 45%)',
      'Economics': 'hsl(210 76% 45%)',
      'Mentions': 'hsl(280 76% 45%)',
      'Companies': 'hsl(190 76% 45%)',
      'Financials': 'hsl(260 76% 45%)',
      'Tech & Science': 'hsl(160 76% 45%)',
      'Health': 'hsl(300 76% 45%)',
      'World': 'hsl(20 84% 60%)'
    };
    return colorMap[name] || 'hsl(142 76% 36%)';
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('market_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        const dbCategories = data?.map((category, index) => ({
          id: category.name.toLowerCase().replace(/\s+/g, '-').replace('&', ''),
          label: category.name,
          icon: getIconForCategory(category.name),
          count: Math.floor(Math.random() * 200) + 50,
          color: getColorForCategory(category.name),
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          trending: (Math.random() - 0.5) * 20
        })) || [];

        setCategories(dbCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Physics animation for momentum scrolling
  useEffect(() => {
    const animate = () => {
      if (!isDragging && Math.abs(velocity) > 0.1) {
        setRotation(prev => prev + velocity);
        setVelocity(prev => prev * 0.95); // Friction
        
        // Update selected category based on rotation
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        const segmentAngle = 360 / categories.length;
        const newIndex = Math.round(normalizedRotation / segmentAngle) % categories.length;
        setSelectedIndex(newIndex);
        
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (!isDragging && Math.abs(velocity) > 0.1) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [velocity, isDragging, rotation, categories.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setVelocity(0);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !wheelRef.current) return;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const lastAngle = Math.atan2(lastMousePosition.y - centerY, lastMousePosition.x - centerX);
    
    const deltaAngle = currentAngle - lastAngle;
    const deltaRotation = (deltaAngle * 180) / Math.PI;

    setRotation(prev => prev + deltaRotation);
    setVelocity(deltaRotation * 0.5);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCategoryClick = (index: number) => {
    const targetRotation = -(index * (360 / categories.length));
    setRotation(targetRotation);
    setSelectedIndex(index);
    setVelocity(0);
  };

  const selectedCategory = categories[selectedIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/markets')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Markets
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Category Wheel Demo</h1>
                <p className="text-sm text-muted-foreground">Interactive spinning category browser</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Category Wheel */}
          <div className="flex items-center justify-center">
            <div className="relative w-96 h-96">
              <div
                ref={wheelRef}
                className="relative w-full h-full rounded-full border-2 border-border/20 cursor-grab active:cursor-grabbing"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Center circle */}
                <div className="absolute inset-0 w-20 h-20 m-auto rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-primary" />
                </div>

                {/* Category segments */}
                {categories.map((category, index) => {
                  const angle = (360 / categories.length) * index;
                  const isSelected = index === selectedIndex;
                  const Icon = category.icon;

                  return (
                    <div
                      key={category.id}
                      className="absolute inset-0"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <div
                        className={`absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 transition-all duration-300 cursor-pointer hover:scale-110 ${
                          isSelected 
                            ? 'scale-125 shadow-lg border-primary bg-primary/20' 
                            : 'border-border/40 bg-card hover:bg-card/80'
                        }`}
                        style={{
                          backgroundColor: isSelected ? category.color + '20' : undefined,
                          borderColor: isSelected ? category.color : undefined,
                          boxShadow: isSelected ? `0 0 20px ${category.color}40` : undefined
                        }}
                        onClick={() => handleCategoryClick(index)}
                      >
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center"
                          style={{ transform: `rotate(-${angle + rotation}deg)` }}
                        >
                          <Icon 
                            className={`w-6 h-6 transition-all duration-300 ${
                              isSelected ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                            style={{ color: isSelected ? category.color : undefined }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rotation indicator */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className="w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
              </div>
            </div>
          </div>

          {/* Selected Category Details */}
          {selectedCategory && (
            <Card className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <div 
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-2"
                  style={{ 
                    backgroundColor: selectedCategory.color + '20',
                    borderColor: selectedCategory.color,
                    boxShadow: `0 0 20px ${selectedCategory.color}40`
                  }}
                >
                  <selectedCategory.icon 
                    className="w-10 h-10"
                    style={{ color: selectedCategory.color }}
                  />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold">{selectedCategory.label}</h2>
                  <p className="text-muted-foreground">Prediction Markets</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold">{selectedCategory.count}</div>
                  <div className="text-sm text-muted-foreground">Active Markets</div>
                </div>
                
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold">
                    ${(selectedCategory.volume / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                </div>
              </div>

              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <div 
                  className={`text-xl font-bold ${
                    selectedCategory.trending > 0 ? 'text-up' : 'text-down'
                  }`}
                >
                  {selectedCategory.trending > 0 ? '+' : ''}{selectedCategory.trending.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">24h Trend</div>
              </div>

              <Button 
                className="w-full"
                onClick={() => navigate(`/markets?category=${selectedCategory.id}`)}
              >
                Explore {selectedCategory.label} Markets
              </Button>
            </Card>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center text-muted-foreground">
          <p>🖱️ Click and drag the wheel to spin • 🎯 Click on categories to select • ⚡ Experience momentum physics</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryWheel;