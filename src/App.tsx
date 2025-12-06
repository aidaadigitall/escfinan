import { Toaster } from "@/components/ui/toaster";
import Movimentacoes from "@/pages/estoque/Movimentacoes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import FluxoDeCaixa from "./pages/FluxoDeCaixa";
import Transferencias from "./pages/Transferencias";
import Caixa from "./pages/Caixa";
import DreGerencial from "./pages/DreGerencial";
import RelatoriosGerenciais from "./pages/RelatoriosGerenciais";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ContasFixas from "./pages/ContasFixas";
import ReceitasFixas from "./pages/ReceitasFixas";
import PaymentMethods from "./pages/PaymentMethods";
import ContasBancarias from "./pages/ContasBancarias";
import CartoesCredito from "./pages/CartoesCredito";
import CentrosCustos from "./pages/CentrosCustos";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";
import RelatorioRecorrencias from "./pages/RelatorioRecorrencias";
import CalendarioFinanceiro from "./pages/CalendarioFinanceiro";
import Usuarios from "./pages/cadastros/Usuarios";
import Clientes from "./pages/cadastros/Clientes";
import Fornecedores from "./pages/cadastros/Fornecedores";
import Funcionarios from "./pages/cadastros/Funcionarios";
import Produtos from "./pages/cadastros/Produtos";
import Servicos from "./pages/cadastros/Servicos";
import Categorias from "./pages/Categorias";
import PlanoContas from "./pages/PlanoContas";
import LancamentosDiarios from "./pages/LancamentosDiarios";
import Tarefas from "./pages/Tarefas";
import Orcamentos from "./pages/Orcamentos";
import OrdensServico from "./pages/OrdensServico";
import Vendas from "./pages/Vendas";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
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
            <Route path="/fluxo-de-caixa" element={<ProtectedRoute><Layout><FluxoDeCaixa /></Layout></ProtectedRoute>} />
            <Route path="/transferencias" element={<ProtectedRoute><Layout><Transferencias /></Layout></ProtectedRoute>} />
            <Route path="/caixa" element={<ProtectedRoute><Layout><Caixa /></Layout></ProtectedRoute>} />
            <Route path="/dre-gerencial" element={<ProtectedRoute><Layout><DreGerencial /></Layout></ProtectedRoute>} />
            <Route path="/relatorios-gerenciais" element={<ProtectedRoute><Layout><RelatoriosGerenciais /></Layout></ProtectedRoute>} />
            <Route path="/calendario-financeiro" element={<ProtectedRoute><Layout><CalendarioFinanceiro /></Layout></ProtectedRoute>} />
            <Route path="/tarefas" element={<ProtectedRoute><Layout><Tarefas /></Layout></ProtectedRoute>} />
            <Route path="/orcamentos" element={<ProtectedRoute><Layout><Orcamentos /></Layout></ProtectedRoute>} />
            <Route path="/ordens-servico" element={<ProtectedRoute><Layout><OrdensServico /></Layout></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><Layout><Vendas /></Layout></ProtectedRoute>} />
            <Route path="/estoque/movimentacoes" element={<ProtectedRoute><Layout><Movimentacoes /></Layout></ProtectedRoute>} />
            <Route path="/auxiliares/caixas" element={<ProtectedRoute><Layout><Caixa /></Layout></ProtectedRoute>} />
            <Route path="/auxiliares/contas-bancarias" element={<ProtectedRoute><Layout><ContasBancarias /></Layout></ProtectedRoute>} />
            <Route path="/auxiliares/cartoes-credito" element={<ProtectedRoute><Layout><CartoesCredito /></Layout></ProtectedRoute>} />
            <Route path="/auxiliares/formas-de-pagamento" element={<ProtectedRoute><Layout><PaymentMethods /></Layout></ProtectedRoute>} />
            <Route path="/auxiliares/centros-custos" element={<ProtectedRoute><Layout><CentrosCustos /></Layout></ProtectedRoute>} />
            <Route path="/contas-fixas" element={<ProtectedRoute><Layout><ContasFixas /></Layout></ProtectedRoute>} />
            <Route path="/receitas-fixas" element={<ProtectedRoute><Layout><ReceitasFixas /></Layout></ProtectedRoute>} />
            <Route path="/relatorio-recorrencias" element={<ProtectedRoute><Layout><RelatorioRecorrencias /></Layout></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
            <Route path="/cadastros/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
            <Route path="/cadastros/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
            <Route path="/cadastros/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
            <Route path="/cadastros/funcionarios" element={<ProtectedRoute><Layout><Funcionarios /></Layout></ProtectedRoute>} />
            <Route path="/cadastros/produtos" element={<ProtectedRoute><Layout><Produtos /></Layout></ProtectedRoute>} />
            <Route path="/cadastros/servicos" element={<ProtectedRoute><Layout><Servicos /></Layout></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
            <Route path="/plano-contas" element={<ProtectedRoute><Layout><PlanoContas /></Layout></ProtectedRoute>} />
            <Route path="/lancamentos-diarios" element={<ProtectedRoute><Layout><LancamentosDiarios /></Layout></ProtectedRoute>} />
            <Route path="/formas-pagamento" element={<ProtectedRoute><Layout><PaymentMethods /></Layout></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
