import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Caixa() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["cash-transactions", selectedDate],
    queryFn: async () => {
      const date = new Date(selectedDate);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("due_date", start.toISOString())
        .lte("due_date", end.toISOString())
        .in("status", ["paid", "received", "confirmed"])
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const summary = useMemo(() => {
    const income = transactions
      .filter((t: any) => t.type === "income")
      .reduce((sum, t) => {
        const value = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
        return sum + parseFloat(value.toString());
      }, 0);

    const expenses = transactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum, t) => {
        const value = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
        return sum + parseFloat(value.toString());
      }, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-4 md:px-6 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Caixa Diário
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Acompanhe as movimentações financeiras do dia
          </p>
        </div>
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-1 border rounded-md bg-background text-foreground dark:bg-slate-800 dark:text-white text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {summary.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter((t: any) => t.type === "income").length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {summary.expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter((t: any) => t.type === "expense").length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Dia</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? "text-success" : "text-destructive"}`}>
              R$ {summary.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.length} transações totais
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações do Dia</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-2 sm:p-4">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma movimentação neste dia
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === "income"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {transaction.type === "income" ? "Entrada" : "Saída"}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.account || "-"}</TableCell>
                      <TableCell>{transaction.payment_method || "-"}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        transaction.type === "income" ? "text-success" : "text-destructive"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}
                        R$ {parseFloat(transaction.paid_amount && transaction.paid_amount > 0 ? transaction.paid_amount : transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
