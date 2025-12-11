import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Users, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeads";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadActivityDialog } from "@/components/LeadActivityDialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const CRM = () => {
  const navigate = useNavigate();
  const { leads = [], isLoading: loadingLeads, error: errorLeads, moveToPipelineStage } = useLeads();
  const { stages = [], isLoading: loadingStages, error: errorStages } = usePipelineStages();
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activityLeadId, setActivityLeadId] = useState<string | null>(null);

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

  // Agrupar leads por estágio
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = (leads || []).filter(lead => lead.pipeline_stage_id === stage.id);
    return acc;
  }, {} as Record<string, typeof leads>);

  // Leads sem estágio
  const leadsWithoutStage = (leads || []).filter(lead => !lead.pipeline_stage_id);

  // Métricas
  const totalLeads = (leads || []).length;
  const totalValue = (leads || []).reduce((sum, lead) => sum + (lead.expected_value || 0), 0);
  const wonLeads = (leads || []).filter(lead => lead.status === 'won').length;
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

  if (loadingLeads || loadingStages) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (errorLeads || errorStages) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <p className="text-red-500 font-medium">Erro ao carregar CRM.</p>
          <p className="text-sm text-muted-foreground">Tente recarregar a página. Se persistir, verifique políticas RLS das tabelas leads e pipeline_stages.</p>
        </div>
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
      <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)] cursor-grab active:cursor-grabbing select-none custom-scrollbar"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {stages.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[320px] flex-shrink-0 h-full"
                >
                  <Card className="h-full flex flex-col bg-muted/30 border-muted">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <h3 className="font-semibold text-sm uppercase tracking-wider">{stage.name}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-background">
                          {leadsByStage[stage.id]?.length || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatCurrency(
                          leadsByStage[stage.id]?.reduce((sum, l) => sum + (l.expected_value || 0), 0) || 0
                        )}
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {leadsByStage[stage.id]?.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className="mb-2 draggable-card"
                            >
                              <Card
                                className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 rotate-2" : ""}`}
                                style={{ borderLeftColor: stage.color }}
                                onClick={() => handleEditLead(lead)}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm truncate">{lead.name}</p>
                                      {lead.company && (
                                        <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                                      )}
                                    </div>
                                    {lead.expected_value && (
                                      <Badge variant="outline" className="text-[10px] px-1 h-5 whitespace-nowrap bg-background">
                                        {formatCurrency(lead.expected_value)}
                                      </Badge>
                                    )}
                                  </div>

                                  {(lead.email || lead.phone) && (
                                    <div className="space-y-0.5">
                                      {lead.email && (
                                        <p className="text-[10px] text-muted-foreground truncate">{lead.email}</p>
                                      )}
                                      {lead.phone && (
                                        <p className="text-[10px] text-muted-foreground">{lead.phone}</p>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <Badge variant={lead.probability > 70 ? "default" : "secondary"} className="text-[10px] h-5">
                                      {lead.probability || 0}%
                                    </Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        title="Nova Atividade"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActivityLeadId(lead.id);
                                        }}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-1 pt-1 border-t mt-1">
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/orcamentos?leadId=${lead.id}`); }}>Orçamento</Button>
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/ordens-servico?leadId=${lead.id}`); }}>OS</Button>
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/vendas?leadId=${lead.id}`); }}>Venda</Button>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {(!leadsByStage[stage.id] || leadsByStage[stage.id].length === 0) && (
                        <div className="h-24 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-muted-foreground">Arraste leads para cá</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>
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
                              <Card
                                className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 rotate-2" : ""}`}
                                onClick={() => handleEditLead(lead)}
                              >
                                <p className="font-semibold text-sm">{lead.name}</p>
                                {lead.company && (
                                  <p className="text-xs text-muted-foreground">{lead.company}</p>
                                )}
                              </Card>
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
