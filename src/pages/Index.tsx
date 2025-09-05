import Header from "@/components/Layout/Header";
import HeroSection from "@/components/Hero/HeroSection";

const Index = () => {
  console.log('Index page rendering');
  
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
      </main>
    </div>
  );
};

export default Index;
