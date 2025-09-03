import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Globe,
  Briefcase,
  Activity,
  Heart,
  TreePine,
  Building2,
  Microscope,
  Stethoscope,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

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

        const dbCategories = data?.map((category) => ({
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

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect();

    return () => {
      api?.off("select", onSelect);
    };
  }, [api]);

  const selectedCategory = categories[selectedIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/markets')}
              className="flex items-center gap-2 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Back to Event Markets</span>
              <span className="xs:hidden">Back</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Category Carousel</h1>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">Interactive diner wheel-style category browser</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-12">
        <div className="space-y-6 sm:space-y-12">
          {/* Carousel Wheel */}
          <div className="relative">
            <Carousel
              setApi={setApi}
              className="w-full max-w-sm sm:max-w-4xl lg:max-w-6xl mx-auto"
              opts={{
                align: "center",
                loop: true,
                skipSnaps: false,
                dragFree: true,
              }}
            >
              <CarouselContent className="py-4 sm:py-8">
                {categories.map((category, index) => {
                  const Icon = category.icon;
                  const isCenter = index === selectedIndex;
                  const distance = Math.abs(index - selectedIndex);
                  const isAdjacent = distance === 1 || (distance === categories.length - 1);
                  
                  return (
                    <CarouselItem 
                      key={category.id} 
                      className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 flex justify-center px-0.5 sm:px-1"
                    >
                      <div 
                        className={`
                          relative transition-all duration-500 ease-out cursor-pointer
                          ${isCenter 
                            ? 'scale-125 z-20' 
                            : isAdjacent 
                              ? 'scale-100 z-10' 
                              : 'scale-75 z-0 opacity-50'
                          }
                        `}
                        onClick={() => api?.scrollTo(index)}
                      >
                        {/* Card Shadow/Glow Effect */}
                        {isCenter && (
                          <div 
                            className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        
                        {/* Category Card */}
                        <Card 
                          className={`
                            relative w-16 h-14 sm:w-20 sm:h-16 md:w-24 md:h-20 cursor-pointer transition-all duration-500
                            ${isCenter 
                              ? 'shadow-2xl ring-2 ring-primary' 
                              : 'shadow-md hover:shadow-lg'
                            }
                          `}
                          style={{
                            transform: isCenter ? 'rotateY(0deg)' : `rotateY(${(index - selectedIndex) * 5}deg)`,
                          }}
                        >
                          <CardContent className="p-1 sm:p-2 text-center h-full flex flex-col items-center justify-center">
                            <Icon 
                              className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mx-auto mb-0.5 sm:mb-1 text-primary transition-all duration-500"
                            />
                            
                            {/* Category Label */}
                            <p className="font-medium text-xs leading-tight line-clamp-1">{category.label}</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">{category.count}</p>
                          </CardContent>
                          
                          {/* Market Count Badge */}
                          {isCenter && (
                            <div 
                              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground animate-fade-in"
                            >
                              <span className="text-xs sm:text-xs">{category.count}</span>
                            </div>
                          )}
                        </Card>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              
              {/* Custom Navigation Buttons */}
              <CarouselPrevious 
                className="left-1 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-2 hover:scale-110 transition-transform border-primary"
              />
              <CarouselNext 
                className="right-1 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-2 hover:scale-110 transition-transform border-primary"
              />
            </Carousel>
            
            {/* Diner Wheel Base */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 sm:translate-y-4">
              <div className="w-20 h-4 sm:w-32 sm:h-8 bg-gradient-to-b from-muted to-muted-foreground/20 rounded-full shadow-lg" />
              <div className="w-16 h-2 sm:w-24 sm:h-4 bg-muted-foreground/40 rounded-full mx-auto -mt-1 sm:-mt-2" />
            </div>
          </div>

          {/* Selected Category Details */}
          {selectedCategory && (
            <div className="animate-fade-in">
              <Card className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 border-2 border-primary">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center border-4 border-primary bg-primary/5 animate-scale-in"
                  >
                    <selectedCategory.icon 
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary"
                    />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{selectedCategory.label}</h2>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Event Prediction Markets</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 md:p-6 bg-muted/20 rounded-xl">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold">{selectedCategory.count}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Active Event Markets</div>
                  </div>
                  
                  <div className="text-center p-3 sm:p-4 md:p-6 bg-muted/20 rounded-xl">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                      ${(selectedCategory.volume / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Volume</div>
                  </div>

                  <div className="text-center p-3 sm:p-4 md:p-6 bg-muted/20 rounded-xl">
                    <div 
                      className={`text-lg sm:text-xl md:text-2xl font-bold ${
                        selectedCategory.trending > 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {selectedCategory.trending > 0 ? '+' : ''}{selectedCategory.trending.toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">24h Trend</div>
                  </div>
                </div>

                <Button 
                  className="w-full py-4 sm:py-6 text-sm sm:text-base md:text-lg font-semibold hover:scale-105 transition-transform bg-primary text-primary-foreground"
                  onClick={() => navigate(`/markets?category=${selectedCategory.id}`)}
                >
                  <span className="hidden sm:inline">Explore {selectedCategory.label} Event Markets</span>
                  <span className="sm:hidden">Explore {selectedCategory.label}</span>
                </Button>
              </Card>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-muted-foreground space-y-1 sm:space-y-2 px-2">
            <p className="text-sm sm:text-lg">🎪 <span className="hidden sm:inline">Click arrows or drag to spin the carousel</span><span className="sm:hidden">Drag or tap arrows</span></p>
            <p className="text-sm sm:text-base">🎯 <span className="hidden sm:inline">Click on any category card to select it instantly</span><span className="sm:hidden">Tap cards to select</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryWheel;