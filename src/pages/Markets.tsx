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
  MapPin
} from "lucide-react";
import Header from "@/components/Layout/Header";
import MarketCard from "@/components/Markets/MarketCard";
import { supabase } from "@/integrations/supabase/client";

const Markets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([
    { id: "all", label: "All Markets", icon: Globe, count: 847 }
  ]);
  const [loading, setLoading] = useState(true);

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
          count: Math.floor(Math.random() * 200) + 50 // Placeholder count
        })) || [];

        setCategories([
          { id: "all", label: "All Markets", icon: Globe, count: 847 },
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
      
      if (selectedCategory === "all") return matchesSearch;
      
      // Match by category name directly or by mapped category ID
      const categoryMatch = market.category.toLowerCase() === selectedCategory ||
                           market.category.toLowerCase().replace(/\s+/g, '-').replace('&', '') === selectedCategory;
      
      return matchesSearch && categoryMatch;
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

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {categories.map((category) => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === category.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedCategory(category.id)}
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

        {/* Market Sections */}
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