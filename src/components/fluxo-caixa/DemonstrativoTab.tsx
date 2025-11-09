import { Card } from "@/components/ui/card";
import { useFluxoCaixaData } from "@/hooks/useFluxoCaixaData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DemonstrativoTabProps {
  selectedPeriod: { start: Date; end: Date };
}

export const DemonstrativoTab = ({ selectedPeriod }: DemonstrativoTabProps) => {
  const {
    income,
    expenses,
    balance,
    finalBalance,
    incomeTransactions,
    expenseTransactions,
    pendingIncome,
    pendingExpenses,
    isLoading,
  } = useFluxoCaixaData(selectedPeriod);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const receivedIncome = incomeTransactions
    .filter(t => t.status === "received" || t.status === "confirmed")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const paidExpenses = expenseTransactions
    .filter(t => t.status === "paid" || t.status === "confirmed")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold">Demonstrativo Financeiro</h2>
          <p className="text-muted-foreground mt-2">
            Período: {format(selectedPeriod.start, "dd/MM/yyyy", { locale: ptBR })} a {format(selectedPeriod.end, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receitas */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-income">Receitas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Receitas Recebidas</span>
                <span className="font-semibold">{receivedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Receitas Pendentes</span>
                <span className="font-semibold">{pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Total de Receitas</span>
                <span className="font-bold text-income">{income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Despesas */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-expense">Despesas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Despesas Pagas</span>
                <span className="font-semibold">{paidExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas Pendentes</span>
                <span className="font-semibold">{pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Total de Despesas</span>
                <span className="font-bold text-expense">{expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-xl font-bold">Resumo</h3>
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
            <div className="flex justify-between text-lg">
              <span>Total de Receitas</span>
              <span className="font-semibold text-income">+ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Total de Despesas</span>
              <span className="font-semibold text-expense">- {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xl pt-3 border-t border-border">
              <span className="font-bold">Saldo do Período</span>
              <span className={`font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xl pt-3 border-t border-border">
              <span className="font-bold">Saldo Final Previsto</span>
              <span className={`font-bold ${finalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                {finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Card className="p-4 bg-income/10">
            <p className="text-sm text-muted-foreground">Total de Recebimentos</p>
            <p className="text-2xl font-bold text-income">{incomeTransactions.length}</p>
          </Card>
          <Card className="p-4 bg-expense/10">
            <p className="text-sm text-muted-foreground">Total de Pagamentos</p>
            <p className="text-2xl font-bold text-expense">{expenseTransactions.length}</p>
          </Card>
          <Card className="p-4 bg-muted/10">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <p className="text-2xl font-bold">
              {((income + expenses) / (incomeTransactions.length + expenseTransactions.length) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>
      </div>
    </Card>
  );
};
