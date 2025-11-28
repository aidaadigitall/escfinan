import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useTransactionStatusHistory } from "@/hooks/useTransactionStatusHistory";

const statusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "overdue", label: "Vencido" },
  { value: "paid", label: "Pago" },
  { value: "received", label: "Recebido" },
];

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  overdue: "Vencido",
  paid: "Pago",
  received: "Recebido",
};

const paymentMethods = [
  "PIX", "Boleto", "Cartão de Crédito", "Transferência", "Dinheiro", "Outro"
];

// Interface Transaction
interface Transaction {
  id: string;
  status: string;
  amount: number;
  description: string;
  due_date: string;
  type: "income" | "expense";
}

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onStatusChange: (transactionId: string, newTransactionData: any) => void;
}

export const ChangeStatusDialog = ({ open, onOpenChange, transaction, onStatusChange }: ChangeStatusDialogProps) => {
  const { accounts: bankAccounts } = useBankAccounts();
  const { history, isLoading: historyLoading } = useTransactionStatusHistory(transaction?.id);
  const [currentStatus, setCurrentStatus] = useState(transaction?.status || "pending");
  const [description, setDescription] = useState(transaction?.description || ""); // Descrição editável
  const [valueReceived, setValueReceived] = useState(transaction?.amount.toString() || "");
  const [compensationDate, setCompensationDate] = useState<Date | undefined>(undefined); // Inicializa como undefined
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [observation, setObservation] = useState("");
  const [complementaryInfo, setComplementaryInfo] = useState("");
  const [file, setFile] = useState<File | null>(null); // Para o anexo

  useEffect(() => {
    if (transaction) {
      setCurrentStatus(transaction.status || "pending");
      setDescription(transaction.description || "");
      setValueReceived(transaction.amount.toString() || "");
      setCompensationDate(new Date());
      setPaymentMethod("");
      setBankAccount("");
      setObservation("");
      setComplementaryInfo("");
    }
  }, [transaction]);

  const handleSubmit = () => {
    // Validate required fields for confirmed/paid/received status
    if (currentStatus === "confirmed" || currentStatus === "paid" || currentStatus === "received") {
      if (!valueReceived || !compensationDate || !paymentMethod || !bankAccount) {
        toast.error("Preencha todos os campos obrigatórios para confirmar a transação.");
        return;
      }
    }

    const newTransactionData: any = {
      id: transaction.id,
      status: currentStatus,
      description: description,
    };

    // Adiciona campos de pagamento apenas se status for confirmado/pago/recebido
    if (currentStatus === "confirmed" || currentStatus === "paid" || currentStatus === "received") {
      newTransactionData.paid_amount = parseFloat(valueReceived) || 0;
      newTransactionData.paid_date = compensationDate ? format(compensationDate, "yyyy-MM-dd") : null;
      newTransactionData.payment_method = paymentMethod;
      newTransactionData.bank_account_id = bankAccount;
    }

    // Adiciona notas se houver
    if (observation || complementaryInfo) {
      newTransactionData.notes = observation || complementaryInfo;
    }

    onStatusChange(transaction.id, newTransactionData);
    onOpenChange(false);
  };

  if (!transaction) return null;

  const isConfirmedOrPaid = currentStatus === "confirmed" || currentStatus === "paid" || currentStatus === "received";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Alterar situação</DialogTitle>
	          <DialogDescription>
	            Transação: {transaction.id}
	          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
	          <div className="grid grid-cols-2 gap-4">
	            <div className="space-y-2">
	              <Label htmlFor="status">Situação*</Label>
	              <Select value={currentStatus} onValueChange={setCurrentStatus}>
	                <SelectTrigger id="status">
	                  <SelectValue placeholder="Selecione" />
	                </SelectTrigger>
	                <SelectContent>
	                  {statusOptions.map(option => (
	                    <SelectItem key={option.value} value={option.value}>
	                      {option.label}
	                    </SelectItem>
	                  ))}
	                </SelectContent>
	              </Select>
	            </div>
	            <div className="space-y-2">
	              <Label htmlFor="description">Descrição</Label>
	              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
	            </div>
	          </div>
	          <div className="space-y-2">
	            <Label htmlFor="observation">Observação</Label>
	            <Input id="observation" value={observation} onChange={(e) => setObservation(e.target.value)} />
	          </div>

          {isConfirmedOrPaid && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valueReceived">Valor {transaction.type === "income" ? "recebido" : "pago"}*</Label>
                  <Input id="valueReceived" type="number" value={valueReceived} onChange={(e) => setValueReceived(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensationDate">Data da compensação*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {compensationDate ? format(compensationDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
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
	                  <div className="flex justify-between items-center">
	                    <Label htmlFor="paymentMethod">Forma de pagamento*</Label>
	                    <Button variant="link" size="sm" onClick={() => window.open("/auxiliares/formas-de-pagamento", "_blank")} className="p-0 h-auto text-xs">
	                      + Criar
	                    </Button>
	                  </div>
	                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
	                    <SelectTrigger id="paymentMethod">
	                      <SelectValue placeholder="Selecione" />
	                    </SelectTrigger>
	                    <SelectContent>
	                      {paymentMethods.map(method => (
	                        <SelectItem key={method} value={method}>
	                          {method}
	                        </SelectItem>
	                      ))}
	                    </SelectContent>
	                  </Select>
	                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Conta bancária*</Label>
                  <Select value={bankAccount} onValueChange={setBankAccount}>
                    <SelectTrigger id="bankAccount">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complementaryInfo">Informações complementares</Label>
                <Input id="complementaryInfo" value={complementaryInfo} onChange={(e) => setComplementaryInfo(e.target.value)} />
              </div>
            </>
          )}

	          {/* Seção de Anexos (Simulação) */}
	          <div className="space-y-2 border-t pt-4">
	            <h3 className="text-lg font-semibold">Anexos</h3>
	            <p className="text-sm text-muted-foreground">Utilize este espaço para anexar comprovantes e documentos. Tamanho máximo 5MB.</p>
	            <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md relative">
	              <input 
	                type="file" 
	                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
	                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
	              />
	              <Button variant="outline" disabled={!!file}>
	                {file ? `Arquivo selecionado: ${file.name}` : "Selecionar arquivo"}
	              </Button>
	              {file && (
	                <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="ml-2">
	                  <X className="h-4 w-4" />
	                </Button>
	              )}
	            </div>
	          </div>

	          {/* Histórico de Situações Real */}
	          <div className="space-y-2 border-t pt-4">
	            <h3 className="text-lg font-semibold">Histórico de situações</h3>
	            {historyLoading ? (
	              <div className="text-sm text-muted-foreground">Carregando histórico...</div>
	            ) : history.length > 0 ? (
	              <div className="border rounded-md">
	                <table className="w-full text-sm">
	                  <thead>
	                    <tr className="bg-muted/50">
	                      <th className="p-2 text-left">Data</th>
	                      <th className="p-2 text-left">Observação</th>
	                      <th className="p-2 text-left">Status Anterior</th>
	                      <th className="p-2 text-left">Novo Status</th>
	                    </tr>
	                  </thead>
	                  <tbody>
	                    {history.map((entry) => (
	                      <tr key={entry.id} className="border-t">
	                        <td className="p-2">
	                          {new Date(entry.created_at).toLocaleString('pt-BR', {
	                            day: '2-digit',
	                            month: '2-digit',
	                            year: 'numeric',
	                            hour: '2-digit',
	                            minute: '2-digit'
	                          })}
	                        </td>
	                        <td className="p-2">{entry.observation || "-"}</td>
	                        <td className="p-2">
	                          {entry.old_status ? (
	                            <Badge variant="outline">{statusLabels[entry.old_status] || entry.old_status}</Badge>
	                          ) : (
	                            "-"
	                          )}
	                        </td>
	                        <td className="p-2">
	                          <Badge variant="default">{statusLabels[entry.new_status] || entry.new_status}</Badge>
	                        </td>
	                      </tr>
	                    ))}
	                  </tbody>
	                </table>
	              </div>
	            ) : (
	              <div className="text-sm text-muted-foreground">Nenhuma mudança de status registrada.</div>
	            )}
	          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Confirmar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
