import Header from "@/components/Layout/Header";

const Portfolio = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
          <p className="text-muted-foreground">Track your event prediction market positions and performance</p>
        </div>
      </main>
    </div>
  );
};

export default Portfolio;