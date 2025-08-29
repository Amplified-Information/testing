import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Trophy,
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
  ArrowLeft,
  ChevronRight,
  Users,
  Clock,
  Target,
  Droplets,
  Plus,
  Star,
  Landmark
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import Header from "@/components/Layout/Header";
import MarketCard from "@/components/Markets/MarketCard";
import { supabase } from "@/integrations/supabase/client";

const Markets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [categories, setCategories] = useState([
    { 
      id: "all", 
      label: "All Event Markets", 
      icon: Globe, 
      count: 847,
      volume: 156000000,
      change24h: 8.2,
      activeTraders: 24310,
      avgResolutionTime: 32,
      successRate: 85,
      liquidity: 45000000,
      newMarketsToday: 12,
      topMarket: 'Most Active Market Across All Categories'
    }
  ]);
  const [loading, setLoading] = useState(true);
  
  // New state for hierarchical navigation
  const [viewMode, setViewMode] = useState<'categories' | 'subcategories' | 'markets'>('categories');
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [allMarkets, setAllMarkets] = useState<any[]>([]);

  // Map category names to icons
  const getIconForCategory = (name: string) => {
    const iconMap: { [key: string]: any } = {
      'Politics': Landmark,
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

  // Handle carousel selection
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setSelectedCategoryIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    onSelect();

    return () => {
      carouselApi?.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('market_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        const dbCategories = data?.map(category => ({
          id: category.name.toLowerCase().replace(/\s+/g, '-').replace('&', ''),
          label: category.name,
          icon: getIconForCategory(category.name),
          count: Math.floor(Math.random() * 200) + 50, // Placeholder count
          fullData: category, // Store the full category data
          // Additional placeholder data for enhanced cards
          volume: Math.floor(Math.random() * 50000000) + 5000000, // $5M-$55M volume
          change24h: (Math.random() - 0.5) * 30, // -15% to +15% change
          activeTraders: Math.floor(Math.random() * 15000) + 2000, // 2K-17K traders
          avgResolutionTime: Math.floor(Math.random() * 60) + 15, // 15-75 days
          successRate: Math.floor(Math.random() * 30) + 70, // 70-100% accuracy
          liquidity: Math.floor(Math.random() * 10000000) + 1000000, // $1M-$11M liquidity
          newMarketsToday: Math.floor(Math.random() * 15) + 1, // 1-15 new markets
          topMarket: category.name === 'Politics' ? 'US Election 2024 Winner' 
                   : category.name === 'Sports' ? 'Super Bowl 2025 Winner'
                   : category.name === 'Crypto' ? 'Bitcoin $100K by EOY'
                   : category.name === 'Tech & Science' ? 'GPT-5 Release Date'
                   : `${category.name} Market Leader`
        })) || [];

        setCategories([
          { 
            id: "all", 
            label: "All Event Markets", 
            icon: Globe, 
            count: 847,
            volume: 156000000, // $156M total volume
            change24h: 8.2, // +8.2% change
            activeTraders: 24310, // 24.3K traders
            avgResolutionTime: 32, // 32 days average
            successRate: 85, // 85% accuracy
            liquidity: 45000000, // $45M liquidity
            newMarketsToday: 12, // 12 new markets
            topMarket: 'Most Active Market Across All Categories'
          },
          ...dbCategories
        ]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchAllMarkets();
  }, []);

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('market_subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const subcategoriesWithAll = [
        { id: "all", name: "All", description: "All markets in this category", count: Math.floor(Math.random() * 100) + 20 },
        ...(data?.map(sub => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
          count: Math.floor(Math.random() * 50) + 5 // Placeholder count
        })) || [])
      ];

      setSubcategories(subcategoriesWithAll);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([{ id: "all", name: "All", description: "All markets in this category", count: 0 }]);
    }
  };

  const handleCategorySelect = async (category: any) => {
    if (category.id === "all") {
      setSelectedCategory("all");
      return;
    }

    setSelectedCategoryData(category);
    setViewMode('subcategories');
    setSelectedSubcategory("all");
    
    if (category.fullData?.id) {
      await fetchSubcategories(category.fullData.id);
    }
  };

  const handleSubcategorySelect = (subcategory: any) => {
    setSelectedSubcategory(subcategory.id);
    setViewMode('markets');
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategoryData(null);
    setSubcategories([]);
    setSelectedSubcategory("all");
  };

  const handleBackToSubcategories = () => {
    setViewMode('subcategories');
    setSelectedSubcategory("all");
  };

  const featuredMarkets: any[] = [];

  const trendingMarkets: any[] = [];

  const newMarkets: any[] = [];

  // Fetch all event markets from the database
  const fetchAllMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('event_markets')
        .select(`
          *,
          market_categories(name),
          market_subcategories(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMarkets = data?.map(market => ({
        id: market.id,
        question: market.name,
        category: market.market_categories?.name || 'Unknown',
        subcategory: market.market_subcategories?.name || 'General',
        yesPrice: market.yes_price,
        noPrice: market.no_price,
        volume: market.volume,
        endDate: market.end_date,
        liquidity: market.liquidity,
        change24h: market.change_24h,
        description: market.description,
        relevance: market.relevance,
        whyItMatters: market.why_it_matters,
        createdAt: market.created_at,
        is_featured: market.is_featured,
        is_trending: market.is_trending
      })) || [];

      setAllMarkets(formattedMarkets);
    } catch (error) {
      console.error('Error fetching markets:', error);
      setAllMarkets([]);
    }
  };

  // Filter markets based on current view and selection
  const getFilteredMarkets = (markets: any[] = allMarkets) => {
    let filtered = markets;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(market => 
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category and subcategory based on current view
    if (viewMode === 'markets' && selectedCategoryData && selectedCategoryData.id !== 'all') {
      filtered = filtered.filter(market => 
        market.category.toLowerCase() === selectedCategoryData.label.toLowerCase()
      );

      // Further filter by subcategory if not "all"
      if (selectedSubcategory !== 'all') {
        const selectedSubcategoryName = subcategories.find(sub => sub.id === selectedSubcategory)?.name;
        if (selectedSubcategoryName) {
          filtered = filtered.filter(market => 
            market.subcategory.toLowerCase() === selectedSubcategoryName.toLowerCase()
          );
        }
      }
    }

    return filtered;
  };

  // Get markets for specific tab filters
  const getEndingSoonMarkets = () => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return getFilteredMarkets().filter(market => {
      const endDate = new Date(market.endDate);
      return endDate <= oneWeekFromNow && endDate > now;
    });
  };

  const getHighVolumeMarkets = () => {
    const volumeThreshold = 10000; // $10k threshold
    return getFilteredMarkets().filter(market => market.volume >= volumeThreshold);
  };

  const getNewMarkets = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return getFilteredMarkets().filter(market => {
      // Assuming we have a createdAt field in the market data
      const createdDate = new Date(market.createdAt || market.created_at);
      return createdDate >= thirtyDaysAgo;
    });
  };

  const getFeaturedMarkets = () => {
    return getFilteredMarkets().filter(market => market.is_featured === true);
  };

  const getTrendingMarkets = () => {
    return getFilteredMarkets().filter(market => market.is_trending === true);
  };

  const filteredMarkets = (markets: typeof featuredMarkets) => {
    return markets.filter(market => {
      const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           market.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If in categories view or "all" is selected, show all markets that match search
      if (viewMode === 'categories' || selectedCategory === "all") return matchesSearch;
      
      // If in subcategories view, filter by selected category
      if (viewMode === 'subcategories') {
        const categoryMatch = selectedCategoryData && 
          (market.category.toLowerCase() === selectedCategoryData.label.toLowerCase() ||
           market.category.toLowerCase().replace(/\s+/g, '-').replace('&', '') === selectedCategoryData.id);
        return matchesSearch && categoryMatch;
      }
      
      // If in markets view, filter by category and potentially subcategory
      if (viewMode === 'markets') {
        const categoryMatch = selectedCategoryData && 
          (market.category.toLowerCase() === selectedCategoryData.label.toLowerCase() ||
           market.category.toLowerCase().replace(/\s+/g, '-').replace('&', '') === selectedCategoryData.id);
        
        // For now, we'll just filter by category since our mock data doesn't have subcategory info
        // In a real implementation, you'd also filter by selectedSubcategory
        return matchesSearch && categoryMatch;
      }
      
      return matchesSearch;
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container py-8">
        {/* Header Section */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Explore Markets</h1>
              <p className="text-lg text-muted-foreground">
                Discover and trade on prediction markets across various categories
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.open('/category-wheel', '_blank')}
              className="hidden md:flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Try Wheel Demo
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Navigation */}
        {viewMode !== 'categories' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <button 
                onClick={handleBackToCategories}
                className="hover:text-primary transition-colors"
              >
                All Markets
              </button>
              <ChevronRight className="h-4 w-4" />
              {selectedCategoryData && (
                <>
                  <button 
                    onClick={handleBackToSubcategories}
                    className="text-foreground font-medium hover:text-primary transition-colors"
                  >
                    {selectedCategoryData.label}
                  </button>
                  {viewMode === 'markets' && selectedSubcategory !== 'all' && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {subcategories.find(sub => sub.id === selectedSubcategory)?.name}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={viewMode === 'markets' ? handleBackToSubcategories : handleBackToCategories}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}

        {/* Categories View */}
        {viewMode === 'categories' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            
            {/* Category Carousel */}
            <div className="relative">
              <Carousel
                setApi={setCarouselApi}
                className="w-full max-w-6xl mx-auto"
                opts={{
                  align: "center",
                  loop: true,
                  skipSnaps: false,
                  dragFree: true,
                }}
              >
                <CarouselContent className="py-8">
                  {categories.map((category, index) => {
                    const Icon = category.icon;
                    const isCenter = index === selectedCategoryIndex;
                    const distance = Math.abs(index - selectedCategoryIndex);
                    const isAdjacent = distance === 1 || (distance === categories.length - 1);
                    
                    return (
                      <CarouselItem 
                        key={category.id} 
                        className="basis-1/3 sm:basis-1/4 lg:basis-1/6 flex justify-center px-1"
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
                          onClick={() => {
                            carouselApi?.scrollTo(index);
                            handleCategorySelect(category);
                          }}
                        >
                          {/* Card Shadow/Glow Effect */}
                          {isCenter && (
                            <div 
                              className="absolute inset-0 rounded-2xl blur-xl opacity-30 bg-primary/50"
                            />
                          )}
                          
                          {/* Category Card */}
                          <Card 
                            className={`
                              relative w-32 h-28 cursor-pointer transition-all duration-500
                              ${isCenter 
                                ? 'shadow-2xl ring-2 ring-primary border-primary' 
                                : 'shadow-md hover:shadow-lg'
                              }
                            `}
                            style={{
                              transform: isCenter ? 'rotateY(0deg)' : `rotateY(${(index - selectedCategoryIndex) * 3}deg)`,
                            }}
                          >
                            <CardContent className="p-4 text-center h-full flex flex-col items-center justify-center">
                              <Icon 
                                className="h-8 w-8 mx-auto mb-2 text-primary transition-all duration-500"
                              />
                              
                              {/* Category Label */}
                              <p className="font-medium text-sm">{category.label}</p>
                              <p className="text-xs text-muted-foreground">{category.count}</p>
                            </CardContent>
                            
                            {/* Market Count Badge */}
                            {isCenter && (
                              <div 
                                className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground animate-fade-in"
                              >
                                {category.count}
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
                  className="left-4 w-12 h-12 border-2 hover:scale-110 transition-transform border-primary"
                />
                <CarouselNext 
                  className="right-4 w-12 h-12 border-2 hover:scale-110 transition-transform border-primary"
                />
              </Carousel>
              
              {/* Diner Wheel Base */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4">
                <div className="w-32 h-8 bg-gradient-to-b from-muted to-muted-foreground/20 rounded-full shadow-lg" />
                <div className="w-24 h-4 bg-muted-foreground/40 rounded-full mx-auto -mt-2" />
              </div>
            </div>

            {/* Selected Category Details */}
            {categories[selectedCategoryIndex] && (
              <div className="mt-12 animate-fade-in">
                <Card className="max-w-2xl mx-auto p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-primary bg-primary/10"
                      >
                        {(() => {
                          const Icon = categories[selectedCategoryIndex].icon;
                          return <Icon className="w-8 h-8 text-primary" />;
                        })()}
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-bold">{categories[selectedCategoryIndex].label}</h3>
                        <p className="text-muted-foreground">Event Prediction Markets</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-4 bg-background/50 rounded-lg">
                        <div className="text-2xl font-bold">{categories[selectedCategoryIndex].count}</div>
                        <div className="text-xs text-muted-foreground">Markets</div>
                      </div>
                      
                      <div className="text-center p-4 bg-background/50 rounded-lg">
                        <div className="text-2xl font-bold">
                          ${(categories[selectedCategoryIndex].volume / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                      </div>

                      <div className="text-center p-4 bg-background/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {categories[selectedCategoryIndex].activeTraders}
                        </div>
                        <div className="text-xs text-muted-foreground">Traders</div>
                      </div>

                      <div className="text-center p-4 bg-background/50 rounded-lg">
                        <div 
                          className={`text-2xl font-bold ${
                            categories[selectedCategoryIndex].change24h > 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {categories[selectedCategoryIndex].change24h > 0 ? '+' : ''}{categories[selectedCategoryIndex].change24h.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">24h</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Instructions */}
            <div className="text-center text-muted-foreground space-y-2 mt-8">
              <p className="text-sm">🎪 Click arrows or drag to browse categories</p>
              <p className="text-sm">🎯 Click on any category card to explore markets</p>
            </div>
          </div>
        )}

        {/* Subcategories View */}
        {viewMode === 'subcategories' && selectedCategoryData && (
          <div className="mb-8">
            {/* Enhanced Category Details Card */}
            <div className="mb-6">
              <Card className="border border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 overflow-hidden animate-fade-in">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/20 animate-scale-in">
                        <selectedCategoryData.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedCategoryData.label}</h2>
                        <p className="text-sm text-muted-foreground">Prediction Markets</p>
                      </div>
                    </div>
                    <Star className="h-5 w-5 text-primary" />
                  </div>

                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-6 gap-4 mb-6">
                    {/* Total Volume - Takes 2 columns */}
                    <div className="col-span-2 p-4 bg-background/70 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Total Volume
                      </div>
                      <p className="text-2xl font-bold">${(selectedCategoryData.volume / 1000000).toFixed(1)}M</p>
                    </div>
                    
                    {/* 24h Change - Takes 2 columns */}
                    <div className="col-span-2 p-4 bg-background/70 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <TrendingUp className="h-3 w-3" />
                        24h Change
                      </div>
                      <p className={`text-2xl font-bold ${selectedCategoryData.change24h > 0 ? 'text-up' : 'text-down'}`}>
                        {selectedCategoryData.change24h > 0 ? '+' : ''}{selectedCategoryData.change24h.toFixed(1)}%
                      </p>
                    </div>
                    
                    {/* Traders - Takes 1 column */}
                    <div className="col-span-1 p-3 bg-background/50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Users className="h-3 w-3" />
                        Traders
                      </div>
                      <p className="font-bold">{(selectedCategoryData.activeTraders / 1000).toFixed(1)}K</p>
                    </div>
                    
                    {/* Liquidity - Takes 1 column */}
                    <div className="col-span-1 p-3 bg-background/50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Droplets className="h-3 w-3" />
                        Liquidity
                      </div>
                      <p className="font-bold">${(selectedCategoryData.liquidity / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>

                  {/* Secondary Stats Row */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="text-center p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Target className="h-3 w-3" />
                        Accuracy
                      </div>
                      <p className="font-bold">{selectedCategoryData.successRate}%</p>
                    </div>
                    <div className="text-center p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        Avg Days
                      </div>
                      <p className="font-bold">{selectedCategoryData.avgResolutionTime}</p>
                    </div>
                    <div className="text-center p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Plus className="h-3 w-3" />
                        New Today
                      </div>
                      <p className="font-bold text-primary">{selectedCategoryData.newMarketsToday}</p>
                    </div>
                    <div className="text-center p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Star className="h-3 w-3" />
                        Markets
                      </div>
                      <p className="font-bold">{selectedCategoryData.count}</p>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Most Popular Market</div>
                      <p className="text-sm font-medium line-clamp-1">{selectedCategoryData.topMarket}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                        {subcategories.length - 1} Subcategories
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-xl font-semibold mb-4">Choose a Subcategory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory) => (
                <Card 
                  key={subcategory.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                  onClick={() => handleSubcategorySelect(subcategory)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{subcategory.name}</h4>
                      {subcategory.id === "all" && (
                        <Badge variant="default" className="text-xs">All</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{subcategory.description}</p>
                    <p className="text-xs text-primary font-medium">{subcategory.count} markets</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Market Sections - Only show when in markets view or categories view with "all" selected */}
        {(viewMode === 'markets' || (viewMode === 'categories' && selectedCategory === "all")) && (
          <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              New
            </TabsTrigger>
            <TabsTrigger value="ending-soon" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ending Soon
            </TabsTrigger>
            <TabsTrigger value="high-volume" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              High Volume
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">All Markets</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {getFilteredMarkets().length} Markets
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredMarkets().map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
            {getFilteredMarkets().length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No markets found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try adjusting your search terms" : "Check back later for new markets"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Featured Markets</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {getFeaturedMarkets().length} Markets
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFeaturedMarkets().map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
            {getFeaturedMarkets().length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No featured markets</p>
                <p className="text-sm text-muted-foreground">
                  No markets are currently featured in this category
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Trending Markets</h3>
              <Badge variant="secondary" className="bg-up/10 text-up">
                {getTrendingMarkets().length} Markets
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getTrendingMarkets().map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
            {getTrendingMarkets().length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No trending markets</p>
                <p className="text-sm text-muted-foreground">
                  No markets are currently trending in this category
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">New Markets</h3>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                {getNewMarkets().length} Markets (30 days)
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getNewMarkets().map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
            {getNewMarkets().length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No new markets</p>
                <p className="text-sm text-muted-foreground">
                  No markets have been created in the last 30 days
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ending-soon" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Ending Soon</h3>
              <Badge variant="secondary" className="bg-warning/10 text-warning">
                {getEndingSoonMarkets().length} Markets (7 days)
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getEndingSoonMarkets().map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
            {getEndingSoonMarkets().length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No markets ending soon</p>
                <p className="text-sm text-muted-foreground">
                  All markets have resolution dates more than 7 days away
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="high-volume" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">High Volume Markets</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {getHighVolumeMarkets().length} Markets ($10K+)
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getHighVolumeMarkets().map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
            {getHighVolumeMarkets().length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No high volume markets</p>
                <p className="text-sm text-muted-foreground">
                  No markets currently have volume above $10,000
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Total Markets</h4>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">847</p>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">24h Volume</h4>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">$156K</p>
              <p className="text-xs text-up">+8.2% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Active Traders</h4>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">2,431</p>
              <p className="text-xs text-up">+15% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Avg Resolution</h4>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">2.3 days</p>
              <p className="text-xs text-muted-foreground">Median time</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Markets;