import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { WalletProvider } from "@/contexts/WalletContext";
// Import pages directly for now to fix dynamic import issues
import Index from "./pages/Index";
import Markets from "./pages/Markets";
import MarketDetail from "./pages/MarketDetail";
import Portfolio from "./pages/Portfolio";
import Documentation from "./pages/Documentation";
import CreateMarket from "./pages/CreateMarket";
import DevelopmentNotes from "./pages/DevelopmentNotes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log('App component rendering...');
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <WalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route path="/create-market" element={<CreateMarket />} />
                  
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/docs" element={<Documentation />} />
                  <Route path="/dev-notes" element={<DevelopmentNotes />} />
                  <Route path="/market/:id" element={<MarketDetail />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </WalletProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return <div>Error loading app</div>;
  }
};

export default App;
