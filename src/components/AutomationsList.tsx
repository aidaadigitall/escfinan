import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLeadAutomations } from "@/hooks/useLeadAutomations";
import { AutomationRuleDialog } from "./AutomationRuleDialog";
import { Plus, Edit, Trash2, Play, Pause, Sparkles, Clock, Zap } from "lucide-react";
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
  const { rules, isLoading, toggleRuleStatus, deleteRule } = useLeadAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

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
