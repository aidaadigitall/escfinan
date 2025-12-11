import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreditCard } from "@/hooks/useCreditCards";

type CreditCardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CreditCard;
  onSave: (data: any) => void;
};

const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard"];
const OPERATORS = [
  { value: "manual", label: "Manual (sem sincronização)" },
  { value: "nubank", label: "Nubank" },
  { value: "inter", label: "Banco Inter" },
  { value: "c6", label: "C6 Bank" },
  { value: "itau", label: "Itaú" },
  { value: "bradesco", label: "Bradesco" },
];

export const CreditCardDialog = ({ open, onOpenChange, card, onSave }: CreditCardDialogProps) => {
  const [formData, setFormData] = useState({
    card_name: "",
    card_number: "",
    cardholder_name: "",
    card_brand: "",
    credit_limit: "",
    closing_day: "",
    due_day: "",
    operator_integration: "manual",
    operator_card_id: "",
    sync_enabled: false,
  });

  useEffect(() => {
    if (card) {
      setFormData({
        card_name: card.card_name,
        card_number: card.card_number,
        cardholder_name: card.cardholder_name,
        card_brand: card.card_brand,
        credit_limit: card.credit_limit.toString(),
        closing_day: card.closing_day.toString(),
        due_day: card.due_day.toString(),
        operator_integration: card.operator_integration || "manual",
        operator_card_id: card.operator_card_id || "",
        sync_enabled: card.sync_enabled,
      });
    } else {
      setFormData({
        card_name: "",
        card_number: "",
        cardholder_name: "",
        card_brand: "",
        credit_limit: "",
        closing_day: "",
        due_day: "",
        operator_integration: "manual",
        operator_card_id: "",
        sync_enabled: false,
      });
    }
  }, [card, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cardData = {
      ...(card && { id: card.id }),
      card_name: formData.card_name,
      card_number: formData.card_number,
      cardholder_name: formData.cardholder_name,
      card_brand: formData.card_brand,
      credit_limit: parseFloat(formData.credit_limit),
      closing_day: parseInt(formData.closing_day),
      due_day: parseInt(formData.due_day),
      operator_integration: formData.operator_integration === "manual" ? null : formData.operator_integration,
      operator_card_id: formData.operator_card_id || null,
      sync_enabled: formData.sync_enabled,
    };

    onSave(cardData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card ? "Editar Cartão" : "Adicionar Cartão de Crédito"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="card_name">Nome do Cartão *</Label>
            <Input
              id="card_name"
              value={formData.card_name}
              onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
              placeholder="Ex: Cartão Pessoal, Cartão Empresa"
              required
            />
          </div>

          <div className="form-grid-cols-2">
            <div>
              <Label htmlFor="card_number">Últimos 4 Dígitos *</Label>
              <Input
                id="card_number"
                value={formData.card_number}
                onChange={(e) => {
                  // Only allow digits and max 4 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData({ ...formData, card_number: value });
                }}
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                inputMode="numeric"
                required
              />
            </div>

            <div>
              <Label htmlFor="card_brand">Bandeira *</Label>
              <Select
                value={formData.card_brand}
                onValueChange={(value) => setFormData({ ...formData, card_brand: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CARD_BRANDS.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="cardholder_name">Nome do Titular *</Label>
            <Input
              id="cardholder_name"
              value={formData.cardholder_name}
              onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
              placeholder="Nome como aparece no cartão"
              required
            />
          </div>

          <div>
            <Label htmlFor="credit_limit">Limite Total *</Label>
            <Input
              id="credit_limit"
              type="number"
              step="0.01"
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
              placeholder="0,00"
              required
            />
          </div>

          <div className="form-grid-cols-2">
            <div>
              <Label htmlFor="closing_day">Dia de Fechamento *</Label>
              <Input
                id="closing_day"
                type="number"
                min="1"
                max="31"
                value={formData.closing_day}
                onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                placeholder="10"
                required
              />
            </div>

            <div>
              <Label htmlFor="due_day">Dia de Vencimento *</Label>
              <Input
                id="due_day"
                type="number"
                min="1"
                max="31"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                placeholder="20"
                required
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold">Sincronização com Operadora</h3>
            
            <div>
              <Label htmlFor="operator">Operadora</Label>
              <Select
                value={formData.operator_integration}
                onValueChange={(value) => setFormData({ ...formData, operator_integration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.operator_integration !== "manual" && (
              <>
                <div>
                  <Label htmlFor="operator_card_id">ID do Cartão na Operadora</Label>
                  <Input
                    id="operator_card_id"
                    value={formData.operator_card_id}
                    onChange={(e) => setFormData({ ...formData, operator_card_id: e.target.value })}
                    placeholder="ID fornecido pela operadora"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este ID será fornecido após conectar sua conta na operadora
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync_enabled">Sincronização Automática</Label>
                    <p className="text-xs text-muted-foreground">
                      Importar transações automaticamente
                    </p>
                  </div>
                  <Switch
                    id="sync_enabled"
                    checked={formData.sync_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, sync_enabled: checked })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{card ? "Atualizar" : "Adicionar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
