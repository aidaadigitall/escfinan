import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCategories } from "@/hooks/useCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useClients } from "@/hooks/useClients";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { QuickCategoryDialog } from "./QuickCategoryDialog";
import { QuickPaymentMethodDialog } from "./QuickPaymentMethodDialog";

interface TransactionFormTabsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  transaction?: any;
  onSave: (data: any) => Promise<void>;
}

export const TransactionFormTabs = ({ 
  open, 
  onOpenChange, 
  type, 
  transaction,
  onSave 
}: TransactionFormTabsProps) => {
  const [activeTab, setActiveTab] = useState("financial");
  const [file, setFile] = useState<File | null>(null);
  
  // Quick add dialogs
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);

  // Form data - Lançamento Financeiro
  const [description, setDescription] = useState("");
  const [chartAccountId, setChartAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [situation, setSituation] = useState("pending");
  const [dueDate, setDueDate] = useState<Date>();
  const [bankAccountId, setBankAccountId] = useState("");
  const [compensationDate, setCompensationDate] = useState<Date>();
  
  // Valores
  const [grossAmount, setGrossAmount] = useState("");
  const [interest, setInterest] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [enableInstallments, setEnableInstallments] = useState(false);
  const [installmentType, setInstallmentType] = useState("divide");
  const [recurrence, setRecurrence] = useState("monthly");
  const [installmentQty, setInstallmentQty] = useState("1");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<Date>();

  // Outras Informações
  const [entity, setEntity] = useState("");
  const [client, setClient] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const { categories } = useCategories(type);
  const { paymentMethods } = usePaymentMethods();
  const { accounts: bankAccounts } = useBankAccounts();
  const { clients } = useClients();
  const { suppliers } = useSuppliers();
  const { accounts: chartAccounts } = useChartOfAccounts();

  const calculateTotal = () => {
    const gross = parseFloat(grossAmount) || 0;
    const int = parseFloat(interest) || 0;
    const disc = parseFloat(discount) || 0;
    return gross + int - disc;
  };

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || "");
      setChartAccountId(transaction.category_id || "");
      setPaymentMethod(transaction.payment_method || "");
      setSituation(transaction.status || "pending");
      setDueDate(transaction.due_date ? new Date(transaction.due_date) : undefined);
      setBankAccountId(transaction.bank_account_id || "");
      setCompensationDate(transaction.paid_date ? new Date(transaction.paid_date) : undefined);
      setGrossAmount(transaction.amount?.toString() || "");
      setEntity(transaction.entity || "");
      setClient(transaction.client || "");
      setAdditionalInfo(transaction.notes || "");
    } else {
      // Reset form
      setDescription("");
      setChartAccountId("");
      setPaymentMethod("");
      setSituation("pending");
      setDueDate(undefined);
      setBankAccountId("");
      setCompensationDate(undefined);
      setGrossAmount("");
      setInterest("0");
      setDiscount("0");
      setEnableInstallments(false);
      setInstallmentQty("1");
      setFirstInstallmentDate(undefined);
      setEntity("");
      setClient("");
      setAdditionalInfo("");
      setFile(null);
    }
  }, [transaction, open]);

  const handleSubmit = async () => {
    if (!description || !grossAmount || !dueDate) {
      return;
    }

    const total = calculateTotal();
    
    if (enableInstallments && parseInt(installmentQty) > 1) {
      // Create multiple transactions for installments
      const qty = parseInt(installmentQty);
      const baseDate = firstInstallmentDate || dueDate;
      
      for (let i = 0; i < qty; i++) {
        const installmentDate = new Date(baseDate);
        
        if (recurrence === "monthly") {
          installmentDate.setMonth(installmentDate.getMonth() + i);
        } else if (recurrence === "weekly") {
          installmentDate.setDate(installmentDate.getDate() + (i * 7));
        }

        const installmentAmount = installmentType === "divide" ? total / qty : total;

        await onSave({
          description: `${description} (${i + 1}/${qty})`,
          amount: installmentAmount,
          type,
          category_id: chartAccountId || null,
          payment_method: paymentMethod || null,
          status: situation,
          due_date: format(installmentDate, "yyyy-MM-dd"),
          bank_account_id: bankAccountId || null,
          paid_date: compensationDate ? format(compensationDate, "yyyy-MM-dd") : null,
          paid_amount: situation === "confirmed" || situation === "paid" || situation === "received" ? installmentAmount : null,
          entity: entity || null,
          client: client || null,
          notes: additionalInfo || null,
        });
      }
    } else {
      // Single transaction
      await onSave({
        description,
        amount: total,
        type,
        category_id: chartAccountId || null,
        payment_method: paymentMethod || null,
        status: situation,
        due_date: format(dueDate, "yyyy-MM-dd"),
        bank_account_id: bankAccountId || null,
        paid_date: compensationDate ? format(compensationDate, "yyyy-MM-dd") : null,
        paid_amount: situation === "confirmed" || situation === "paid" || situation === "received" ? total : null,
        entity: entity || null,
        client: client || null,
        notes: additionalInfo || null,
      });
    }

    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {transaction ? "Editar" : "Adicionar"} {type === "income" ? "Receita" : "Despesa"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="financial">Lançamento financeiro</TabsTrigger>
              <TabsTrigger value="other">Outras informações</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto py-4">
              <TabsContent value="financial" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="description">Descrição do {type === "income" ? "recebimento" : "pagamento"} *</Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Digite a descrição"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Plano de contas *</Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setShowCategoryDialog(true)}
                        >
                          + Criar
                        </Button>
                      </div>
                      <Select value={chartAccountId} onValueChange={setChartAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano de contas" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Forma de pagamento *</Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setShowPaymentMethodDialog(true)}
                        >
                          + Criar
                        </Button>
                      </div>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((pm) => (
                            <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Situação *</Label>
                      <Select value={situation} onValueChange={setSituation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="received">Recebido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Vencimento *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dueDate}
                            onSelect={setDueDate}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Conta bancária *</Label>
                      <Select value={bankAccountId} onValueChange={setBankAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta bancária" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Data de compensação</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {compensationDate ? format(compensationDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={compensationDate}
                            onSelect={setCompensationDate}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">Valores</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Valor bruto *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={grossAmount}
                          onChange={(e) => setGrossAmount(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Juros</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={interest}
                          onChange={(e) => setInterest(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Desconto</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total:</span>
                        <span className="text-2xl font-bold">R$ {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="installments"
                          checked={enableInstallments}
                          onCheckedChange={setEnableInstallments}
                        />
                        <Label htmlFor="installments">Ativar parcelamento/recorrência</Label>
                      </div>

                      {enableInstallments && (
                        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                          <div className="space-y-2">
                            <Label>Tipo de parcela *</Label>
                            <Select value={installmentType} onValueChange={setInstallmentType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="divide">Dividir o valor do lançamento...</SelectItem>
                                <SelectItem value="repeat">Repetir o valor do lançamento...</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Repetição *</Label>
                            <Select value={recurrence} onValueChange={setRecurrence}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Quantidade *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={installmentQty}
                              onChange={(e) => setInstallmentQty(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Data 1ª parcela *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {firstInstallmentDate ? format(firstInstallmentDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={firstInstallmentDate}
                                  onSelect={setFirstInstallmentDate}
                                  initialFocus
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">
                              Total: R$ {(calculateTotal() * (installmentType === "repeat" ? parseInt(installmentQty) : 1)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="other" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Entidade</Label>
                    <Select value={entity} onValueChange={setEntity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={client} onValueChange={setClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((cli) => (
                          <SelectItem key={cli.id} value={cli.id}>{cli.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de competência</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {compensationDate ? format(compensationDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={compensationDate}
                          onSelect={setCompensationDate}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Informações complementares</Label>
                    <Textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Digite informações adicionais..."
                      rows={5}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted rounded-full">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Solte o arquivo aqui para fazer upload
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">ou</p>
                        <div className="relative">
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                          />
                          <Button variant="outline" className="relative">
                            Selecionar arquivo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {file && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Atenção:</strong> Utilize este espaço para anexar comprovantes e documentos. Tamanho máximo 5MB por arquivo.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-between border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => {
              if (activeTab === "financial") {
                onOpenChange(false);
              } else if (activeTab === "other") {
                setActiveTab("financial");
              } else {
                setActiveTab("other");
              }
            }}>
              Voltar
            </Button>
            
            <div className="flex gap-2">
              {activeTab !== "attachments" && (
                <Button
                  variant="default"
                  onClick={() => {
                    if (activeTab === "financial") {
                      setActiveTab("other");
                    } else {
                      setActiveTab("attachments");
                    }
                  }}
                >
                  Continuar
                </Button>
              )}
              
              <Button variant="default" onClick={handleSubmit}>
                Atualizar
              </Button>
              
              <Button variant="destructive" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuickCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        type={type}
      />
      <QuickPaymentMethodDialog
        open={showPaymentMethodDialog}
        onOpenChange={setShowPaymentMethodDialog}
      />
    </>
  );
};