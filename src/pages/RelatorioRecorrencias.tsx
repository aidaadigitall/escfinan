import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Loader2, TrendingDown, TrendingUp, FileText } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const RelatorioRecorrencias = () => {
  const [selectedBill, setSelectedBill] = useState<string | null>(null);

  const { data: recurringBills = [], isLoading: loadingBills } = useQuery({
    queryKey: ["recurring-bills-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .eq("is_active", true)
        .order("description");

      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions-recurring", selectedBill],
    queryFn: async () => {
      if (!selectedBill) return [];

      const bill = recurringBills.find((b: any) => b.id === selectedBill);
      if (!bill) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("description", bill.description)
        .order("due_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedBill,
  });

  const getRecurrenceLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
      "2months": "2 meses",
      "3months": "3 meses",
      "4months": "4 meses",
      "6months": "6 meses",
      yearly: "Anual",
    };
    return labels[type] || type;
  };

  const getNextOccurrences = (bill: any, count: number = 6) => {
    const today = new Date();
    const occurrences: Date[] = [];
    const startDate = new Date(bill.start_date);

    if (today < startDate) {
      occurrences.push(startDate);
    }

    switch (bill.recurrence_type) {
      case 'monthly':
        for (let i = 0; i < count; i++) {
          const date = addMonths(today, i);
          const day = bill.recurrence_day || 1;
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const actualDay = Math.min(day, lastDay);
          const nextDate = new Date(date.getFullYear(), date.getMonth(), actualDay);
          
          if (nextDate >= today && (!bill.end_date || nextDate <= new Date(bill.end_date))) {
            occurrences.push(nextDate);
          }
        }
        break;
      case '2months':
        for (let i = 0; i < count * 2; i += 2) {
          const date = addMonths(today, i);
          const day = bill.recurrence_day || 1;
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const actualDay = Math.min(day, lastDay);
          const nextDate = new Date(date.getFullYear(), date.getMonth(), actualDay);
          
          if (nextDate >= today && (!bill.end_date || nextDate <= new Date(bill.end_date))) {
            occurrences.push(nextDate);
          }
        }
        break;
      case '3months':
        for (let i = 0; i < count * 3; i += 3) {
          const date = addMonths(today, i);
          const day = bill.recurrence_day || 1;
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const actualDay = Math.min(day, lastDay);
          const nextDate = new Date(date.getFullYear(), date.getMonth(), actualDay);
          
          if (nextDate >= today && (!bill.end_date || nextDate <= new Date(bill.end_date))) {
            occurrences.push(nextDate);
          }
        }
        break;
      case '4months':
        for (let i = 0; i < count * 4; i += 4) {
          const date = addMonths(today, i);
          const day = bill.recurrence_day || 1;
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const actualDay = Math.min(day, lastDay);
          const nextDate = new Date(date.getFullYear(), date.getMonth(), actualDay);
          
          if (nextDate >= today && (!bill.end_date || nextDate <= new Date(bill.end_date))) {
            occurrences.push(nextDate);
          }
        }
        break;
      case '6months':
        for (let i = 0; i < count * 6; i += 6) {
          const date = addMonths(today, i);
          const day = bill.recurrence_day || 1;
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const actualDay = Math.min(day, lastDay);
          const nextDate = new Date(date.getFullYear(), date.getMonth(), actualDay);
          
          if (nextDate >= today && (!bill.end_date || nextDate <= new Date(bill.end_date))) {
            occurrences.push(nextDate);
          }
        }
        break;
      case 'yearly':
        for (let i = 0; i < count; i++) {
          const nextDate = new Date(today.getFullYear() + i, startDate.getMonth(), startDate.getDate());
          if (nextDate >= today && (!bill.end_date || nextDate <= new Date(bill.end_date))) {
            occurrences.push(nextDate);
          }
        }
        break;
    }

    return occurrences.slice(0, count);
  };

  const selectedBillData = useMemo(() => {
    if (!selectedBill) return null;
    return recurringBills.find((b: any) => b.id === selectedBill);
  }, [selectedBill, recurringBills]);

  const nextOccurrences = useMemo(() => {
    if (!selectedBillData) return [];
    return getNextOccurrences(selectedBillData);
  }, [selectedBillData]);

  const statistics = useMemo(() => {
    if (!transactions.length) return null;

    const paid = transactions.filter((t: any) => 
      t.status === 'paid' || t.status === 'received' || t.status === 'confirmed'
    );
    const pending = transactions.filter((t: any) => t.status === 'pending');
    const overdue = transactions.filter((t: any) => t.status === 'overdue');

    const totalPaid = paid.reduce((sum: number, t: any) => {
      const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
      return sum + parseFloat(paidValue);
    }, 0);

    return {
      total: transactions.length,
      paid: paid.length,
      pending: pending.length,
      overdue: overdue.length,
      totalPaid,
      averageAmount: totalPaid / (paid.length || 1),
    };
  }, [transactions]);

  if (loadingBills) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatório de Recorrências</h1>
        <p className="text-muted-foreground mt-2">
          Histórico e projeções de contas recorrentes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contas Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recurringBills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma conta recorrente cadastrada
                </p>
              ) : (
                recurringBills.map((bill: any) => (
                  <Button
                    key={bill.id}
                    variant={selectedBill === bill.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedBill(bill.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {bill.type === 'income' ? (
                        <TrendingUp className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{bill.description}</span>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {!selectedBillData ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecione uma conta recorrente para ver os detalhes
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Recorrência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">
                        {selectedBillData.type === 'income' ? 'Receita' : 'Despesa'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className={`font-medium ${
                        selectedBillData.type === 'income' ? 'text-income' : 'text-expense'
                      }`}>
                        R$ {Number(selectedBillData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recorrência</p>
                      <p className="font-medium">{getRecurrenceLabel(selectedBillData.recurrence_type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dia da Recorrência</p>
                      <p className="font-medium">{selectedBillData.recurrence_day || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Início</p>
                      <p className="font-medium">
                        {format(parseISO(selectedBillData.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Término</p>
                      <p className="font-medium">
                        {selectedBillData.end_date 
                          ? format(parseISO(selectedBillData.end_date), "dd/MM/yyyy", { locale: ptBR })
                          : 'Indeterminado'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {statistics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Lançamentos</p>
                        <p className="text-2xl font-bold">{statistics.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pagos</p>
                        <p className="text-2xl font-bold text-income">{statistics.paid}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pendentes</p>
                        <p className="text-2xl font-bold text-warning">{statistics.pending}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Atrasados</p>
                        <p className="text-2xl font-bold text-expense">{statistics.overdue}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Total Pago</p>
                        <p className="text-2xl font-bold">
                          R$ {statistics.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Média por Pagamento</p>
                        <p className="text-2xl font-bold">
                          R$ {statistics.averageAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximas Ocorrências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {nextOccurrences.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span className="font-medium">
                          {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        <span className={`font-semibold ${
                          selectedBillData.type === 'income' ? 'text-income' : 'text-expense'
                        }`}>
                          R$ {Number(selectedBillData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTransactions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum lançamento encontrado
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data de Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data de Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(parseISO(transaction.due_date), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                transaction.status === 'paid' || transaction.status === 'received' || transaction.status === 'confirmed'
                                  ? 'default'
                                  : transaction.status === 'overdue'
                                  ? 'destructive'
                                  : 'secondary'
                              }>
                                {transaction.status === 'paid' || transaction.status === 'received' ? 'Pago' :
                                 transaction.status === 'confirmed' ? 'Confirmado' :
                                 transaction.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {transaction.paid_date 
                                ? format(parseISO(transaction.paid_date), "dd/MM/yyyy", { locale: ptBR })
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {(() => {
                                const paidValue = transaction.paid_amount && transaction.paid_amount > 0 
                                  ? transaction.paid_amount 
                                  : transaction.amount;
                                return parseFloat(paidValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatorioRecorrencias;
