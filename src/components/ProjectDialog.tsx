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
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Switch } from "@/components/ui/switch";
import { QuickClientDialog } from "./QuickClientDialog";
import { QuickPaymentMethodDialog } from "./QuickPaymentMethodDialog";
import { SearchableSelect } from "./SearchableSelect";

const projectSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  code: z.string().optional(),
  description: z.string().optional(),
  client_id: z.string().optional(),
  project_type: z.enum(["fixed_price", "time_material", "retainer", "internal"]).optional(),
  payment_method_id: z.string().optional(),
  budget_amount: z.number().min(0).default(0),
  budget_hours: z.number().min(0).default(0),
  hourly_rate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? null : Number(val)),
    z.number().min(0).nullable().optional()
  ),
  start_date: z.string().optional(),
  expected_end_date: z.string().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
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
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [autoCode, setAutoCode] = useState<boolean>(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { clients, isLoading: loadingClients } = useClients();
  const { paymentMethods, isLoading: loadingPaymentMethods } = usePaymentMethods();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  
  // Buscar dados do cliente selecionado
  const selectedClient = clients?.find(c => c.id === selectedClientId);

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
        payment_method_id: project.payment_method_id || "", // Adicionado para corrigir o bug de persistência
        budget_amount: Number(project.budget_amount) || 0,
        budget_hours: Number(project.budget_hours) || 0,
        hourly_rate: project.hourly_rate ? Number(project.hourly_rate) : undefined,
        start_date: project.start_date || "",
        expected_end_date: project.expected_end_date || "",
        status: project.status,
        priority: project.priority,
      });
      setSelectedType(project.project_type || "fixed_price");
      setSelectedStatus(project.status);
      setSelectedPriority(project.priority);
      setSelectedClientId(project.client_id || "");
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
      setSelectedClientId("");
    }
  }, [project, form]);

  const onSubmit = async (data: ProjectFormData) => {
    const formData = {
      name: data.name || "",
      code: data.code,
      description: data.description,
      client_id: data.client_id,
      budget_amount: data.budget_amount,
      budget_hours: data.budget_hours,
      hourly_rate: data.hourly_rate,
      start_date: data.start_date,
      expected_end_date: data.expected_end_date,
      payment_method_id: data.payment_method_id, // Adicionado para persistência
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
              <div className="flex items-center justify-between">
                <Label htmlFor="code">Código</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Gerar automaticamente</span>
                  <Switch checked={autoCode} onCheckedChange={(v) => {
                    setAutoCode(v);
                    if (v) {
                      const client = clients?.find(c => c.id === form.watch("client_id"));
                      const initials = client?.name
                        ? client.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3)
                        : 'PROJ';
                      const code = `${initials}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
                      form.setValue("code", code);
                    }
                  }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const client = clients?.find(c => c.id === form.watch("client_id"));
                    const initials = client?.name
                      ? client.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3)
                      : 'PROJ';
                    const code = `${initials}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
                    form.setValue("code", code);
                  }}>Gerar Código</Button>
                </div>
              </div>
              <Input
                id="code"
                {...form.register("code")}
                disabled={autoCode}
                placeholder="Ex: PROJ-001"
              />
            </div>

            {/* Cliente */}
            <div>
              <Label htmlFor="client_id">Cliente</Label>
              <SearchableSelect
                options={clients?.map((client) => ({
                  value: client.id,
                  label: client.name,
                })) || []}
                value={form.watch("client_id") || ""}
                onValueChange={(value) => {
                  form.setValue("client_id", value);
                  setSelectedClientId(value);
                  // Auto-preencher código do projeto
                  const client = clients?.find(c => c.id === value);
                  if (client && !project && autoCode) {
                    const initials = client.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3);
                    const code = `${initials}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
                    form.setValue("code", code);
                  }
                }}
                placeholder="Buscar cliente..."
                searchPlaceholder="Digite o nome do cliente..."
                onAddNew={() => setClientDialogOpen(true)}
                addNewLabel="+ Novo Cliente"
              />
              {selectedClient && (
                <p className="text-xs text-muted-foreground mt-1">
                  📧 {selectedClient.email} | 📞 {selectedClient.phone}
                </p>
              )}
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
              <div className="mt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setPaymentDialogOpen(true)}>
                  + Nova Forma de Pagamento
                </Button>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <Label htmlFor="payment_method_id">Forma de Pagamento</Label>
              <Select
                value={form.watch("payment_method_id") || ""}
                onValueChange={(value) => form.setValue("payment_method_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
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

            {/* Forma de Pagamento */}
            <div>
              <Label htmlFor="payment_method_id">Forma de Pagamento</Label>
              <Select
                value={form.watch("payment_method_id")}
                onValueChange={(value) => form.setValue("payment_method_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
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
                onFocus={(e) => {
                  if (e.target.value === '0' || e.target.value === '0.00') {
                    e.target.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    form.setValue('budget_amount', 0);
                  }
                }}
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
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    form.setValue('budget_hours', 0);
                  }
                }}
              />
            </div>

            {/* Taxa Horária */}
            <div>
              <Label htmlFor="hourly_rate" className="flex items-center gap-2">
                Taxa Horária (R$)
                <span className="text-xs text-muted-foreground" title="Valor cobrado por hora trabalhada. Multiplica pelas horas para calcular custo total do projeto.">
                  ℹ️
                </span>
              </Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                {...form.register("hourly_rate", { valueAsNumber: true })}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Usado para calcular custo das horas trabalhadas
              </p>
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
        {/* Dialogs auxiliares */}
        <QuickClientDialog
          open={clientDialogOpen}
          onOpenChange={setClientDialogOpen}
          onSuccess={(id) => {
            form.setValue("client_id", id);
            setSelectedClientId(id);
          }}
        />
        <QuickPaymentMethodDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={(id) => form.setValue("payment_method_id", id)}
        />
      </DialogContent>
    </Dialog>
  );
}
