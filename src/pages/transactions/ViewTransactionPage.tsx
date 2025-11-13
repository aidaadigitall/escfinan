import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, History, MessageSquare } from "lucide-react";

// Componente auxiliar para exibir um campo de dado
const DataField = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="text-sm">
    <span className="font-semibold text-gray-600">{label}:</span>
    <p className="text-gray-800">{value || "N/A"}</p>
  </div>
);

const ViewTransactionPage = () => {
  const { id, type } = useParams<{ id: string; type: "income" | "expense" }>();
  const navigate = useNavigate();
  const transactionType = type === "income" ? "Recebimento" : "Pagamento";

  const { transactions } = useTransactions(type as "income" | "expense");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const existingTransaction = transactions.find(t => t.id === id);
      if (existingTransaction) {
        setTransaction(existingTransaction);
      } else {
        toast.error(`Transação ${id} não encontrada.`);
        navigate(type === "income" ? "/receitas" : "/despesas");
      }
    }
    setLoading(false);
  }, [id, transactions, navigate, type]);

  if (loading) return <div className="p-4">Carregando...</div>;
  if (!transaction) return null;

  const isIncome = type === "income";
  const entityLabel = isIncome ? "Cliente" : "Fornecedor";
  const statusText = transaction.status === 'paid' ? 'Pago' : transaction.status === 'received' ? 'Recebido' : transaction.status === 'pending' ? 'Pendente' : 'Vencido';
  const statusVariant = transaction.status === 'paid' || transaction.status === 'received' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive';
  const statusClass = transaction.status === 'pending' ? 'bg-orange-500 text-white hover:bg-orange-600' : '';

  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined) return "R$ 0,00";
    return parseFloat(value.toString()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleEdit = () => {
    navigate(`/transactions/${type}/edit/${transaction.id}`);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Visualizar {transactionType.toLowerCase()} #{transaction.id?.substring(0, 6)}
          <Badge variant={statusVariant} className={statusClass}>{statusText}</Badge>
        </h1>
        <Button onClick={handleEdit} variant="default">
          Editar {transactionType.toLowerCase()}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Dados Gerais e Entidade */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DataField label="Código" value={transaction.id?.substring(0, 6)} />
              <DataField label="Descrição" value={transaction.description} />
              <DataField label="Valor Bruto" value={formatCurrency(transaction.amount)} />
              <DataField label="Juros" value={formatCurrency(transaction.interest || 0)} />
              <DataField label="Desconto" value={formatCurrency(transaction.discount || 0)} />
              <DataField label="Valor Total" value={formatCurrency(transaction.amount)} /> {/* Simplesmente usando amount por enquanto */}
              <DataField label="Data de Vencimento" value={formatDate(transaction.due_date)} />
              <DataField label="Data de Competência" value={formatDate((transaction as any).competence_date)} />
              <DataField label="Cadastrado em" value={formatDate(transaction.created_at)} />
              <DataField label="Modificado em" value={formatDate(transaction.updated_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{entityLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataField label="Nome" value={transaction.entity} />
              <Button variant="link" className="p-0 h-auto mt-2" onClick={handleEdit}>
                Editar detalhes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nenhum anexo cadastrado!</p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Detalhes, Histórico e Interações */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do {transactionType.toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DataField label="Forma de Pagamento" value={transaction.payment_method} />
              <DataField label="Conta Bancária" value={transaction.bank_account_id} /> {/* ID por enquanto */}
              <DataField label="Plano de Contas" value={transaction.account} />
              <DataField label="Parcelas" value={transaction.installments || "1/1"} />
              <DataField label="Valor Total" value={formatCurrency(transaction.amount)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Simulação de Histórico */}
                <div className="flex justify-between items-center text-sm border-b pb-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Elton Santos</span>
                  </div>
                  <span className="text-xs text-gray-500">08/08/2023 - 14:47:53</span>
                </div>
                <p className="text-sm text-muted-foreground">Lançamento inicial</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">ES</div>
                <Input placeholder="Adicionar comentário..." className="flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewTransactionPage;
