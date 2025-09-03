import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { WalletProvider } from "@/contexts/WalletContext";
import { lazy, Suspense } from "react";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Markets = lazy(() => import("./pages/Markets"));
const MarketDetail = lazy(() => import("./pages/MarketDetail"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Documentation = lazy(() => import("./pages/Documentation"));
const CreateMarket = lazy(() => import("./pages/CreateMarket"));
const DevelopmentNotes = lazy(() => import("./pages/DevelopmentNotes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
