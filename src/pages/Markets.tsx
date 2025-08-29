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
  Star
} from "lucide-react";
import Header from "@/components/Layout/Header";
import MarketCard from "@/components/Markets/MarketCard";
import { supabase } from "@/integrations/supabase/client";

const Markets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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

  // Map category names to icons
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

  const featuredMarkets = [
    {
      id: "1",
      question: "Will Bitcoin reach $100,000 by end of 2024?",
      category: "Crypto",
      yesPrice: 72,
      noPrice: 28,
      volume: 45230,
      endDate: "Dec 31, 2024",
      liquidity: 52000,
      change24h: 5.2
    },
    {
      id: "2", 
      question: "Will the 2024 US Presidential Election be decided by more than 5% margin?",
      category: "Politics",
      yesPrice: 34,
      noPrice: 66,
      volume: 89450,
      endDate: "Nov 5, 2024",
      liquidity: 125000,
      change24h: -2.1
    },
    {
      id: "3",
      question: "Will OpenAI release GPT-5 in 2024?",
      category: "Technology",
      yesPrice: 68,
      noPrice: 32,
      volume: 23120,
      endDate: "Dec 31, 2024",
      liquidity: 34000,
      change24h: 8.7
    },
    {
      id: "16",
      question: "Will LeBron James play in the 2024-25 NBA season?",
      category: "Sports",
      yesPrice: 85,
      noPrice: 15,
      volume: 56780,
      endDate: "Jun 1, 2025",
      liquidity: 72000,
      change24h: 4.6
    },
    {
      id: "17",
      question: "Will the Super Bowl 2025 go to overtime?",
      category: "Sports",
      yesPrice: 12,
      noPrice: 88,
      volume: 78450,
      endDate: "Feb 9, 2025",
      liquidity: 95000,
      change24h: -1.3
    },
    {
      id: "18",
      question: "Will Amazon stock reach $200 by end of 2024?",
      category: "Business",
      yesPrice: 58,
      noPrice: 42,
      volume: 67890,
      endDate: "Dec 31, 2024",
      liquidity: 82000,
      change24h: 3.8
    },
    {
      id: "19", 
      question: "Will Apple's market cap exceed $4 trillion in 2024?",
      category: "Business",
      yesPrice: 73,
      noPrice: 27,
      volume: 89450,
      endDate: "Dec 31, 2024",
      liquidity: 115000,
      change24h: 6.2
    },
    {
      id: "20",
      question: "Will the next Marvel movie gross over $1 billion worldwide?",
      category: "Entertainment",
      yesPrice: 64,
      noPrice: 36,
      volume: 54320,
      endDate: "Dec 31, 2024", 
      liquidity: 68000,
      change24h: 2.1
    },
    {
      id: "21",
      question: "Will Taylor Swift announce a new album in 2024?",
      category: "Entertainment", 
      yesPrice: 81,
      noPrice: 19,
      volume: 73210,
      endDate: "Dec 31, 2024",
      liquidity: 92000,
      change24h: 7.9
    },
    {
      id: "22",
      question: "Will NASA announce evidence of life on Mars in 2024?",
      category: "Science",
      yesPrice: 8,
      noPrice: 92,
      volume: 41230,
      endDate: "Dec 31, 2024",
      liquidity: 55000,
      change24h: -0.5
    },
    {
      id: "23",
      question: "Will a quantum computer break RSA encryption in 2024?",
      category: "Science",
      yesPrice: 15,
      noPrice: 85,
      volume: 29840,
      endDate: "Dec 31, 2024",
      liquidity: 38000,
      change24h: 1.2
    }
  ];

  const trendingMarkets = [
    {
      id: "4",
      question: "Will Tesla stock hit $300 before Q2 2024?",
      category: "Business", 
      yesPrice: 45,
      noPrice: 55,
      volume: 34890,
      endDate: "Jun 30, 2024",
      liquidity: 42000,
      change24h: 12.3
    },
    {
      id: "5",
      question: "Will the Champions League final have over 2.5 goals?",
      category: "Sports",
      yesPrice: 78,
      noPrice: 22,
      volume: 67230,
      endDate: "Jun 1, 2024",
      liquidity: 78000,
      change24h: 3.4
    },
    {
      id: "8",
      question: "Will Patrick Mahomes throw for over 4,500 yards this NFL season?",
      category: "Sports",
      yesPrice: 65,
      noPrice: 35,
      volume: 45670,
      endDate: "Feb 15, 2025",
      liquidity: 58000,
      change24h: 7.2
    },
    {
      id: "9",
      question: "Will any NBA team win 70+ games this season?",
      category: "Sports",
      yesPrice: 23,
      noPrice: 77,
      volume: 29840,
      endDate: "Apr 14, 2024",
      liquidity: 35000,
      change24h: -4.1
    },
    {
      id: "10",
      question: "Will Lionel Messi score 15+ goals in MLS this season?",
      category: "Sports",
      yesPrice: 89,
      noPrice: 11,
      volume: 52310,
      endDate: "Nov 9, 2024",
      liquidity: 67000,
      change24h: 2.8
    }
  ];

  const newMarkets = [
    {
      id: "6",
      question: "Will Apple announce a VR headset successor in 2024?",
      category: "Technology",
      yesPrice: 82,
      noPrice: 18,
      volume: 12340,
      endDate: "Dec 31, 2024",
      liquidity: 18500,
      change24h: -1.2
    },
    {
      id: "7",
      question: "Will any team break the 100-point barrier in NBA playoffs?",
      category: "Sports", 
      yesPrice: 91,
      noPrice: 9,
      volume: 18760,
      endDate: "Jun 20, 2024",
      liquidity: 22000,
      change24h: 15.8
    },
    {
      id: "11",
      question: "Will Max Verstappen win the 2024 Formula 1 Championship?",
      category: "Sports",
      yesPrice: 94,
      noPrice: 6,
      volume: 73420,
      endDate: "Dec 8, 2024",
      liquidity: 89000,
      change24h: 1.5
    },
    {
      id: "12",
      question: "Will the US Women's Soccer team win Olympic Gold in Paris 2024?",
      category: "Sports",
      yesPrice: 47,
      noPrice: 53,
      volume: 31250,
      endDate: "Aug 10, 2024",
      liquidity: 41000,
      change24h: 6.3
    },
    {
      id: "13", 
      question: "Will Shohei Ohtani hit 50+ home runs this MLB season?",
      category: "Sports",
      yesPrice: 38,
      noPrice: 62,
      volume: 42890,
      endDate: "Oct 1, 2024",
      liquidity: 55000,
      change24h: 9.7
    },
    {
      id: "14",
      question: "Will there be a perfect game thrown in MLB this season?",
      category: "Sports",
      yesPrice: 15,
      noPrice: 85,
      volume: 19670,
      endDate: "Oct 31, 2024",
      liquidity: 24000,
      change24h: -2.4
    },
    {
      id: "15",
      question: "Will Novak Djokovic win Wimbledon 2024?",
      category: "Sports",
      yesPrice: 56,
      noPrice: 44,
      volume: 38450,
      endDate: "Jul 14, 2024",
      liquidity: 47000,
      change24h: -1.8
    }
  ];

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
            <h2 className="text-xl font-semibold mb-6">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.filter(cat => cat.id !== 'all').map((category) => (
                <Card 
                  key={category.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary/50"
                  onClick={() => handleCategorySelect(category)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-primary/10">
                          <category.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{category.label}</h3>
                          <p className="text-sm text-muted-foreground">{category.count} active markets</p>
                        </div>
                      </div>
                      <Star className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Volume and Change */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Total Volume
                        </div>
                        <p className="font-bold text-lg">${(category.volume / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          24h Change
                        </div>
                        <p className={`font-bold text-lg ${category.change24h > 0 ? 'text-up' : 'text-down'}`}>
                          {category.change24h > 0 ? '+' : ''}{category.change24h.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-border/40">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                          <Users className="h-3 w-3" />
                          Traders
                        </div>
                        <p className="font-semibold">{(category.activeTraders / 1000).toFixed(1)}K</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                          <Droplets className="h-3 w-3" />
                          Liquidity
                        </div>
                        <p className="font-semibold">${(category.liquidity / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                          <Target className="h-3 w-3" />
                          Accuracy
                        </div>
                        <p className="font-semibold">{category.successRate}%</p>
                      </div>
                    </div>

                    {/* Activity Metrics */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Avg Resolution: {category.avgResolutionTime}d
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Plus className="h-3 w-3" />
                        {category.newMarketsToday} new today
                      </div>
                    </div>

                    {/* Top Market */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Star className="h-3 w-3" />
                        Most Popular Market
                      </div>
                      <p className="text-sm font-medium line-clamp-2">{category.topMarket}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* All Markets Card */}
            <div className="mt-6">
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary/50 bg-gradient-to-r from-primary/5 to-accent/5"
                onClick={() => handleCategorySelect(categories[0])}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Browse All Markets</h3>
                      <p className="text-muted-foreground">Explore {categories[0].count} prediction markets across all categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Subcategories View */}
        {viewMode === 'subcategories' && selectedCategoryData && (
          <div className="mb-8">
            <div className="mb-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <selectedCategoryData.icon className="h-8 w-8 text-primary" />
                    <h2 className="text-2xl font-bold">{selectedCategoryData.label}</h2>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    {selectedCategoryData.fullData?.description || `Explore prediction markets in ${selectedCategoryData.label}`}
                  </p>
                  <div className="flex gap-4">
                    <Badge variant="secondary">{selectedCategoryData.count} Markets</Badge>
                    <Badge variant="outline">{subcategories.length - 1} Subcategories</Badge>
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
          <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
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
          </TabsList>

          <TabsContent value="featured" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Featured Markets</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                High Volume
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets(featuredMarkets).map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Trending Markets</h3>
              <Badge variant="secondary" className="bg-up/10 text-up">
                Hot
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets(trendingMarkets).map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">New Markets</h3>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                Fresh
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets(newMarkets).map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
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