import Header from "@/components/Layout/Header";
import HeroSection from "@/components/Hero/HeroSection";
import MarketsList from "@/components/Markets/MarketsList";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        
        <section className="container py-16">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-8">
                Hedera's lightning-fast transactions, ultra-low fees starting at $0.0001, and fair ordering make it the ideal blockchain for prediction markets, ensuring rapid, cost-effective, and trustworthy outcomes. Its enterprise-grade security and scalability, backed by a council including Google and IBM, provide a reliable platform for seamless market participation.
              </p>
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
