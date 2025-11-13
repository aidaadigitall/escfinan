import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Trash, Copy, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useClients } from "@/hooks/useClients";
import { useSuppliers } from "@/hooks/useSuppliers";
import { QuickAddDialog } from "@/components/QuickAddDialog";

// Simulação de dados para Plano de Contas e Centro de Custo
const costCenters = ["Centro de Custo A", "Centro de Custo B", "Centro de Custo C"];
const accountPlans = ["Plano de Contas 1", "Plano de Contas 2", "Plano de Contas 3"];

const EditTransactionPage = () => {
  const { id, type } = useParams<{ id: string; type: "income" | "expense" }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const transactionType = type === "income" ? "Recebimento" : "Pagamento";

  const { transactions, updateTransaction, createTransaction } = useTransactions(type as "income" | "expense");
  const { categories } = useCategories(type as "income" | "expense");
  const { paymentMethods } = usePaymentMethods();
  const { accounts: bankAccounts } = useBankAccounts();
  const { clients } = useClients();
  const { suppliers } = useSuppliers();

  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [loading, setLoading] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const existingTransaction = transactions.find(t => t.id === id);
      if (existingTransaction) {
        setFormData({
          ...existingTransaction,
          amount: existingTransaction.amount.toString(),
          paid_amount: existingTransaction.paid_amount?.toString(),
          // Garante que as datas sejam strings no formato YYYY-MM-DD para os inputs
          due_date: existingTransaction.due_date ? format(new Date(existingTransaction.due_date), 'yyyy-MM-dd') : '',
          paid_date: existingTransaction.paid_date ? format(new Date(existingTransaction.paid_date), 'yyyy-MM-dd') : '',
          competence_date: (existingTransaction as any).competence_date ? format(new Date((existingTransaction as any).competence_date), 'yyyy-MM-dd') : '',
        });
      } else {
        toast.error(`Transação ${id} não encontrada.`);
        navigate(type === "income" ? "/receitas" : "/despesas");
      }
    } else if (isNew) {
      setFormData({
        type: type,
        status: "pending",
        due_date: format(new Date(), 'yyyy-MM-dd'),
        competence_date: format(new Date(), 'yyyy-MM-dd'),
        amount: "0.00",
      });
    }
    setLoading(false);
  }, [id, isNew, transactions, navigate, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (id: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [id]: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.due_date) {
      toast.error("Preencha os campos obrigatórios: Descrição, Valor e Vencimento.");
      return;
    }

    const dataToSave = {
      ...formData,
      amount: parseFloat(formData.amount as string),
      paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount as string) : undefined,
      type: type,
    };

    try {
      if (isNew) {
        await createTransaction(dataToSave as any);
        toast.success(`${transactionType} adicionado com sucesso!`);
      } else {
        await updateTransaction(id!, dataToSave as any);
        toast.success(`${transactionType} atualizado com sucesso!`);
      }
      navigate(type === "income" ? "/receitas" : "/despesas");
    } catch (error) {
      toast.error(`Erro ao salvar ${transactionType.toLowerCase()}.`);
      console.error(error);
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

  const isIncome = type === "income";
  const entityLabel = isIncome ? "Cliente" : "Fornecedor";
  const entityData = isIncome ? clients : suppliers;

  const renderFinancialTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna 1: Dados Gerais */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Dados gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Descrição do {transactionType.toLowerCase()}*</Label>
            <Input id="description" value={formData.description || ""} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Vencimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(new Date(formData.due_date), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={(date) => handleDateChange("due_date", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_plan">Plano de contas</Label>
            <Select value={formData.account || ""} onValueChange={(value) => handleSelectChange("account", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano de contas" />
              </SelectTrigger>
              <SelectContent>
                {accountPlans.map(plan => (
                  <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_center">Centro de custo</Label>
            <Select value={formData.cost_center || ""} onValueChange={(value) => handleSelectChange("cost_center", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o centro de custo" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map(center => (
                  <SelectItem key={center} value={center}>{center}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Forma de {isIncome ? "recebimento" : "pagamento"}</Label>
            <Select value={formData.payment_method || ""} onValueChange={(value) => handleSelectChange("payment_method", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.id} value={method.name}>{method.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Situação *</Label>
            <Select value={formData.status || "pending"} onValueChange={(value) => handleSelectChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Em Aberto</SelectItem>
                <SelectItem value={isIncome ? "received" : "paid"}>{isIncome ? "Confirmado" : "Pago"}</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_account_id">Conta bancária *</Label>
            <Select value={formData.bank_account_id || ""} onValueChange={(value) => handleSelectChange("bank_account_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_date">Data de compensação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                  disabled={formData.status !== (isIncome ? "received" : "paid")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.paid_date ? format(new Date(formData.paid_date), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.paid_date ? new Date(formData.paid_date) : undefined}
                  onSelect={(date) => handleDateChange("paid_date", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Coluna 2: Valores */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Valores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor bruto *</Label>
            <Input id="amount" type="number" step="0.01" value={formData.amount || "0.00"} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest">Juros</Label>
            <Input id="interest" type="number" step="0.01" value={formData.interest || "0.00"} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Desconto</Label>
            <Input id="discount" type="number" step="0.01" value={formData.discount || "0.00"} onChange={handleChange} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="installment" className="h-4 w-4" />
            <Label htmlFor="installment">Ativar parcelamento/recorrência</Label>
          </div>
          <div className="border-t pt-4">
            <Label className="text-lg font-semibold">Total: R$ {
              (parseFloat(formData.amount || "0") + parseFloat(formData.interest || "0") - parseFloat(formData.discount || "0")).toFixed(2).replace('.', ',')
            }</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOtherInfoTab = () => (
    <div className="grid grid-cols-2 gap-6">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Outras Informações</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entity">{entityLabel}</Label>
            <div className="flex gap-2">
              <Select value={formData.entity || ""} onValueChange={(value) => handleSelectChange("entity", value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={`Selecione o ${entityLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {entityData.map(entity => (
                    <SelectItem key={entity.id} value={entity.name}>{entity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" onClick={() => setQuickAddOpen(isIncome ? "client" : "supplier")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <div className="flex gap-2">
              <Select value={formData.category_id || ""} onValueChange={(value) => handleSelectChange("category_id", value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" onClick={() => setQuickAddOpen("category")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competence_date">Data de competência *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.competence_date ? format(new Date(formData.competence_date), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.competence_date ? new Date(formData.competence_date) : undefined}
                  onSelect={(date) => handleDateChange("competence_date", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="notes">Informações complementares</Label>
            <Textarea id="notes" value={formData.notes || ""} onChange={handleChange} rows={3} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttachmentsTab = () => (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
        Utilize este espaço para anexar comprovantes e documentos. Tamanho máximo 5MB.
      </div>
      <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-md relative">
        <p className="text-muted-foreground">Solte o arquivo aqui para fazer upload...</p>
        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="absolute bottom-4">
          <Button variant="default">Selecionar arquivo</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center">Nenhum anexo cadastrado!</p>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">
        {isNew ? "Adicionar" : "Editar"} {transactionType}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs defaultValue="financial">
          <TabsList>
            <TabsTrigger value="financial">Lançamento Financeiro</TabsTrigger>
            <TabsTrigger value="otherInfo">Outras Informações</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
          </TabsList>
          <TabsContent value="financial" className="mt-4">
            {renderFinancialTab()}
          </TabsContent>
          <TabsContent value="otherInfo" className="mt-4">
            {renderOtherInfoTab()}
          </TabsContent>
          <TabsContent value="attachments" className="mt-4">
            {renderAttachmentsTab()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(type === "income" ? "/receitas" : "/despesas")}>
            Cancelar
          </Button>
          <Button type="submit" variant="default">
            {isNew ? "Salvar Lançamento" : "Atualizar"}
          </Button>
        </div>
      </form>

      <QuickAddDialog
        open={!!quickAddOpen}
        onOpenChange={() => setQuickAddOpen(null)}
        type={quickAddOpen as any}
        onSave={() => {
          // Lógica para recarregar os dados após o QuickAdd
          // Por enquanto, apenas fecha o modal
          setQuickAddOpen(null);
        }}
      />
    </div>
  );
};

export default EditTransactionPage;
