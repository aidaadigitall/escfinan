import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/hooks/useTransactions";
import { DailyTransactionDialog } from "@/components/DailyTransactionDialog";

const LancamentosDiarios = () => {
  const { transactions: incomeTransactions, isLoading: incomeLoading, createTransaction: createIncome } = useTransactions("income");
  const { transactions: expenseTransactions, isLoading: expenseLoading, createTransaction: createExpense } = useTransactions("expense");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("income");

  const handleOpenDialog = (type: "income" | "expense") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleSaveTransaction = (data: any) => {
    if (dialogType === "income") {
      createIncome(data);
    } else {
      createExpense(data);
    }
  };

  // Filter only transactions with status paid or received (daily transactions)
  const dailyIncomes = incomeTransactions.filter(t => t.status === "received" || t.status === "confirmed");
  const dailyExpenses = expenseTransactions.filter(t => t.status === "paid" || t.status === "confirmed");

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lançamentos Diários</h2>
      </div>

      <Tabs defaultValue="receitas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="receitas">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Receitas Diárias</h3>
              <Button onClick={() => handleOpenDialog("income")}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Receita
              </Button>
            </div>
            
            {incomeLoading ? (
              <div>Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Forma Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyIncomes.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.paid_date || transaction.due_date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.client || "-"}</TableCell>
                      <TableCell>{transaction.category_id || "-"}</TableCell>
                      <TableCell>{transaction.payment_method || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="default">Recebido</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(transaction.paid_amount || transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {dailyIncomes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhuma receita lançada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="despesas">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Despesas Diárias</h3>
              <Button onClick={() => handleOpenDialog("expense")}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </div>
            
            {expenseLoading ? (
              <div>Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Forma Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyExpenses.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.paid_date || transaction.due_date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.entity || "-"}</TableCell>
                      <TableCell>{transaction.category_id || "-"}</TableCell>
                      <TableCell>{transaction.payment_method || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pago</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatCurrency(transaction.paid_amount || transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {dailyExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhuma despesa lançada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <DailyTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};

export default LancamentosDiarios;
