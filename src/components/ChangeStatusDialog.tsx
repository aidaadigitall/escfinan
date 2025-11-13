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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Assumindo uma interface Transaction simplificada
interface Transaction {
  id: string;
  status: string;
  amount: number;
  description: string;
  due_date: string;
  type: "income" | "expense";
  // Adicione outros campos necessários para o formulário
}

const statusOptions = [
  { value: "em_aberto", label: "Em aberto" },
  { value: "confirmado", label: "Confirmado" },
  { value: "permuta", label: "Permuta" },
  { value: "em_protesto", label: "Em protesto" },
  { value: "negociado", label: "Negociado" },
  { value: "inadimplencia_irrecuperavel", label: "Inadimplência irrecuperável" },
  { value: "pago", label: "Pago" }, // Para despesas
  { value: "recebido", label: "Recebido" }, // Para receitas
];

const paymentMethods = [
  "PIX", "Boleto", "Cartão de Crédito", "Transferência", "Dinheiro", "Outro"
];

const bankAccounts = [
  "Cora", "Banco do Brasil", "Itaú", "Santander", "Caixa"
];

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onStatusChange: (transactionId: string, newTransactionData: any) => void;
}

export const ChangeStatusDialog = ({ open, onOpenChange, transaction, onStatusChange }: ChangeStatusDialogProps) => {
  const [currentStatus, setCurrentStatus] = useState(transaction?.status || "em_aberto");
  const [valueReceived, setValueReceived] = useState(transaction?.amount.toString() || "");
  const [compensationDate, setCompensationDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [observation, setObservation] = useState("");
  const [complementaryInfo, setComplementaryInfo] = useState("");

  useEffect(() => {
    if (transaction) {
      // Mapeia o status interno para o label do formulário
      const initialStatus = transaction.status === "paid" ? "pago" : transaction.status === "received" ? "recebido" : transaction.status;
      setCurrentStatus(initialStatus || "em_aberto");
      setValueReceived(transaction.amount.toString() || "");
      // Outros campos devem ser carregados se existirem na transação
    }
  }, [transaction]);

  const handleSubmit = () => {
    if (currentStatus === "confirmado" || currentStatus === "pago" || currentStatus === "recebido") {
      if (!valueReceived || !compensationDate || !paymentMethod || !bankAccount) {
        toast.error("Preencha todos os campos obrigatórios para confirmar a transação.");
        return;
      }
    }

    const newTransactionData = {
      status: currentStatus,
      value_received: parseFloat(valueReceived),
      compensation_date: compensationDate ? format(compensationDate, "yyyy-MM-dd") : null,
      payment_method: paymentMethod,
      bank_account_id: bankAccount,
      observation: observation,
      complementary_info: complementaryInfo,
    };

    onStatusChange(transaction.id, newTransactionData);
    onOpenChange(false);
  };

  if (!transaction) return null;

  const isConfirmedOrPaid = currentStatus === "confirmado" || currentStatus === "pago" || currentStatus === "recebido";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Alterar situação</DialogTitle>
          <DialogDescription>
            Transação: {transaction.description} ({transaction.id})
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
              <Label htmlFor="observation">Observação</Label>
              <Input id="observation" value={observation} onChange={(e) => setObservation(e.target.value)} />
            </div>
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
                  <Label htmlFor="paymentMethod">Forma de pagamento*</Label>
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
                        <SelectItem key={account} value={account}>
                          {account}
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
            <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md">
              <Button variant="outline">Selecionar arquivo</Button>
            </div>
          </div>

          {/* Histórico de Situações (Simulação) */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-semibold">Histórico de situações</h3>
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Observação</th>
                    <th className="p-2 text-left">Situação</th>
                    <th className="p-2 text-left">Funcionário</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Dados de exemplo */}
                  <tr className="border-t">
                    <td className="p-2">01/11/2025 11:05:17</td>
                    <td className="p-2"></td>
                    <td className="p-2"><Badge variant="success">Confirmado</Badge></td>
                    <td className="p-2">Elton Santos</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">31/10/2025 10:12:12</td>
                    <td className="p-2"></td>
                    <td className="p-2"><Badge variant="warning">Em aberto</Badge></td>
                    <td className="p-2">Elton Santos</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
