import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLeadAutomations, type AutomationRuleFormData } from "@/hooks/useLeadAutomations";
import { AutomationRuleDialog } from "./AutomationRuleDialog";
import { Plus, Edit, Trash2, Play, Sparkles, Clock, Zap, Share2, RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AutomationBlueprint = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  badge: string;
  icon: LucideIcon;
  rule: AutomationRuleFormData;
};

const automationBlueprints: AutomationBlueprint[] = [
  {
    id: "smart-assignment",
    title: "Distribuição inteligente de leads",
    description: "Atribui automaticamente cada lead ao vendedor com menor carga, registrando a origem e disparando alertas em tempo real.",
    highlights: [
      "Balanceia o funil entre todos os vendedores",
      "Marca a origem (chat, formulário, API) para analytics",
      "Notifica o painel imediatamente para não perder atendimento",
    ],
    badge: "Lead routing",
    icon: Share2,
    rule: {
      name: "Distribuição inteligente de leads",
      description: "Usa estratégia de menor carga com fallback em round robin",
      is_active: true,
      trigger_type: "new_lead",
      trigger_config: {
        blueprint_id: "smart-assignment",
        strategy: "least_load",
        origin: "chat_whatsapp",
        notify_dashboard: true,
        notify_channel: "dashboard",
      },
      actions: [
        { type: "assign_user", config: { strategy: "least_load", fallback: "round_robin" } },
        { type: "send_notification", config: { channel: "crm_dashboard", message: "Lead distribuído automaticamente" } },
        { type: "update_origin", config: { value: "chat_whatsapp" } },
      ],
      priority: 90,
    },
  },
  {
    id: "followup-sequence",
    title: "Sequências inteligentes de follow-up",
    description: "Cada mudança de estágio agenda lembretes e dispara e-mail/WhatsApp se o lead ficar sem atividade.",
    highlights: [
      "Cria timers diferentes por estágio",
      "Envia e-mail e WhatsApp automáticos",
      "Registra atividade no histórico do lead",
    ],
    badge: "Follow-up",
    icon: RefreshCw,
    rule: {
      name: "Sequência automática de follow-up",
      description: "Reforça o contato após mudança de estágio",
      is_active: true,
      trigger_type: "stage_change",
      trigger_config: {
        blueprint_id: "followup-sequence",
        idle_hours: 12,
        include_whatsapp: true,
      },
      actions: [
        { type: "schedule_follow_up", config: { hours: 12 } },
        { type: "send_email", config: { subject: "Seguimento após avanço", body: "Template follow-up" } },
        { type: "send_whatsapp", config: { template: "follow_up_stage", message: "Olá! Temos novidades..." } },
        { type: "log_activity", config: { note: "Sequência automática disparada" } },
      ],
      priority: 70,
    },
  },
  {
    id: "lost-reengagement",
    title: "Reengajamento de leads perdidos",
    description: "Quando um lead é marcado como perdido, dispara tarefas e lembretes para reabrir o contato no futuro.",
    highlights: [
      "Agenda follow-up futuro",
      "Abre tarefa no módulo de projetos",
      "Notifica o gestor sobre o motivo da perda",
    ],
    badge: "Reativações",
    icon: RotateCcw,
    rule: {
      name: "Reengajamento de leads perdidos",
      description: "Garante segunda tentativa automática",
      is_active: true,
      trigger_type: "lead_lost",
      trigger_config: {
        blueprint_id: "lost-reengagement",
        delay_days: 3,
        project_board: "Reengajamento",
      },
      actions: [
        { type: "schedule_follow_up", config: { hours: 72 } },
        { type: "create_project_task", config: { board: "Reengajamento", description: "Reabrir conversa e revisar motivo" } },
        { type: "send_notification", config: { channel: "sales_manager", message: "Lead perdido reenfileirado para reengajamento" } },
      ],
      max_executions: 1,
      priority: 60,
    },
  },
  {
    id: "sla-alerts",
    title: "SLA e fila de risco",
    description: "Monitora o último contato e alerta gestores sempre que o SLA de 48h for estourado, movendo o lead para a fila de risco.",
    highlights: [
      "Gera alerta pro gerente",
      "Aplica flag visual no lead",
      "Move para estágio de risco automaticamente",
    ],
    badge: "SLA",
    icon: ShieldAlert,
    rule: {
      name: "SLA e alerta executivo",
      description: "Notifica e marca leads acima do SLA",
      is_active: true,
      trigger_type: "sla_breach",
      trigger_config: {
        blueprint_id: "sla-alerts",
        sla_hours: 48,
        risk_stage: "fila_risco",
      },
      actions: [
        { type: "send_notification", config: { channel: "management", message: "Lead acima do SLA" } },
        { type: "flag_lead", config: { flag: "sla_estourado", color: "#f97316" } },
        { type: "change_stage", config: { stage_id: "fila_risco" } },
      ],
      priority: 95,
    },
  },
];
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const AutomationsList = () => {
  const { rules, isLoading, toggleRuleStatus, deleteRule, createRule } = useLeadAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [activatingBlueprint, setActivatingBlueprint] = useState<string | null>(null);
  const blueprintCards = useMemo(() => (
    automationBlueprints.map((blueprint) => ({
      ...blueprint,
      isActive: rules.some((rule) => rule.trigger_config?.blueprint_id === blueprint.id),
    }))
  ), [rules]);

  const handleActivateBlueprint = async (blueprintId: string) => {
    if (activatingBlueprint) return;
    const alreadyActive = blueprintCards.find((item) => item.id === blueprintId)?.isActive;
    if (alreadyActive) return;
    const blueprint = automationBlueprints.find((item) => item.id === blueprintId);
    if (!blueprint) return;

    try {
      setActivatingBlueprint(blueprintId);
      await createRule.mutateAsync({
        ...blueprint.rule,
        trigger_config: {
          ...(blueprint.rule.trigger_config || {}),
          blueprint_id: blueprint.id,
        },
      });
    } catch (error) {
      console.error("Erro ao ativar blueprint", error);
    } finally {
      setActivatingBlueprint(null);
    }
  };

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedRule(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (ruleToDelete) {
      await deleteRule.mutateAsync(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      stage_change: 'Mudança de Estágio',
      time_in_stage: 'Tempo no Estágio',
      score_change: 'Mudança de Pontuação',
      new_lead: 'Novo Lead',
      activity_created: 'Atividade Criada',
      no_activity: 'Sem Atividade',
      lead_lost: 'Lead Perdido',
      sla_breach: 'SLA Estourado',
    };
    return labels[type] || type;
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      change_stage: 'Mudar Estágio',
      assign_user: 'Atribuir Usuário',
      send_email: 'Enviar Email',
      create_task: 'Criar Tarefa',
      update_score: 'Atualizar Pontuação',
      send_notification: 'Enviar Notificação',
      send_whatsapp: 'Enviar WhatsApp',
      schedule_follow_up: 'Programar Follow-up',
      create_project_task: 'Criar tarefa de projeto',
      flag_lead: 'Marcar como risco',
      update_origin: 'Atualizar origem',
      log_activity: 'Registrar atividade',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Automações Ativas
          </h3>
          <p className="text-sm text-muted-foreground">
            {rules.filter(r => r.is_active).length} de {rules.length} automações ativas
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Automação
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-semibold mb-2">Nenhuma automação configurada</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Crie sua primeira automação para otimizar seu funil de vendas
              </p>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Automação
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={`border-l-4 ${
                rule.is_active ? 'border-l-green-500' : 'border-l-gray-300'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{rule.name}</h4>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) =>
                        toggleRuleStatus.mutate({ id: rule.id, isActive: checked })
                      }
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Gatilho */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-24 text-sm font-medium text-muted-foreground">
                      Gatilho:
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="gap-1">
                        <Zap className="h-3 w-3" />
                        {getTriggerLabel(rule.trigger_type)}
                      </Badge>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-24 text-sm font-medium text-muted-foreground">
                      Ações:
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {(rule.actions || []).map((action: any, index: number) => (
                        <Badge key={index} variant="secondary">
                          {getActionLabel(action.type)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center gap-6 pt-4 border-t text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      <span>{rule.execution_count || 0} execuções</span>
                    </div>
                    {rule.last_executed_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Última execução:{' '}
                          {new Date(rule.last_executed_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {rule.priority > 0 && (
                      <Badge variant="outline">Prioridade: {rule.priority}</Badge>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Blueprints recomendados
            </h4>
            <p className="text-sm text-muted-foreground">
              Ative fluxos prontos para distribuição inteligente, follow-up e SLA
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {blueprintCards.map((blueprint) => {
            const Icon = blueprint.icon;
            const isProcessing = activatingBlueprint === blueprint.id;
            return (
              <Card key={blueprint.id} className="border-muted">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <h5 className="font-semibold">{blueprint.title}</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">{blueprint.description}</p>
                    </div>
                    <Badge variant="outline">{blueprint.badge}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {blueprint.rule.trigger_type === "new_lead" && "Ideal para integrar com o nó HTTP Request do seu chat"}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {blueprint.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleActivateBlueprint(blueprint.id)}
                      disabled={blueprint.isActive || isProcessing}
                    >
                      {blueprint.isActive ? "Blueprint ativo" : isProcessing ? "Ativando..." : "Ativar blueprint"}
                    </Button>
                    {blueprint.isActive && (
                      <Badge variant="secondary">Já disponível nas suas automações</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Automações Sugeridas */}
      {rules.length < 3 && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Automações Sugeridas
            </h4>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Follow-up Automático</p>
                <p className="text-muted-foreground text-xs">
                  Envie lembretes quando leads ficarem sem atividade por 7 dias
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Qualificação por Score</p>
                <p className="text-muted-foreground text-xs">
                  Mova leads automaticamente quando atingirem pontuação alta
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Tarefas de Follow-up</p>
                <p className="text-muted-foreground text-xs">
                  Crie tarefas automaticamente após mudança de estágio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Automação */}
      <AutomationRuleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={selectedRule}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta automação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
