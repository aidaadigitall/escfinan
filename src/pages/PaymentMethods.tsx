import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Percent, DollarSign } from "lucide-react";
import { usePaymentMethods, PaymentMethod } from "@/hooks/usePaymentMethods";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const PaymentMethods = () => {
  const { paymentMethods, isLoading, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } = usePaymentMethods();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToEdit, setMethodToEdit] = useState<PaymentMethod | undefined>(undefined);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    fee_percentage: 0,
    fee_type: "percentage" as "percentage" | "fixed",
  });

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setMethodToEdit(method);
      setFormData({
        name: method.name,
        fee_percentage: method.fee_percentage || 0,
        fee_type: method.fee_type || "percentage",
      });
    } else {
      setMethodToEdit(undefined);
      setFormData({
        name: "",
        fee_percentage: 0,
        fee_type: "percentage",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (methodToEdit) {
      updatePaymentMethod({ id: methodToEdit.id, ...formData });
    } else {
      createPaymentMethod(formData);
    }
    setDialogOpen(false);
    setFormData({ name: "", fee_percentage: 0, fee_type: "percentage" });
    setMethodToEdit(undefined);
  };

  const handleDelete = (id: string) => {
    setMethodToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (methodToDelete) {
      deletePaymentMethod(methodToDelete);
    }
    setDeleteDialogOpen(false);
    setMethodToDelete(null);
  };

  const formatFee = (method: PaymentMethod) => {
    if (!method.fee_percentage || method.fee_percentage === 0) {
      return <span className="text-muted-foreground">Sem taxa</span>;
    }
    
    if (method.fee_type === "fixed") {
      return (
        <Badge variant="secondary" className="gap-1">
          R$ {method.fee_percentage.toFixed(2)}
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        <Percent className="h-3 w-3" />
        {method.fee_percentage.toFixed(2)}%
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Formas de Pagamento</CardTitle>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhuma forma de pagamento cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell className="text-center">
                      {formatFee(method)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(method)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{methodToEdit ? "Editar" : "Adicionar"} Forma de Pagamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão de Crédito"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee_percentage">Taxa da Operadora</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    id="fee_percentage" 
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.fee_type === "percentage" ? 100 : undefined}
                    value={formData.fee_percentage} 
                    onChange={(e) => setFormData({ ...formData, fee_percentage: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.fee_type === "percentage" ? "Ex: 2.50" : "Ex: 5.00"}
                  />
                </div>
                <ToggleGroup 
                  type="single" 
                  value={formData.fee_type}
                  onValueChange={(value) => {
                    if (value) setFormData({ ...formData, fee_type: value as "percentage" | "fixed" });
                  }}
                  className="border rounded-md"
                >
                  <ToggleGroupItem value="percentage" aria-label="Porcentagem" className="px-3">
                    <Percent className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="fixed" aria-label="Valor fixo" className="px-3">
                    <span className="text-sm font-medium">R$</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.fee_type === "percentage" 
                  ? "Taxa percentual cobrada pela operadora que será deduzida do valor recebido"
                  : "Valor fixo em reais cobrado pela operadora que será deduzido do valor recebido"
                }
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta forma de pagamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentMethods;
