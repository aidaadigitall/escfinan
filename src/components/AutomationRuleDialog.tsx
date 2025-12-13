import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLeadAutomations, AutomationRuleFormData } from "@/hooks/useLeadAutomations";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const automationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  trigger_type: z.enum(['stage_change', 'time_in_stage', 'score_change', 'new_lead', 'activity_created', 'no_activity', 'lead_lost', 'sla_breach']),
  trigger_config: z.any().optional(),
  conditions: z.any().optional(),
  actions: z.array(z.any()).min(1, "Adicione pelo menos uma ação"),
  max_executions: z.number().optional(),
  cooldown_hours: z.number().optional(),
  priority: z.number().optional(),
});

interface AutomationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: any;
}

export const AutomationRuleDialog = ({ open, onOpenChange, rule }: AutomationRuleDialogProps) => {
  const { createRule, updateRule } = useLeadAutomations();
  const { stages } = usePipelineStages();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actions, setActions] = useState<any[]>(rule?.actions || []);
  const [triggerConfig, setTriggerConfig] = useState<any>(rule?.trigger_config || {});

  const { register, handleSubmit, formState: { errors }, control, watch } = useForm<AutomationRuleFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: rule || {
      is_active: true,
      trigger_type: 'stage_change',
      actions: [],
      priority: 0,
    },
  });

  const triggerType = watch('trigger_type');

  const onSubmit = async (data: AutomationRuleFormData) => {
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        actions,
        trigger_config: triggerConfig,
      };

      if (rule) {
        await updateRule.mutateAsync({ id: rule.id, data: formattedData });
      } else {
        await createRule.mutateAsync(formattedData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar automação:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAction = () => {
    setActions([...actions, { type: 'change_stage', config: {} }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    if (field === 'type') {
      newActions[index] = { type: value, config: {} };
    } else {
      newActions[index] = { ...newActions[index], [field]: value };
    }
    setActions(newActions);
  };

  const updateActionConfig = (index: number, partialConfig: Record<string, any>) => {
    const newActions = [...actions];
    const currentConfig = newActions[index]?.config || {};
    newActions[index] = {
      ...newActions[index],
      config: {
        ...currentConfig,
        ...partialConfig,
      },
    };
    setActions(newActions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Editar Automação" : "Nova Automação"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Automação *</Label>
              <Input
                id="name"
                placeholder="Ex: Mover leads qualificados automaticamente"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que essa automação faz"
                {...register("description")}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_active">Automação Ativa</Label>
            </div>
          </div>

          {/* Gatilho (Trigger) */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Quando executar?</h3>
            
            <div className="space-y-2">
              <Label htmlFor="trigger_type">Gatilho *</Label>
              <Controller
                name="trigger_type"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setTriggerConfig({});
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stage_change">Mudança de Estágio</SelectItem>
                      <SelectItem value="time_in_stage">Tempo no Estágio</SelectItem>
                      <SelectItem value="score_change">Mudança de Pontuação</SelectItem>
                      <SelectItem value="new_lead">Novo Lead</SelectItem>
                      <SelectItem value="activity_created">Atividade Criada</SelectItem>
                      <SelectItem value="no_activity">Sem Atividade</SelectItem>
                      <SelectItem value="lead_lost">Lead marcado como perdido</SelectItem>
                      <SelectItem value="sla_breach">SLA estourado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Configurações específicas do gatilho */}
            {triggerType === 'stage_change' && (
              <div className="space-y-2">
                <Label>Estágio de Destino</Label>
                <Select 
                  value={triggerConfig.stage_id || ""}
                  onValueChange={(value) => setTriggerConfig({ ...triggerConfig, stage_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {triggerType === 'time_in_stage' && (
              <div className="space-y-2">
                <Label>Dias no Estágio</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 7" 
                  value={triggerConfig.days || ""}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}

            {triggerType === 'no_activity' && (
              <div className="space-y-2">
                <Label>Dias sem Atividade</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 7"
                  value={triggerConfig.days || ""}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}

            {triggerType === 'new_lead' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Estratégia de distribuição</Label>
                  <Select
                    value={triggerConfig.strategy || "least_load"}
                    onValueChange={(value) => setTriggerConfig({ ...triggerConfig, strategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="least_load">Menor carga no funil</SelectItem>
                      <SelectItem value="round_robin">Round robin</SelectItem>
                      <SelectItem value="priority_pool">Fila prioritária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Origem padrão a registrar</Label>
                  <Input
                    placeholder="Ex: chat_whatsapp"
                    value={triggerConfig.origin || ""}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, origin: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Canal de notificação</Label>
                  <Input
                    placeholder="dashboard, push, email..."
                    value={triggerConfig.notify_channel || "dashboard"}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, notify_channel: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={triggerConfig.notify_dashboard ?? true}
                    onCheckedChange={(checked) => setTriggerConfig({ ...triggerConfig, notify_dashboard: checked })}
                  />
                  <Label>Notificar painel CRM automaticamente</Label>
                </div>
              </div>
            )}

            {triggerType === 'lead_lost' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dias até reengajar</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 3"
                    value={triggerConfig.delay_days || ""}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, delay_days: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Define quando o follow-up deve ser reaberto</p>
                </div>
                <div className="space-y-2">
                  <Label>Quadro / projeto alvo</Label>
                  <Input
                    placeholder="Ex: Reengajamento"
                    value={triggerConfig.project_board || ""}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, project_board: e.target.value })}
                  />
                </div>
              </div>
            )}

            {triggerType === 'sla_breach' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Horas de SLA</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 48"
                    value={triggerConfig.sla_hours || ""}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, sla_hours: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Tempo máximo sem interação antes do alerta</p>
                </div>
                <div className="space-y-2">
                  <Label>Estágio de risco</Label>
                  <Input
                    placeholder="ID do estágio ou palavra-chave"
                    value={triggerConfig.risk_stage || ""}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, risk_stage: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">O que fazer?</h3>
              <Button type="button" variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ação
              </Button>
            </div>

            <div className="space-y-3">
              {actions.map((action, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <Select
                          value={action.type}
                          onValueChange={(value) => updateAction(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="change_stage">Mudar Estágio</SelectItem>
                            <SelectItem value="assign_user">Atribuir Usuário</SelectItem>
                            <SelectItem value="send_email">Enviar Email</SelectItem>
                            <SelectItem value="create_task">Criar Tarefa</SelectItem>
                            <SelectItem value="update_score">Atualizar Pontuação</SelectItem>
                            <SelectItem value="send_notification">Enviar Notificação</SelectItem>
                            <SelectItem value="send_whatsapp">Enviar WhatsApp</SelectItem>
                            <SelectItem value="schedule_follow_up">Programar Follow-up</SelectItem>
                            <SelectItem value="create_project_task">Criar tarefa de projeto</SelectItem>
                            <SelectItem value="flag_lead">Marcar como risco</SelectItem>
                            <SelectItem value="update_origin">Atualizar origem</SelectItem>
                            <SelectItem value="log_activity">Registrar atividade</SelectItem>
                          </SelectContent>
                        </Select>

                        {action.type === 'change_stage' && (
                          <Select
                            value={action.config?.stage_id || ""}
                            onValueChange={(value) => updateActionConfig(index, { stage_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estágio" />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map(stage => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  {stage.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {action.type === 'assign_user' && (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label>Estratégia</Label>
                              <Select
                                value={action.config?.strategy || "least_load"}
                                onValueChange={(value) => updateActionConfig(index, { strategy: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="least_load">Menor carga</SelectItem>
                                  <SelectItem value="round_robin">Round robin</SelectItem>
                                  <SelectItem value="priority_pool">Fila prioritária</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Fallback</Label>
                              <Input
                                placeholder="usuário ou regra fallback"
                                value={action.config?.fallback || ""}
                                onChange={(e) => updateActionConfig(index, { fallback: e.target.value })}
                              />
                            </div>
                          </div>
                        )}

                        {action.type === 'update_score' && (
                          <Input
                            type="number"
                            placeholder="Pontos (+/- número)"
                            value={action.config?.points ?? ""}
                            onChange={(e) => updateActionConfig(index, { points: parseInt(e.target.value) || 0 })}
                          />
                        )}

                        {action.type === 'create_task' && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Descrição da tarefa"
                              value={action.config?.title || ""}
                              onChange={(e) => updateActionConfig(index, { title: e.target.value })}
                            />
                            <Input
                              type="number"
                              placeholder="Prazo em dias"
                              value={action.config?.due_in_days ?? ""}
                              onChange={(e) => updateActionConfig(index, { due_in_days: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        )}

                        {action.type === 'create_project_task' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Quadro / projeto"
                              value={action.config?.board || ""}
                              onChange={(e) => updateActionConfig(index, { board: e.target.value })}
                            />
                            <Textarea
                              placeholder="Descrição da tarefa de projeto"
                              value={action.config?.description || ""}
                              onChange={(e) => updateActionConfig(index, { description: e.target.value })}
                            />
                          </div>
                        )}

                        {action.type === 'send_email' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Assunto"
                              value={action.config?.subject || ""}
                              onChange={(e) => updateActionConfig(index, { subject: e.target.value })}
                            />
                            <Textarea
                              placeholder="Corpo ou template"
                              value={action.config?.body || ""}
                              onChange={(e) => updateActionConfig(index, { body: e.target.value })}
                            />
                          </div>
                        )}

                        {action.type === 'send_whatsapp' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Template / campanha"
                              value={action.config?.template || ""}
                              onChange={(e) => updateActionConfig(index, { template: e.target.value })}
                            />
                            <Textarea
                              placeholder="Mensagem personalizada"
                              value={action.config?.message || ""}
                              onChange={(e) => updateActionConfig(index, { message: e.target.value })}
                            />
                          </div>
                        )}

                        {action.type === 'send_notification' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Canal/Grupo (ex: gerente_vendas)"
                              value={action.config?.channel || ""}
                              onChange={(e) => updateActionConfig(index, { channel: e.target.value })}
                            />
                            <Textarea
                              placeholder="Mensagem"
                              value={action.config?.message || ""}
                              onChange={(e) => updateActionConfig(index, { message: e.target.value })}
                            />
                          </div>
                        )}

                        {action.type === 'schedule_follow_up' && (
                          <Input
                            type="number"
                            placeholder="Horas para o follow-up"
                            value={action.config?.hours ?? ""}
                            onChange={(e) => updateActionConfig(index, { hours: parseInt(e.target.value) || 0 })}
                          />
                        )}

                        {action.type === 'update_origin' && (
                          <Input
                            placeholder="Origem a registrar"
                            value={action.config?.value || ""}
                            onChange={(e) => updateActionConfig(index, { value: e.target.value })}
                          />
                        )}

                        {action.type === 'flag_lead' && (
                          <div className="grid gap-2 md:grid-cols-2">
                            <Input
                              placeholder="Flag / etiqueta"
                              value={action.config?.flag || ""}
                              onChange={(e) => updateActionConfig(index, { flag: e.target.value })}
                            />
                            <Input
                              placeholder="Cor (opcional)"
                              value={action.config?.color || ""}
                              onChange={(e) => updateActionConfig(index, { color: e.target.value })}
                            />
                          </div>
                        )}

                        {action.type === 'log_activity' && (
                          <Textarea
                            placeholder="Descrição da atividade a registrar"
                            value={action.config?.note || ""}
                            onChange={(e) => updateActionConfig(index, { note: e.target.value })}
                          />
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {actions.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma ação configurada. Clique em "Adicionar Ação" para começar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Configurações Avançadas</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_executions">Máximo de Execuções</Label>
                <Input
                  id="max_executions"
                  type="number"
                  placeholder="Ilimitado"
                  {...register("max_executions", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Quantas vezes executar por lead
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooldown_hours">Intervalo (horas)</Label>
                <Input
                  id="cooldown_hours"
                  type="number"
                  placeholder="0"
                  {...register("cooldown_hours", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo mínimo entre execuções
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                placeholder="0"
                {...register("priority", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Ordem de execução (maior = executa primeiro)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || actions.length === 0}>
              {isSubmitting ? "Salvando..." : rule ? "Atualizar" : "Criar Automação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
