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
          <Route path="/dre-gerencial" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">DRE Gerencial</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/boletos/gerar" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Gerar Boletos</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/boletos/remessas" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Remessas</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/boletos/retornos" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Retornos</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/caixas" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Caixas</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/contas-bancarias" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Contas Bancárias</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/formas-pagamento" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Formas de Pagamento</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/plano-contas" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Plano de Contas</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/situacoes" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Situações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/centros-custos" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Centros de Custos</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/conciliacao" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Conciliação Bancária</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/transferencias" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Transferências</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/campos-extras" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Campos Extras</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/modelos-emails" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Modelos de E-mails</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/auxiliares/tabelas-rateios" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Tabelas de Rateios</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/contas-fixas" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Contas Fixas</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Layout><div className="text-center py-20"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div></Layout></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
