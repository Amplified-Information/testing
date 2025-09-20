import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import { supabase } from "@/integrations/supabase/client";

const Markets = () => {
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<any[]>([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const { data, error } = await supabase
          .from('event_markets')
          .select('*')
          .eq('is_active', true)
          .limit(10);

        if (error) throw error;
        
        setMarkets(data || []);
      } catch (error) {
        console.error('Error fetching markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-lg">Loading markets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Markets</h1>
        
        {markets.length === 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-xl">No Markets Available</h2>
            </CardHeader>
            <CardContent>
              <p>No active markets found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {markets.map((market) => (
              <Card key={market.id}>
                <CardHeader>
                  <h3 className="text-lg font-semibold">{market.name}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {market.description}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>Volume: ${market.volume || 0}</span>
                    <span>Liquidity: ${market.liquidity || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;