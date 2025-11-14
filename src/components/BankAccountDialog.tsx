import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BankAccount } from "@/hooks/useBankAccounts";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount | null;
  onSave: (data: any) => void;
}

export const BankAccountDialog = ({
  open,
  onOpenChange,
  account,
  onSave,
}: BankAccountDialogProps) => {
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (account) {
      setValue("name", account.name);
      setValue("initial_balance", account.initial_balance);
      setValue("current_balance", account.current_balance);
      if (account.balance_date) {
        setValue("balance_date", account.balance_date);
      }
    } else {
      reset();
      setValue("balance_date", format(new Date(), "yyyy-MM-dd"));
    }
  }, [account, setValue, reset]);

  const onSubmit = (data: any) => {
    onSave(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {account ? "Editar Conta Bancária" : "Adicionar Conta Bancária"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="Ex: Banco do Brasil"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initial_balance">Saldo Inicial</Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                {...register("initial_balance")}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="balance_date">Data do Saldo</Label>
              <Input
                id="balance_date"
                type="date"
                {...register("balance_date")}
              />
            </div>
          </div>
          {account && (
            <div>
              <Label htmlFor="current_balance">Saldo Atual (Ajuste Manual)</Label>
              <Input
                id="current_balance"
                type="number"
                step="0.01"
                {...register("current_balance")}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use este campo apenas para ajustar o saldo manualmente quando necessário
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">{account ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
