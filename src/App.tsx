import { Toaster } from "@/components/ui/toaster";
import Movimentacoes from "@/pages/estoque/Movimentacoes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PermissionProtectedRoute } from "./components/PermissionProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
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
import RelatorioTarefas from "./pages/RelatorioTarefas";
import Orcamentos from "./pages/Orcamentos";
import OrdensServico from "./pages/OrdensServico";
import Vendas from "./pages/Vendas";
import PublicBilling from "./pages/PublicBilling";
import ControlePonto from "./pages/ControlePonto";
import ControlePontoRH from "./pages/ControlePontoRH";
import PontoApprovalsPage from "./pages/PontoApprovalsPage";
import CRM from "./pages/CRM";
import Projects from "./pages/Projects";
import PrintDocument from "./pages/PrintDocument";

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
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Public billing page - no auth required */}
            <Route path="/cobranca/:type/:id" element={<PublicBilling />} />
            
            {/* Print document route */}
            <Route path="/print/document/:type/:id" element={
              <ProtectedRoute>
                <PrintDocument />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            
            {/* Financial routes with permission protection */}
            <Route path="/receitas" element={
              <PermissionProtectedRoute permission="can_view_receivables">
                <Layout><Receitas /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/despesas" element={
              <PermissionProtectedRoute permission="can_view_payables">
                <Layout><Despesas /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/fluxo-de-caixa" element={
              <PermissionProtectedRoute permission="can_view_cashflow">
                <Layout><FluxoDeCaixa /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/transferencias" element={
              <PermissionProtectedRoute permission="can_view_transfers">
                <Layout><Transferencias /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/caixa" element={
              <PermissionProtectedRoute permission="can_view_cash">
                <Layout><Caixa /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/dre-gerencial" element={
              <PermissionProtectedRoute permission="can_view_dre">
                <Layout><DreGerencial /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/relatorios-gerenciais" element={
              <PermissionProtectedRoute permission="can_view_reports">
                <Layout><RelatoriosGerenciais /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/calendario-financeiro" element={
              <PermissionProtectedRoute permission="can_view_calendar">
                <Layout><CalendarioFinanceiro /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/tarefas" element={
              <PermissionProtectedRoute permission="can_view_tasks">
                <Layout><Tarefas /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/relatorio-tarefas" element={
              <PermissionProtectedRoute permission="can_view_tasks">
                <Layout><RelatorioTarefas /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/contas-fixas" element={
              <PermissionProtectedRoute permission="can_view_fixed_expenses">
                <Layout><ContasFixas /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/receitas-fixas" element={
              <PermissionProtectedRoute permission="can_view_fixed_income">
                <Layout><ReceitasFixas /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/lancamentos-diarios" element={
              <PermissionProtectedRoute permission="can_view_daily_entries">
                <Layout><LancamentosDiarios /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Commercial routes */}
            <Route path="/orcamentos" element={
              <PermissionProtectedRoute permission="can_view_quotes">
                <Layout><Orcamentos /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/ordens-servico" element={
              <PermissionProtectedRoute permission="can_view_service_orders">
                <Layout><OrdensServico /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/vendas" element={
              <PermissionProtectedRoute permission="can_view_sales">
                <Layout><Vendas /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* CRM route */}
            <Route path="/crm" element={
              <PermissionProtectedRoute permission="can_view_crm">
                <Layout><CRM /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Projects route */}
            <Route path="/projetos" element={
              <PermissionProtectedRoute permission="can_view_projects">
                <Layout><Projects /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Stock routes */}
            <Route path="/estoque/movimentacoes" element={
              <PermissionProtectedRoute permission="can_view_stock_movements">
                <Layout><Movimentacoes /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Auxiliary routes */}
            <Route path="/auxiliares/caixas" element={
              <PermissionProtectedRoute permission="can_view_cash">
                <Layout><Caixa /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/auxiliares/contas-bancarias" element={
              <PermissionProtectedRoute permission="can_view_bank_accounts">
                <Layout><ContasBancarias /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/auxiliares/cartoes-credito" element={
              <PermissionProtectedRoute permission="can_view_credit_cards">
                <Layout><CartoesCredito /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/auxiliares/formas-de-pagamento" element={
              <PermissionProtectedRoute permission="can_view_payment_methods">
                <Layout><PaymentMethods /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/auxiliares/centros-custos" element={
              <PermissionProtectedRoute permission="can_view_cost_centers">
                <Layout><CentrosCustos /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/categorias" element={
              <PermissionProtectedRoute permission="can_view_categories">
                <Layout><Categorias /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/plano-contas" element={
              <PermissionProtectedRoute permission="can_view_chart_of_accounts">
                <Layout><PlanoContas /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/formas-pagamento" element={
              <PermissionProtectedRoute permission="can_view_payment_methods">
                <Layout><PaymentMethods /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Cadastros routes */}
            <Route path="/cadastros/usuarios" element={
              <PermissionProtectedRoute permission="can_view_users">
                <Layout><Usuarios /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/cadastros/clientes" element={
              <PermissionProtectedRoute permission="can_view_clients">
                <Layout><Clientes /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/cadastros/fornecedores" element={
              <PermissionProtectedRoute permission="can_view_suppliers">
                <Layout><Fornecedores /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/cadastros/funcionarios" element={
              <PermissionProtectedRoute permission="can_view_employees">
                <Layout><Funcionarios /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/cadastros/produtos" element={
              <PermissionProtectedRoute permission="can_view_products">
                <Layout><Produtos /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/cadastros/servicos" element={
              <PermissionProtectedRoute permission="can_view_services">
                <Layout><Servicos /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Settings and profile */}
            <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />
            <Route path="/configuracoes" element={
              <PermissionProtectedRoute permission="can_view_settings">
                <Layout><Configuracoes /></Layout>
              </PermissionProtectedRoute>
            } />
            <Route path="/relatorio-recorrencias" element={
              <PermissionProtectedRoute permission="can_view_reports">
                <Layout><RelatorioRecorrencias /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Time tracking route */}
            <Route path="/controle-ponto" element={
              <ProtectedRoute>
                <Layout><ControlePonto /></Layout>
              </ProtectedRoute>
            } />
            
            {/* Time tracking RH/Admin panel */}
            <Route path="/controle-ponto/rh" element={
              <PermissionProtectedRoute permission="can_manage_users">
                <Layout><ControlePontoRH /></Layout>
              </PermissionProtectedRoute>
            } />
            
            {/* Time tracking approvals integrated under Controle de Ponto */}
            <Route path="/controle-ponto/aprovacoes" element={
              <ProtectedRoute>
                <Layout><PontoApprovalsPage /></Layout>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
