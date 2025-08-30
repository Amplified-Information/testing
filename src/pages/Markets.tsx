import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import Header from "@/components/Layout/Header";
import MarketCard from "@/components/Markets/MarketCard";
import { supabase } from "@/integrations/supabase/client";

const Markets = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search-specific state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch all markets
        const { data: marketsData, error: marketsError } = await supabase
          .from('event_markets')
          .select(`
            *,
            market_categories(name),
            market_subcategories(name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (marketsError) throw marketsError;

        const formattedMarkets = marketsData?.map(market => ({
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

        // Now fetch categories and calculate real stats
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('market_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (categoriesError) throw categoriesError;

        // Calculate real stats for each category
        const dbCategories = categoriesData?.map(category => {
          const categoryMarkets = formattedMarkets.filter(m => 
            m.category.toLowerCase() === category.name.toLowerCase()
          );
          
          const totalVolume = categoryMarkets.reduce((sum, m) => sum + (m.volume || 0), 0);
          const totalLiquidity = categoryMarkets.reduce((sum, m) => sum + (m.liquidity || 0), 0);
          const avgChange = categoryMarkets.length > 0 
            ? categoryMarkets.reduce((sum, m) => sum + (m.change24h || 0), 0) / categoryMarkets.length 
            : 0;

          return {
            id: category.name.toLowerCase().replace(/\s+/g, '-').replace('&', ''),
            label: category.name,
            icon: getIconForCategory(category.name),
            count: categoryMarkets.length,
            fullData: category,
            volume: totalVolume,
            change24h: avgChange,
            activeTraders: Math.floor(categoryMarkets.length * 150 + Math.random() * 1000), // Estimate based on markets
            avgResolutionTime: Math.floor(Math.random() * 60) + 15, // Still estimated
            successRate: Math.floor(Math.random() * 20) + 80, // Still estimated
            liquidity: totalLiquidity,
            newMarketsToday: categoryMarkets.filter(m => {
              const createdDate = new Date(m.createdAt);
              const today = new Date();
              return createdDate.toDateString() === today.toDateString();
            }).length,
            topMarket: categoryMarkets.length > 0 
              ? categoryMarkets.sort((a, b) => (b.volume || 0) - (a.volume || 0))[0].question
              : `No ${category.name} markets yet`
          };
        }) || [];

        // Calculate totals for "All" category
        const totalStats = {
          count: formattedMarkets.length,
          volume: formattedMarkets.reduce((sum, m) => sum + (m.volume || 0), 0),
          change24h: formattedMarkets.length > 0 
            ? formattedMarkets.reduce((sum, m) => sum + (m.change24h || 0), 0) / formattedMarkets.length 
            : 0,
          liquidity: formattedMarkets.reduce((sum, m) => sum + (m.liquidity || 0), 0),
          activeTraders: formattedMarkets.length * 100, // Estimate
          avgResolutionTime: 32, // Still estimated
          successRate: 85, // Still estimated
          newMarketsToday: formattedMarkets.filter(m => {
            const createdDate = new Date(m.createdAt);
            const today = new Date();
            return createdDate.toDateString() === today.toDateString();
          }).length,
          topMarket: formattedMarkets.length > 0 
            ? formattedMarkets.sort((a, b) => (b.volume || 0) - (a.volume || 0))[0].question
            : 'No markets available'
        };

        setCategories([
          { 
            id: "all", 
            label: "All Event Markets", 
            icon: Globe,
            ...totalStats
          },
          ...dbCategories
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle URL parameters on mount and when they change
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    
    if (categoryParam && categories.length > 0) {
      const category = categories.find(cat => 
        cat.label.toLowerCase() === categoryParam.toLowerCase()
      );
      
      if (category && category.id !== 'all') {
        setSelectedCategoryData(category);
        setViewMode('subcategories');
        
        // Fetch subcategories for this category
        if (category.fullData?.id) {
          fetchSubcategories(category.fullData.id).then(() => {
            // If subcategory is also specified, navigate to markets view
            if (subcategoryParam) {
              setViewMode('markets');
              // Find and set the subcategory after subcategories are loaded
              setTimeout(() => {
                setSubcategories(prev => {
                  const subcategory = prev.find(sub => 
                    sub.name.toLowerCase() === subcategoryParam.toLowerCase()
                  );
                  if (subcategory) {
                    setSelectedSubcategory(subcategory.id);
                  }
                  return prev;
                });
              }, 100);
            }
          });
        }
      }
    }
  }, [searchParams, categories]);

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('market_subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Calculate real counts for subcategories
      const subcategoriesWithCounts = data?.map(sub => {
        const subcategoryMarkets = allMarkets.filter(market => 
          market.subcategory.toLowerCase() === sub.name.toLowerCase()
        );
        
        return {
          id: sub.id,
          name: sub.name,
          description: sub.description,
          count: subcategoryMarkets.length
        };
      }) || [];

      // Calculate total for "All" option
      const categoryMarkets = allMarkets.filter(market => 
        market.category.toLowerCase() === selectedCategoryData?.label.toLowerCase()
      );

      const subcategoriesWithAll = [
        { 
          id: "all", 
          name: "All", 
          description: "All markets in this category", 
          count: categoryMarkets.length 
        },
        ...subcategoriesWithCounts
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

  // Database search function
  const performDatabaseSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const { data: marketsData, error } = await supabase
        .from('event_markets')
        .select(`
          *,
          market_categories(name),
          market_subcategories(name)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,market_categories.name.ilike.%${query}%,market_subcategories.name.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedResults = marketsData?.map(market => ({
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

      setSearchResults(formattedResults);
      setHasSearched(true);
    } catch (error) {
      console.error('Database search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performDatabaseSearch(searchQuery);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  // Get display markets - use search results if searched, otherwise filtered markets
  const getDisplayMarkets = () => {
    return hasSearched ? searchResults : getFilteredMarkets();
  };

  // Calculate real stats for overall platform
  const calculatePlatformStats = () => {
    const totalMarkets = allMarkets.length;
    const totalVolume = allMarkets.reduce((sum, m) => sum + (m.volume || 0), 0);
    const totalLiquidity = allMarkets.reduce((sum, m) => sum + (m.liquidity || 0), 0);
    const activeTraders = Math.floor(totalMarkets * 50); // Estimated based on markets
    
    // Calculate average resolution time (placeholder since we don't have actual resolution data)
    const avgResolutionDays = 15; // Estimated
    
    return {
      totalMarkets,
      totalVolume: totalVolume > 1000 ? `$${(totalVolume / 1000).toFixed(0)}K` : `$${totalVolume.toFixed(0)}`,
      activeTraders: activeTraders > 1000 ? `${(activeTraders / 1000).toFixed(1)}K` : activeTraders.toString(),
      avgResolution: `${avgResolutionDays} days`
    };
  };

  const platformStats = calculatePlatformStats();

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
    return getDisplayMarkets().filter(market => {
      const endDate = new Date(market.endDate);
      return endDate <= oneWeekFromNow && endDate > now;
    });
  };

  const getHighVolumeMarkets = () => {
    const volumeThreshold = 10000; // $10k threshold
    return getDisplayMarkets().filter(market => market.volume >= volumeThreshold);
  };

  const getNewMarkets = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return getDisplayMarkets().filter(market => {
      // Assuming we have a createdAt field in the market data
      const createdDate = new Date(market.createdAt || market.created_at);
      return createdDate >= thirtyDaysAgo;
    });
  };

  const getFeaturedMarkets = () => {
    return getDisplayMarkets().filter(market => market.is_featured === true);
  };

  const getTrendingMarkets = () => {
    return getDisplayMarkets().filter(market => market.is_trending === true);
  };

  const filteredMarkets = (markets: any[]) => {
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
                placeholder="Search markets... (Press Enter to search database)"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {(isSearching || hasSearched) && (
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {isSearching && (
                    <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
                  )}
                  {hasSearched && !isSearching && (
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                      onClick={clearSearch}
                    >
                      ×
                    </Button>
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
          
          {/* Search Results Indicator */}
          {hasSearched && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              Search results for "{searchQuery}" - {searchResults.length} markets found
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={clearSearch}
              >
                Clear search
              </Button>
            </div>
          )}
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
          </div>
        )}

        {/* Categories View */}
        {viewMode === 'categories' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {categories.map((category) => (
                <Card 
                  key={category.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                  onClick={() => handleCategorySelect(category)}
                >
                  <CardContent className="p-4 text-center">
                    <category.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">{category.label}</p>
                    <p className="text-xs text-muted-foreground">{category.count}</p>
                  </CardContent>
                </Card>
              ))}
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
            <div className="rounded-md border">
              <div className="divide-y divide-border">
                {subcategories.map((subcategory) => (
                  <div 
                    key={subcategory.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50 p-4"
                    onClick={() => handleSubcategorySelect(subcategory)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{subcategory.name}</h4>
                          {subcategory.id === "all" && (
                            <Badge variant="default" className="text-xs">All</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{subcategory.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">{subcategory.count} markets</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                {getDisplayMarkets().length} Markets
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getDisplayMarkets().map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
            {getDisplayMarkets().length === 0 && (
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
              <p className="text-2xl font-bold">{platformStats.totalMarkets}</p>
              <p className="text-xs text-muted-foreground">Real count</p>
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
              <p className="text-2xl font-bold">{platformStats.totalVolume}</p>
              <p className="text-xs text-up">All markets combined</p>
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
              <p className="text-2xl font-bold">{platformStats.activeTraders}</p>
              <p className="text-xs text-up">Estimated based on markets</p>
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
              <p className="text-2xl font-bold">{platformStats.avgResolution}</p>
              <p className="text-xs text-muted-foreground">Estimated time</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Markets;