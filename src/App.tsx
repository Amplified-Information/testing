import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { WalletProvider } from "@/contexts/WalletContext";
import { ErrorBoundary, WalletErrorBoundary } from "@/components/ErrorBoundary";
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
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors or network issues
        if (error?.message?.includes('404') || 
            error?.message?.includes('401') || 
            error?.message?.includes('403')) {
          return false;
        }
        return failureCount < 2; // Max 2 retries
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletErrorBoundary>
          <WalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary>
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
              </ErrorBoundary>
            </TooltipProvider>
          </WalletProvider>
        </WalletErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
