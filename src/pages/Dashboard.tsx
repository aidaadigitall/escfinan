import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";

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
          linkText="Ir para contas a receber"
          onLinkClick={() => navigate("/receitas")}
        />
        <StatCard
          title="A pagar hoje"
          amount={`R$ ${todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          variant="expense"
          linkText="Ir para contas a pagar"
          onLinkClick={() => navigate("/despesas")}
        />
        <ProgressCard
          title="Recebimentos do mês"
          subtitle={currentMonth}
          completed={`R$ ${monthIncomeReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          pending={`R$ ${monthIncomePending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          expected={`R$ ${(monthIncomeReceived + monthIncomePending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          percentage={incomePercentage}
          linkText="Ir para fluxo de caixa"
        />
        <ProgressCard
          title="Pagamentos do mês"
          subtitle={currentMonth}
          completed={`R$ ${monthExpensesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          pending={`R$ ${monthExpensesPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          expected={`R$ ${(monthExpensesPaid + monthExpensesPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          percentage={expensePercentage}
          linkText="Ir para fluxo de caixa"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CashFlowChart />
        <SalesChart />
      </div>
    </div>
  );
};

export default Dashboard;
