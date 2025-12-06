import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { UpcomingRecurringBills } from "@/components/dashboard/UpcomingRecurringBills";
import { BankAccountsCard } from "@/components/dashboard/BankAccountsCard";
import { TasksDashboard } from "@/components/dashboard/TasksDashboard";
import { FinancialInsightsWidget } from "@/components/FinancialInsightsWidget";
import RecurringCalendar from "@/components/dashboard/RecurringCalendar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCurrentUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    todayIncome,
    todayExpenses,
    monthIncomeReceived,
    monthIncomePending,
    monthExpensesPaid,
    monthExpensesPending,
    incomePercentage,
    expensePercentage,
    currentMonth,
    isLoading
  } = useDashboardData();

  const { permissions } = useCurrentUserPermissions();
  const hideValues = !permissions.can_view_dashboard_values;

  // Permission-based navigation handlers
  const handleNavigateReceitas = () => {
    if (!permissions.can_view_receivables) {
      toast.error("Você não tem permissão para acessar Contas a Receber");
      return;
    }
    navigate("/receitas");
  };

  const handleNavigateDespesas = () => {
    if (!permissions.can_view_payables) {
      toast.error("Você não tem permissão para acessar Contas a Pagar");
      return;
    }
    navigate("/despesas");
  };

  const handleNavigateFluxoCaixa = () => {
    if (!permissions.can_view_cashflow) {
      toast.error("Você não tem permissão para acessar Fluxo de Caixa");
      return;
    }
    navigate("/fluxo-de-caixa");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="A receber hoje"
          amount={`R$ ${todayIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          variant="income"
          linkText={permissions.can_view_receivables ? "Ir para contas a receber" : undefined}
          onLinkClick={handleNavigateReceitas}
          hideValues={hideValues}
        />
        <StatCard
          title="A pagar hoje"
          amount={`R$ ${todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          variant="expense"
          linkText={permissions.can_view_payables ? "Ir para contas a pagar" : undefined}
          onLinkClick={handleNavigateDespesas}
          hideValues={hideValues}
        />
        <ProgressCard
          title="Recebimentos do mês"
          subtitle={currentMonth}
          completed={`R$ ${monthIncomeReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          pending={`R$ ${monthIncomePending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          expected={`R$ ${(monthIncomeReceived + monthIncomePending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          percentage={incomePercentage}
          linkText={permissions.can_view_cashflow ? "Ir para fluxo de caixa" : undefined}
          onLinkClick={handleNavigateFluxoCaixa}
          hideValues={hideValues}
        />
        <ProgressCard
          title="Pagamentos do mês"
          subtitle={currentMonth}
          completed={`R$ ${monthExpensesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          pending={`R$ ${monthExpensesPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          expected={`R$ ${(monthExpensesPaid + monthExpensesPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          percentage={expensePercentage}
          linkText={permissions.can_view_cashflow ? "Ir para fluxo de caixa" : undefined}
          onLinkClick={handleNavigateFluxoCaixa}
          hideValues={hideValues}
        />
      </div>

      {/* Tasks Dashboard */}
      {permissions.can_view_tasks && (
        <ErrorBoundary>
          <TasksDashboard hideValues={hideValues} />
        </ErrorBoundary>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ErrorBoundary><CashFlowChart hideValues={hideValues} /></ErrorBoundary>
        <ErrorBoundary><SalesChart hideValues={hideValues} /></ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ErrorBoundary><BankAccountsCard hideValues={hideValues} /></ErrorBoundary>
        <ErrorBoundary><UpcomingRecurringBills hideValues={hideValues} /></ErrorBoundary>
      </div>

      <ErrorBoundary>
        <div className="grid grid-cols-1 gap-6">
          <RecurringCalendar />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="grid grid-cols-1 gap-6">
          <FinancialInsightsWidget />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default Dashboard;
