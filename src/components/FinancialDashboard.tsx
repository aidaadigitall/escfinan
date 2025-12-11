import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfYear, subYears, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, DollarSign, BarChart3, PieChartIcon, Activity, Download, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToExcel, exportToPDF } from "@/utils/financialReportExport";
import { toast } from "sonner";

const CHART_COLORS = [
  "hsl(142, 76%, 36%)", // green
  "hsl(0, 84%, 60%)",   // red  
  "hsl(217, 91%, 60%)", // blue
  "hsl(45, 93%, 47%)",  // yellow
  "hsl(280, 68%, 60%)", // purple
  "hsl(16, 100%, 66%)", // orange
  "hsl(173, 80%, 40%)", // teal
  "hsl(340, 82%, 52%)", // pink
];

export function FinancialDashboard() {
  const { transactions, isLoading } = useTransactions();
  const { categories: expenseCategories } = useCategories("expense");
  const { categories: incomeCategories } = useCategories("income");
  const [selectedPeriod, setSelectedPeriod] = useState("6months");

  // Calculate period bounds
  const periodBounds = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case "3months":
        return { start: subMonths(startOfMonth(now), 2), end: endOfMonth(now), months: 3 };
      case "6months":
        return { start: subMonths(startOfMonth(now), 5), end: endOfMonth(now), months: 6 };
      case "12months":
        return { start: subMonths(startOfMonth(now), 11), end: endOfMonth(now), months: 12 };
      default:
        return { start: subMonths(startOfMonth(now), 5), end: endOfMonth(now), months: 6 };
    }
  }, [selectedPeriod]);

  // Monthly evolution data
  const monthlyEvolution = useMemo(() => {
    const months = eachMonthOfInterval({ start: periodBounds.start, end: periodBounds.end });
    
    return months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const income = transactions
        .filter((t) => 
          t.type === "income" && 
          new Date(t.due_date) >= monthStart && 
          new Date(t.due_date) <= monthEnd &&
          (t.status === "received" || t.status === "confirmed")
        )
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      const expenses = transactions
        .filter((t) => 
          t.type === "expense" && 
          new Date(t.due_date) >= monthStart && 
          new Date(t.due_date) <= monthEnd &&
          (t.status === "paid" || t.status === "confirmed")
        )
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      return {
        month: format(monthDate, "MMM/yy", { locale: ptBR }),
        fullMonth: format(monthDate, "MMMM yyyy", { locale: ptBR }),
        receitas: income,
        despesas: expenses,
        saldo: income - expenses,
      };
    });
  }, [transactions, periodBounds]);

  // Totals
  const totals = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const currentIncome = transactions
      .filter((t) => 
        t.type === "income" && 
        new Date(t.due_date) >= currentMonthStart && 
        new Date(t.due_date) <= currentMonthEnd &&
        (t.status === "received" || t.status === "confirmed")
      )
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const currentExpenses = transactions
      .filter((t) => 
        t.type === "expense" && 
        new Date(t.due_date) >= currentMonthStart && 
        new Date(t.due_date) <= currentMonthEnd &&
        (t.status === "paid" || t.status === "confirmed")
      )
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const lastIncome = transactions
      .filter((t) => 
        t.type === "income" && 
        new Date(t.due_date) >= lastMonthStart && 
        new Date(t.due_date) <= lastMonthEnd &&
        (t.status === "received" || t.status === "confirmed")
      )
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const lastExpenses = transactions
      .filter((t) => 
        t.type === "expense" && 
        new Date(t.due_date) >= lastMonthStart && 
        new Date(t.due_date) <= lastMonthEnd &&
        (t.status === "paid" || t.status === "confirmed")
      )
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;

    return {
      currentIncome,
      currentExpenses,
      currentBalance: currentIncome - currentExpenses,
      incomeChange,
      expenseChange,
      balanceChange: (currentIncome - currentExpenses) - (lastIncome - lastExpenses),
    };
  }, [transactions]);

  // Expenses by category (pie chart)
  const expensesByCategory = useMemo(() => {
    const filtered = transactions.filter((t) =>
      t.type === "expense" &&
      new Date(t.due_date) >= periodBounds.start &&
      new Date(t.due_date) <= periodBounds.end &&
      (t.status === "paid" || t.status === "confirmed")
    );

    const grouped = filtered.reduce((acc, t) => {
      const categoryName = expenseCategories.find((c) => c.id === t.category_id)?.name || "Sem categoria";
      acc[categoryName] = (acc[categoryName] || 0) + (t.paid_amount || t.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, expenseCategories, periodBounds]);

  // Income by category (pie chart)
  const incomeByCategory = useMemo(() => {
    const filtered = transactions.filter((t) =>
      t.type === "income" &&
      new Date(t.due_date) >= periodBounds.start &&
      new Date(t.due_date) <= periodBounds.end &&
      (t.status === "received" || t.status === "confirmed")
    );

    const grouped = filtered.reduce((acc, t) => {
      const categoryName = incomeCategories.find((c) => c.id === t.category_id)?.name || "Sem categoria";
      acc[categoryName] = (acc[categoryName] || 0) + (t.paid_amount || t.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, incomeCategories, periodBounds]);

  // Comparative bar chart data
  const comparativeData = useMemo(() => {
    return monthlyEvolution.map((m) => ({
      ...m,
      receitasPositive: m.receitas,
      despesasNegative: -m.despesas,
    }));
  }, [monthlyEvolution]);

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case "3months": return "Últimos 3 meses";
      case "6months": return "Últimos 6 meses";
      case "12months": return "Últimos 12 meses";
      default: return "Últimos 6 meses";
    }
  }, [selectedPeriod]);

  const handleExportExcel = () => {
    try {
      exportToExcel({
        monthlyEvolution,
        expensesByCategory,
        incomeByCategory,
        totals,
        periodLabel,
      });
      toast.success("Relatório Excel exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar relatório Excel");
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF({
        monthlyEvolution,
        expensesByCategory,
        incomeByCategory,
        totals,
        periodLabel,
      });
      toast.success("Relatório PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with period selector and export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Financeiro</h2>
          <p className="text-muted-foreground">Análise comparativa de receitas vs despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                <FileText className="h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              Receitas do Mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.currentIncome)}</div>
            <p className={cn(
              "text-xs flex items-center gap-1",
              totals.incomeChange >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {totals.incomeChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {totals.incomeChange.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              Despesas do Mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.currentExpenses)}</div>
            <p className={cn(
              "text-xs flex items-center gap-1",
              totals.expenseChange <= 0 ? "text-green-600" : "text-red-600"
            )}>
              {totals.expenseChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {totals.expenseChange.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Saldo do Mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totals.currentBalance >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(totals.currentBalance)}
            </div>
            <p className={cn(
              "text-xs flex items-center gap-1",
              totals.balanceChange >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {totals.balanceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatCurrency(Math.abs(totals.balanceChange))} vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Evolução</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Comparativo</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Despesas</span>
          </TabsTrigger>
          <TabsTrigger value="income" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Receitas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>Receitas, despesas e saldo ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    name="Receitas"
                    stroke="hsl(142, 76%, 36%)"
                    fill="hsl(142, 76%, 36%)"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke="hsl(0, 84%, 60%)"
                    fill="hsl(0, 84%, 60%)"
                    fillOpacity={0.3}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(217, 91%, 60%)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Mensal</CardTitle>
              <CardDescription>Receitas vs Despesas por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                  />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>Distribuição das despesas no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {expensesByCategory.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Receitas por Categoria</CardTitle>
              <CardDescription>Distribuição das receitas no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#82ca9d"
                      dataKey="value"
                    >
                      {incomeByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {incomeByCategory.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
