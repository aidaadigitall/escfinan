import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PeriodFilter } from "@/components/PeriodFilter";
import { FinancialDashboard } from "@/components/FinancialDashboard";
import { BarChart3 } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28"];

export default function RelatoriosGerenciais() {
  const { transactions, isLoading } = useTransactions();
  const { categories: expenseCategories } = useCategories("expense");
  const { categories: incomeCategories } = useCategories("income");
  
  const currentMonth = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(currentMonth));
  const [endDate, setEndDate] = useState(endOfMonth(currentMonth));

  const handlePeriodChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Gráfico de Pizza - Despesas por Categoria
  const expensesByCategoryData = useMemo(() => {
    const filtered = transactions.filter(
      (t) => t.type === "expense" && 
      new Date(t.due_date) >= startDate && 
      new Date(t.due_date) <= endDate &&
      (t.status === "paid" || t.status === "confirmed")
    );

    const grouped = filtered.reduce((acc, t) => {
      const categoryId = t.category_id || "Sem categoria";
      const categoryName = expenseCategories.find(c => c.id === categoryId)?.name || "Sem categoria";
      acc[categoryName] = (acc[categoryName] || 0) + (t.paid_amount || t.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions, expenseCategories, startDate, endDate]);

  // Gráfico de Pizza - Receitas por Categoria
  const incomesByCategoryData = useMemo(() => {
    const filtered = transactions.filter(
      (t) => t.type === "income" && 
      new Date(t.due_date) >= startDate && 
      new Date(t.due_date) <= endDate &&
      (t.status === "received" || t.status === "confirmed")
    );

    const grouped = filtered.reduce((acc, t) => {
      const categoryId = t.category_id || "Sem categoria";
      const categoryName = incomeCategories.find(c => c.id === categoryId)?.name || "Sem categoria";
      acc[categoryName] = (acc[categoryName] || 0) + (t.paid_amount || t.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions, incomeCategories, startDate, endDate]);

  // Gráfico de Linha - Evolução dos últimos 6 meses
  const last6MonthsData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const income = transactions
        .filter((t) => t.type === "income" && new Date(t.due_date) >= monthStart && new Date(t.due_date) <= monthEnd && (t.status === "received" || t.status === "confirmed"))
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      const expenses = transactions
        .filter((t) => t.type === "expense" && new Date(t.due_date) >= monthStart && new Date(t.due_date) <= monthEnd && (t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      months.push({
        month: format(monthDate, "MMM/yy", { locale: ptBR }),
        receitas: income,
        despesas: expenses,
        saldo: income - expenses,
      });
    }
    return months;
  }, [transactions]);

  // Comparativo: Mês Atual vs Mês Anterior
  const monthComparison = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const currentIncome = transactions
      .filter((t) => t.type === "income" && new Date(t.due_date) >= currentMonthStart && new Date(t.due_date) <= currentMonthEnd && (t.status === "received" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const lastIncome = transactions
      .filter((t) => t.type === "income" && new Date(t.due_date) >= lastMonthStart && new Date(t.due_date) <= lastMonthEnd && (t.status === "received" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const currentExpenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.due_date) >= currentMonthStart && new Date(t.due_date) <= currentMonthEnd && (t.status === "paid" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const lastExpenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.due_date) >= lastMonthStart && new Date(t.due_date) <= lastMonthEnd && (t.status === "paid" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    return [
      { name: "Mês Anterior", receitas: lastIncome, despesas: lastExpenses, saldo: lastIncome - lastExpenses },
      { name: "Mês Atual", receitas: currentIncome, despesas: currentExpenses, saldo: currentIncome - currentExpenses },
    ];
  }, [transactions]);

  // Comparativo: Ano Atual vs Ano Anterior
  const yearComparison = useMemo(() => {
    const currentYearStart = startOfYear(new Date());
    const currentYearEnd = endOfYear(new Date());
    const lastYearStart = startOfYear(subYears(new Date(), 1));
    const lastYearEnd = endOfYear(subYears(new Date(), 1));

    const currentIncome = transactions
      .filter((t) => t.type === "income" && new Date(t.due_date) >= currentYearStart && new Date(t.due_date) <= currentYearEnd && (t.status === "received" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const lastIncome = transactions
      .filter((t) => t.type === "income" && new Date(t.due_date) >= lastYearStart && new Date(t.due_date) <= lastYearEnd && (t.status === "received" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const currentExpenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.due_date) >= currentYearStart && new Date(t.due_date) <= currentYearEnd && (t.status === "paid" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const lastExpenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.due_date) >= lastYearStart && new Date(t.due_date) <= lastYearEnd && (t.status === "paid" || t.status === "confirmed"))
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    return [
      { name: "Ano Anterior", receitas: lastIncome, despesas: lastExpenses, saldo: lastIncome - lastExpenses },
      { name: "Ano Atual", receitas: currentIncome, despesas: currentExpenses, saldo: currentIncome - currentExpenses },
    ];
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">Análises e visualizações completas dos dados financeiros</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="comparativos">Comparativos</TabsTrigger>
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-6">
          <div className="mb-4">
            <PeriodFilter 
              currentStart={startDate} 
              currentEnd={endDate} 
              onPeriodChange={handlePeriodChange} 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição das despesas pagas no período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={expensesByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
                <CardDescription>Distribuição das receitas recebidas no período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={incomesByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#82ca9d"
                      dataKey="value"
                    >
                      {incomesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal - Últimos 6 Meses</CardTitle>
              <CardDescription>Acompanhamento de receitas, despesas e saldo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={last6MonthsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="hsl(var(--primary))" strokeWidth={2} name="Receitas" />
                  <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2} name="Despesas" />
                  <Line type="monotone" dataKey="saldo" stroke="hsl(var(--accent))" strokeWidth={2} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo Mensal</CardTitle>
                <CardDescription>Mês atual vs mês anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="receitas" fill="hsl(var(--primary))" name="Receitas" />
                    <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                    <Bar dataKey="saldo" fill="hsl(var(--accent))" name="Saldo" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparativo Anual</CardTitle>
                <CardDescription>Ano atual vs ano anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={yearComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="receitas" fill="hsl(var(--primary))" name="Receitas" />
                    <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                    <Bar dataKey="saldo" fill="hsl(var(--accent))" name="Saldo" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo dos Comparativos</CardTitle>
              <CardDescription>Variações percentuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Comparação Mensal</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      Receitas: {monthComparison[0].receitas > 0 
                        ? `${(((monthComparison[1].receitas - monthComparison[0].receitas) / monthComparison[0].receitas) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p>
                      Despesas: {monthComparison[0].despesas > 0
                        ? `${(((monthComparison[1].despesas - monthComparison[0].despesas) / monthComparison[0].despesas) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p className="font-medium">
                      Variação do Saldo: R$ {(monthComparison[1].saldo - monthComparison[0].saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Comparação Anual</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      Receitas: {yearComparison[0].receitas > 0
                        ? `${(((yearComparison[1].receitas - yearComparison[0].receitas) / yearComparison[0].receitas) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p>
                      Despesas: {yearComparison[0].despesas > 0
                        ? `${(((yearComparison[1].despesas - yearComparison[0].despesas) / yearComparison[0].despesas) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p className="font-medium">
                      Variação do Saldo: R$ {(yearComparison[1].saldo - yearComparison[0].saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Tendências</CardTitle>
              <CardDescription>Projeções baseadas nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={last6MonthsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="hsl(var(--primary))" strokeWidth={3} name="Receitas" dot={{ r: 6 }} />
                  <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={3} name="Despesas" dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Média de Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      R$ {(last6MonthsData.reduce((sum, m) => sum + m.receitas, 0) / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Média de Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-destructive">
                      R$ {(last6MonthsData.reduce((sum, m) => sum + m.despesas, 0) / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Saldo Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-accent-foreground">
                      R$ {(last6MonthsData.reduce((sum, m) => sum + m.saldo, 0) / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
