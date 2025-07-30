import Header from "@/components/Layout/Header";
import HeroSection from "@/components/Hero/HeroSection";
import MarketsList from "@/components/Markets/MarketsList";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        <section className="container py-16">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Featured Markets</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Trade on the most popular prediction markets with real-time pricing and instant settlement on Hedera.
              </p>
            </div>
            
            <MarketsList />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
