import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import FluxoDeCaixa from "./pages/FluxoDeCaixa";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/receitas" element={<ProtectedRoute><Layout><Receitas /></Layout></ProtectedRoute>} />
          <Route path="/despesas" element={<ProtectedRoute><Layout><Despesas /></Layout></ProtectedRoute>} />
          <Route path="/fluxo-caixa" element={<ProtectedRoute><Layout><FluxoDeCaixa /></Layout></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Relatórios</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/carteiras" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Carteiras</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Categorias</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
