import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProject, useUpdateProject, type Project } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";

const projectSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  code: z.string().optional(),
  description: z.string().optional(),
  client_id: z.string().optional(),
  project_type: z.enum(["fixed_price", "time_material", "retainer", "internal"]).optional(),
  budget_amount: z.number().min(0).default(0),
  budget_hours: z.number().min(0).default(0),
  hourly_rate: z.number().min(0).optional(),
  start_date: z.string().optional(),
  expected_end_date: z.string().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  project_manager_id: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const [selectedType, setSelectedType] = useState<string>(project?.project_type || "fixed_price");
  const [selectedStatus, setSelectedStatus] = useState<string>(project?.status || "planning");
  const [selectedPriority, setSelectedPriority] = useState<string>(project?.priority || "medium");

  const { data: clients } = useClients();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      budget_amount: 0,
      budget_hours: 0,
      status: "planning",
      priority: "medium",
      project_type: "fixed_price",
    },
  });

  // Preencher form quando editar
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        code: project.code || "",
        description: project.description || "",
        client_id: project.client_id || "",
        project_type: project.project_type || "fixed_price",
        budget_amount: Number(project.budget_amount) || 0,
        budget_hours: Number(project.budget_hours) || 0,
        hourly_rate: project.hourly_rate ? Number(project.hourly_rate) : undefined,
        start_date: project.start_date || "",
        expected_end_date: project.expected_end_date || "",
        status: project.status,
        priority: project.priority,
        project_manager_id: project.project_manager_id || "",
      });
      setSelectedType(project.project_type || "fixed_price");
      setSelectedStatus(project.status);
      setSelectedPriority(project.priority);
    } else {
      form.reset({
        name: "",
        code: "",
        description: "",
        budget_amount: 0,
        budget_hours: 0,
        status: "planning",
        priority: "medium",
        project_type: "fixed_price",
      });
      setSelectedType("fixed_price");
      setSelectedStatus("planning");
      setSelectedPriority("medium");
    }
  }, [project, form]);

  const onSubmit = async (data: ProjectFormData) => {
    const formData = {
      ...data,
      project_type: selectedType as any,
      status: selectedStatus as any,
      priority: selectedPriority as any,
    };

    if (project) {
      await updateProject.mutateAsync({ ...formData, id: project.id });
    } else {
      await createProject.mutateAsync(formData);
    }

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Nome */}
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Ex: Desenvolvimento de Website"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Código */}
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="Ex: PROJ-001"
              />
            </div>

            {/* Cliente */}
            <div>
              <Label htmlFor="client_id">Cliente</Label>
              <Select
                value={form.watch("client_id")}
                onValueChange={(value) => form.setValue("client_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Projeto */}
            <div>
              <Label htmlFor="project_type">Tipo de Projeto</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_price">Preço Fixo</SelectItem>
                  <SelectItem value="time_material">Tempo & Material</SelectItem>
                  <SelectItem value="retainer">Retenção</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="on_hold">Em Espera</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orçamento */}
            <div>
              <Label htmlFor="budget_amount">Orçamento (R$)</Label>
              <Input
                id="budget_amount"
                type="number"
                step="0.01"
                {...form.register("budget_amount", { valueAsNumber: true })}
                placeholder="0,00"
              />
            </div>

            {/* Horas Orçadas */}
            <div>
              <Label htmlFor="budget_hours">Horas Orçadas</Label>
              <Input
                id="budget_hours"
                type="number"
                step="0.5"
                {...form.register("budget_hours", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            {/* Taxa Horária */}
            <div>
              <Label htmlFor="hourly_rate">Taxa Horária (R$)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                {...form.register("hourly_rate", { valueAsNumber: true })}
                placeholder="0,00"
              />
            </div>

            {/* Data Início */}
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date")}
              />
            </div>

            {/* Data Prevista Fim */}
            <div>
              <Label htmlFor="expected_end_date">Data Prevista Fim</Label>
              <Input
                id="expected_end_date"
                type="date"
                {...form.register("expected_end_date")}
              />
            </div>

            {/* Descrição */}
            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Descreva o projeto..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending || updateProject.isPending}
            >
              {project ? "Atualizar" : "Criar"} Projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
