import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/receitas" element={<Layout><Receitas /></Layout>} />
          <Route path="/despesas" element={<Layout><Despesas /></Layout>} />
          <Route path="/relatorios" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Relatórios</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout>} />
          <Route path="/carteiras" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Carteiras</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout>} />
          <Route path="/categorias" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Categorias</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout>} />
          <Route path="/configuracoes" element={<Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
