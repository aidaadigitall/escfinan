import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="A receber hoje"
          amount="R$ 130,00"
          variant="income"
          linkText="Ir para contas a receber"
          onLinkClick={() => navigate("/receitas")}
        />
        <StatCard
          title="A pagar hoje"
          amount="R$ 200,00"
          variant="expense"
          linkText="Ir para contas a pagar"
          onLinkClick={() => navigate("/despesas")}
        />
        <ProgressCard
          title="Recebimentos do mês"
          subtitle="Novembro 2025"
          completed="R$ 522,58"
          pending="R$ 8.388,44"
          expected="R$ 8.911,02"
          percentage={5.9}
          linkText="Ir para fluxo de caixa"
        />
        <ProgressCard
          title="Pagamentos do mês"
          subtitle="Novembro 2025"
          completed="R$ 794,39"
          pending="R$ 12.190,10"
          expected="R$ 12.984,49"
          percentage={6.1}
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
