import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads, Lead, LeadFormData } from "@/hooks/useLeads";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useLeadSources } from "@/hooks/useLeadSources";
import { QuickLeadSourceDialog } from "./QuickLeadSourceDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

// Validação de telefone brasileiro (aceita vários formatos)
const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}$/;

// Validação de email mais robusta
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const leadSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string()
    .refine((val) => !val || emailRegex.test(val), {
      message: "Email inválido. Ex: nome@email.com",
    })
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .refine((val) => !val || phoneRegex.test(val.replace(/\s/g, "")), {
      message: "Telefone inválido. Ex: (11) 99999-9999",
    })
    .optional()
    .or(z.literal("")),
  company: z.string().max(100, "Nome da empresa muito longo").optional(),
  position: z.string().max(50, "Cargo muito longo").optional(),
  source: z.string().optional(),
  source_details: z.string().max(200, "Detalhes muito longos").optional(),
  pipeline_stage_id: z.string().optional(),
  expected_value: z.number().min(0, "Valor não pode ser negativo").optional(),
  probability: z.number().min(0, "Mínimo 0%").max(100, "Máximo 100%").optional(),
  expected_close_date: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().max(1000, "Observações muito longas").optional(),
});

// Função para formatar telefone enquanto digita
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
}

export const LeadDialog = ({ open, onOpenChange, lead }: LeadDialogProps) => {
  const { createLead, updateLead } = useLeads();
  const { stages } = usePipelineStages();
  const { sources } = useLeadSources();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSourceDialogOpen, setLeadSourceDialogOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: "manual",
    },
  });

  // Reset do formulário quando o lead muda ou dialog abre
  useEffect(() => {
    if (open) {
      if (lead) {
        reset({
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          position: lead.position || "",
          source: lead.source || "manual",
          source_details: lead.source_details || "",
          pipeline_stage_id: lead.pipeline_stage_id || "",
          expected_value: lead.expected_value || undefined,
          probability: lead.probability || undefined,
          expected_close_date: lead.expected_close_date ? format(new Date(lead.expected_close_date), "yyyy-MM-dd") : "",
          notes: lead.notes || "",
        });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          company: "",
          position: "",
          source: "manual",
          source_details: "",
          pipeline_stage_id: "",
          expected_value: undefined,
          probability: undefined,
          expected_close_date: "",
          notes: "",
        });
      }
    }
  }, [lead, open, reset]);

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      // Tratar NaN nos valores numéricos
      const expectedValue = data.expected_value ? Number(data.expected_value) : undefined;
      const probability = data.probability ? Number(data.probability) : undefined;
      
      const formattedData = {
        ...data,
        email: data.email || undefined,
        expected_value: expectedValue && !isNaN(expectedValue) ? expectedValue : undefined,
        probability: probability && !isNaN(probability) ? probability : undefined,
        pipeline_stage_id: data.pipeline_stage_id || undefined,
        expected_close_date: data.expected_close_date || undefined,
      };

      if (lead) {
        await updateLead.mutateAsync({ id: lead.id, data: formattedData });
      } else {
        await createLead.mutateAsync(formattedData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nome completo"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(11) 99999-9999"
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setValue("phone", formatted);
                }}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="Nome da empresa"
              />
              {errors.company && (
                <p className="text-sm text-red-500">{errors.company.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                {...register("position")}
                placeholder="ex: Gerente"
              />
              {errors.position && (
                <p className="text-sm text-red-500">{errors.position.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Select
                value={watch("source")}
                onValueChange={(value) => setValue("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {/* opções do sistema */}
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="indication">Indicação</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="social_media">Redes Sociais</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  {/* origens personalizadas da base */}
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLeadSourceDialogOpen(true)}>
                + Gerenciar origens
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pipeline_stage_id">Estágio do Funil</Label>
            <Select
              value={watch("pipeline_stage_id")}
              onValueChange={(value) => setValue("pipeline_stage_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um estágio" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_value">Valor Esperado (R$)</Label>
              <Input
                id="expected_value"
                type="number"
                step="0.01"
                {...register("expected_value", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidade (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                {...register("probability", { valueAsNumber: true })}
                placeholder="0-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Previsão de Fechamento</Label>
              <Input
                id="expected_close_date"
                type="date"
                {...register("expected_close_date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Anotações sobre o lead..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : lead ? "Atualizar" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </form>
        <QuickLeadSourceDialog
          open={leadSourceDialogOpen}
          onOpenChange={setLeadSourceDialogOpen}
          onSuccess={(name) => setValue("source", name)}
        />
      </DialogContent>
    </Dialog>
  );
};
