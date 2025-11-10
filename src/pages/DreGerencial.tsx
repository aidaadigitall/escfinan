import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFluxoCaixaData } from "@/hooks/useFluxoCaixaData";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DreGerencial() {
  const startDate = new Date();
  startDate.setDate(1); // Primeiro dia do mês
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0); // Último dia do mês

  const { income, expenses, balance, isLoading, categoryData } = useFluxoCaixaData({
    start: startDate,
    end: endDate,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const grossProfit = income;
  const operatingProfit = income - expenses;
  const netProfit = operatingProfit;

  const grossMargin = income > 0 ? (grossProfit / income) * 100 : 0;
  const operatingMargin = income > 0 ? (operatingProfit / income) * 100 : 0;
  const netMargin = income > 0 ? (netProfit / income) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DRE Gerencial</h1>
        <p className="text-muted-foreground mt-2">
          Demonstrativo do Resultado do Exercício - {format(startDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Receitas Brutas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Receitas</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Bruto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Lucro Bruto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor</span>
              <span className="text-2xl font-bold">
                R$ {grossProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Margem Bruta</span>
              <span className="font-semibold">{grossMargin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Despesas Operacionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Despesas Operacionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryData.map((category) => (
              <div key={category.name} className="flex justify-between items-center">
                <span className="text-muted-foreground">{category.name}</span>
                <span className="font-semibold text-red-600">
                  R$ {category.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total de Despesas</span>
                <span className="text-xl font-bold text-red-600">
                  R$ {expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Operacional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Lucro Operacional (EBIT)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor</span>
              <span className={`text-2xl font-bold ${operatingProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                R$ {operatingProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Margem Operacional</span>
              <span className="font-semibold">{operatingMargin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Resultado Final</span>
              <span className={`text-3xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                R$ {netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Margem Líquida</span>
              <span className="font-semibold">{netMargin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Resumo Executivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Receita Bruta:</span>
              <span className="font-semibold">R$ {income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>(-) Despesas Operacionais:</span>
              <span className="font-semibold text-red-600">R$ {expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-bold">(=) Lucro Líquido:</span>
              <span className={`font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                R$ {netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
