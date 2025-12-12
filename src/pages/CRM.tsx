import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, TrendingUp, DollarSign, BarChart3, Workflow, ClipboardList, Sparkles, Settings, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeads";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useLeadSources } from "@/hooks/useLeadSources";
import { useAllLeadActivities } from "@/hooks/useAllLeadActivities";
import { useFilteredLeads } from "@/hooks/useFilteredLeads";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadActivityDialog } from "@/components/LeadActivityDialog";
import { LeadCard } from "@/components/LeadCard";
import { CRMFilters, defaultFilters, LeadFilters } from "@/components/CRMFilters";
import { CRMAnalytics } from "@/components/CRMAnalytics";
import { AutomationsList } from "@/components/AutomationsList";
import { DashboardSettingsDialog } from "@/components/DashboardSettingsDialog";
import { VirtualizedPipelineColumn } from "@/components/VirtualizedPipelineColumn";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const CRM = () => {
  const navigate = useNavigate();
  const { leads = [], isLoading: loadingLeads, error: errorLeads, moveToPipelineStage } = useLeads();
  const { stages = [], isLoading: loadingStages, error: errorStages } = usePipelineStages();
  const { sources = [] } = useLeadSources();
  const { getActivitiesForLead, metrics: activityMetrics } = useAllLeadActivities();
  
  // Filtros
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters);
  const { filteredLeads, isFiltered } = useFilteredLeads(leads, filters);
  
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activityLeadId, setActivityLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    // Only enable drag scrolling if clicking on the background (not on a card)
    if ((e.target as HTMLElement).closest('.draggable-card')) return;
    
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Usar leads filtrados para o pipeline
  const leadsToDisplay = filteredLeads;

  // Agrupar leads por estágio
  const leadsByStage = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = leadsToDisplay.filter(lead => lead.pipeline_stage_id === stage.id);
      return acc;
    }, {} as Record<string, typeof leadsToDisplay>);
  }, [stages, leadsToDisplay]);

  // Leads sem estágio
  const leadsWithoutStage = useMemo(() => {
    return leadsToDisplay.filter(lead => !lead.pipeline_stage_id);
  }, [leadsToDisplay]);

  // Métricas (dos leads filtrados)
  const totalLeads = leadsToDisplay.length;
  const totalValue = leadsToDisplay.reduce((sum, lead) => sum + (lead.expected_value || 0), 0);
  const wonLeads = leadsToDisplay.filter(lead => lead.status === 'won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const stageId = destination.droppableId;
    
    moveToPipelineStage.mutate({
      leadId: draggableId,
      stageId: stageId,
    });
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleNewLead = () => {
    setSelectedLead(null);
    setIsLeadDialogOpen(true);
  };

  if (loadingLeads && loadingStages) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if ((errorLeads || errorStages) && (!leads || leads.length === 0) && (!stages || stages.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <p className="text-red-500 font-medium">Erro ao carregar CRM.</p>
          <p className="text-sm text-muted-foreground">Tente recarregar a página. Se persistir, verifique políticas RLS das tabelas leads e pipeline_stages.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            Recarregar Página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM - Sistema de Alta Performance</h1>
          <p className="text-muted-foreground">Gerencie leads, automações e análises de vendas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="lg">
            <Settings className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button onClick={handleNewLead} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            <span className="hidden sm:inline">Funil</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Automações</span>
          </TabsTrigger>
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Captura</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba: Funil de Vendas */}
        <TabsContent value="pipeline" className="space-y-4 mt-6">
          {/* Filtros */}
          <CRMFilters
            filters={filters}
            onFiltersChange={setFilters}
            stages={stages}
            sources={sources}
          />

          {/* Indicador de filtros ativos */}
          {isFiltered && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Exibindo {totalLeads} de {leads.length} leads</span>
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-primary"
                onClick={() => setFilters(defaultFilters)}
              >
                Limpar filtros
              </Button>
            </div>
          )}

          {/* Alerta de atividades atrasadas */}
          {activityMetrics.overdue > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {activityMetrics.overdue} atividade(s) atrasada(s)
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Revise os leads com atividades pendentes para não perder oportunidades
                </p>
              </div>
            </div>
          )}

          {/* Métricas Rápidas */}
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
          <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-350px)] cursor-grab active:cursor-grabbing select-none custom-scrollbar"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {stages.map((stage) => (
            <VirtualizedPipelineColumn
              key={stage.id}
              stage={stage}
              leads={leadsByStage[stage.id] || []}
              getActivitiesForLead={getActivitiesForLead}
              onEditLead={handleEditLead}
              onNewActivity={setActivityLeadId}
              onNavigate={navigate}
            />
          ))}

          {/* Leads sem estágio */}
          {leadsWithoutStage.length > 0 && (
            <Droppable droppableId="no-stage">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[320px] flex-shrink-0 h-full"
                >
                  <Card className="h-full flex flex-col bg-muted/30 border-muted">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Sem Estágio</h3>
                        <Badge variant="secondary" className="bg-background">{leadsWithoutStage.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {leadsWithoutStage.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className="mb-2 draggable-card"
                            >
                              <LeadCard
                                lead={lead}
                                stageColor="#6b7280"
                                isDragging={snapshot.isDragging}
                                activities={getActivitiesForLead(lead.id)}
                                onEdit={handleEditLead}
                                onNewActivity={setActivityLeadId}
                                onNavigate={navigate}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>
            )}
          </div>
        </DragDropContext>
        </TabsContent>

        {/* Aba: Estatísticas e Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <CRMAnalytics />
        </TabsContent>

        {/* Aba: Automações */}
        <TabsContent value="automations" className="mt-6">
          <AutomationsList />
        </TabsContent>

        {/* Aba: Captura de Leads */}
        <TabsContent value="capture" className="mt-6">
          <LeadCaptureForm />
        </TabsContent>
      </Tabs>

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

      <DashboardSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
};

export default CRM;
