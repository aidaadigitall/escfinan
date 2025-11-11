import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCostCenters } from "@/hooks/useCostCenters";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

interface RecurringBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: any;
}

export const RecurringBillDialog = ({ open, onOpenChange, bill }: RecurringBillDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    description: "",
    type: "expense",
    recurrence_type: "monthly",
    amount: "",
    start_date: "",
    end_date: "",
    recurrence_day: "",
    category_id: "",
    bank_account_id: "",
    cost_center_id: "",
    payment_method_id: "",
    notes: "",
  });

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCostCenter, setShowNewCostCenter] = useState(false);
  const [newCostCenterName, setNewCostCenterName] = useState("");
  const [showNewPaymentMethod, setShowNewPaymentMethod] = useState(false);
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("");

  const { categories, isLoading: categoriesLoading, createCategory } = useCategories(formData.type as "income" | "expense");
  const { costCenters, isLoading: costCentersLoading, createCostCenter } = useCostCenters();
  const { paymentMethods, isLoading: paymentMethodsLoading, createPaymentMethod } = usePaymentMethods();

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Digite um nome para a categoria");
      return;
    }
    createCategory({ name: newCategoryName, type: formData.type as "income" | "expense" });
    setNewCategoryName("");
    setShowNewCategory(false);
  };

  const handleCreateCostCenter = () => {
    if (!newCostCenterName.trim()) {
      toast.error("Digite um nome para o centro de custo");
      return;
    }
    createCostCenter({ name: newCostCenterName, is_active: true });
    setNewCostCenterName("");
    setShowNewCostCenter(false);
  };

  const handleCreatePaymentMethod = () => {
    if (!newPaymentMethodName.trim()) {
      toast.error("Digite um nome para a forma de pagamento");
      return;
    }
    createPaymentMethod(newPaymentMethodName);
    setNewPaymentMethodName("");
    setShowNewPaymentMethod(false);
  };

  useEffect(() => {
    if (bill) {
      setFormData({
        description: bill.description || "",
        type: bill.type || "expense",
        recurrence_type: bill.recurrence_type || "monthly",
        amount: bill.amount?.toString() || "",
        start_date: bill.start_date || "",
        end_date: bill.end_date || "",
        recurrence_day: bill.recurrence_day?.toString() || "",
        category_id: bill.category_id || "",
        bank_account_id: bill.bank_account_id || "",
        cost_center_id: bill.cost_center_id || "",
        payment_method_id: bill.payment_method_id || "",
        notes: bill.notes || "",
      });
    } else {
      setFormData({
        description: "",
        type: "expense",
        recurrence_type: "monthly",
        amount: "",
        start_date: "",
        end_date: "",
        recurrence_day: "",
        category_id: "",
        bank_account_id: "",
        cost_center_id: "",
        payment_method_id: "",
        notes: "",
      });
    }
  }, [bill, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payload = {
        description: data.description,
        type: data.type,
        recurrence_type: data.recurrence_type,
        amount: parseFloat(data.amount),
        start_date: data.start_date,
        recurrence_day: data.recurrence_day ? parseInt(data.recurrence_day) : null,
        category_id: data.category_id || null,
        bank_account_id: data.bank_account_id || null,
        cost_center_id: data.cost_center_id || null,
        payment_method_id: data.payment_method_id || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
        user_id: user.id,
      };

      if (bill) {
        const { error } = await supabase
          .from("recurring_bills")
          .update(payload)
          .eq("id", bill.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("recurring_bills")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
      toast.success(bill ? "Conta fixa atualizada!" : "Conta fixa criada!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar conta fixa");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bill ? "Editar" : "Adicionar"} Conta Fixa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recurrence_type">Recorrência *</Label>
              <Select value={formData.recurrence_type} onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="recurrence_day">Dia da Recorrência</Label>
              <Input
                id="recurrence_day"
                type="number"
                min="1"
                max="31"
                value={formData.recurrence_day}
                onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
                placeholder="1-31"
              />
            </div>

            <div>
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category_id">Categoria</Label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCategory(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova categoria"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateCategory())}
                  />
                  <Button type="button" onClick={handleCreateCategory}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewCategory(false)}>Cancelar</Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="bank_account_id">Conta Bancária</Label>
              <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cost_center_id">Centro de Custo</Label>
              {!showNewCostCenter ? (
                <div className="flex gap-2">
                  <Select value={formData.cost_center_id} onValueChange={(value) => setFormData({ ...formData, cost_center_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((cc: any) => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCostCenter(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Novo centro de custo"
                    value={newCostCenterName}
                    onChange={(e) => setNewCostCenterName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateCostCenter())}
                  />
                  <Button type="button" onClick={handleCreateCostCenter}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewCostCenter(false)}>Cancelar</Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="payment_method_id">Forma de Pagamento</Label>
              {!showNewPaymentMethod ? (
                <div className="flex gap-2">
                  <Select value={formData.payment_method_id} onValueChange={(value) => setFormData({ ...formData, payment_method_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm: any) => (
                        <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewPaymentMethod(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova forma de pagamento"
                    value={newPaymentMethodName}
                    onChange={(e) => setNewPaymentMethodName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreatePaymentMethod())}
                  />
                  <Button type="button" onClick={handleCreatePaymentMethod}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewPaymentMethod(false)}>Cancelar</Button>
                </div>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
