import Header from "@/components/Layout/Header";
import HeroSection from "@/components/Hero/HeroSection";

const Index = () => {
  console.log('🏠 Index page rendering...');
  
  try {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSection />
        </main>
      </div>
    );
  } catch (error) {
    console.error('❌ Error in Index component:', error);
    return <div>Error rendering Index page: {String(error)}</div>;
  }
};

export default Index;
