import Header from "@/components/Layout/Header";
import HeroSection from "@/components/Hero/HeroSection";
import MarketsList from "@/components/Markets/MarketsList";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <section className="container py-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Featured Markets</h2>
            </div>
            
            <MarketsList />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
