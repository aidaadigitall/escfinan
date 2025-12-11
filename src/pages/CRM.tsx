import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Users, TrendingUp, DollarSign } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadActivityDialog } from "@/components/LeadActivityDialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const CRM = () => {
  const { leads, isLoading, moveToPipelineStage } = useLeads();
  const { stages } = usePipelineStages();
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activityLeadId, setActivityLeadId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  // Agrupar leads por estágio
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.pipeline_stage_id === stage.id);
    return acc;
  }, {} as Record<string, typeof leads>);

  // Leads sem estágio
  const leadsWithoutStage = leads.filter(lead => !lead.pipeline_stage_id);

  // Métricas
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, lead) => sum + (lead.expected_value || 0), 0);
  const wonLeads = leads.filter(lead => lead.status === 'won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (draggedLead) {
      await moveToPipelineStage.mutateAsync({
        leadId: draggedLead,
        stageId,
      });
      setDraggedLead(null);
    }
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleNewLead = () => {
    setSelectedLead(null);
    setIsLeadDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM - Funil de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus leads e oportunidades</p>
        </div>
        <Button onClick={handleNewLead}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Total de Leads</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Valor Total</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Leads Ganhos</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Taxa de Conversão</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Funil Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="min-w-[300px] flex-shrink-0"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary">
                    {leadsByStage[stage.id]?.length || 0}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    leadsByStage[stage.id]?.reduce((sum, l) => sum + (l.expected_value || 0), 0) || 0
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {leadsByStage[stage.id]?.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-3 cursor-move hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onClick={() => handleEditLead(lead)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{lead.name}</p>
                          {lead.company && (
                            <p className="text-xs text-muted-foreground">{lead.company}</p>
                          )}
                        </div>
                        {lead.expected_value && (
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(lead.expected_value)}
                          </Badge>
                        )}
                      </div>

                      {lead.email && (
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                      )}

                      {lead.phone && (
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {lead.probability || 0}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivityLeadId(lead.id);
                          }}
                        >
                          + Atividade
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {(!leadsByStage[stage.id] || leadsByStage[stage.id].length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum lead neste estágio
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Leads sem estágio */}
        {leadsWithoutStage.length > 0 && (
          <div className="min-w-[300px] flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Sem Estágio</h3>
                  <Badge variant="secondary">{leadsWithoutStage.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadsWithoutStage.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEditLead(lead)}
                  >
                    <p className="font-semibold text-sm">{lead.name}</p>
                    {lead.company && (
                      <p className="text-xs text-muted-foreground">{lead.company}</p>
                    )}
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <LeadDialog
        open={isLeadDialogOpen}
        onOpenChange={setIsLeadDialogOpen}
        lead={selectedLead}
      />

      {activityLeadId && (
        <LeadActivityDialog
          open={!!activityLeadId}
          onOpenChange={(open) => !open && setActivityLeadId(null)}
          leadId={activityLeadId}
        />
      )}
    </div>
  );
};

export default CRM;
