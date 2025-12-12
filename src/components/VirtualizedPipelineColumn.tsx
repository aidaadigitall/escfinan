import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { LeadCard } from "./LeadCard";
import { Lead } from "@/hooks/useLeads";
import { LeadActivity } from "@/hooks/useLeadActivities";
import { PipelineStage } from "@/hooks/usePipelineStages";
import { formatCurrency } from "@/lib/utils";

interface VirtualizedPipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  getActivitiesForLead: (leadId: string) => LeadActivity[];
  onEditLead: (lead: Lead) => void;
  onNewActivity: (leadId: string) => void;
  onNavigate: (path: string) => void;
}

const CARD_HEIGHT = 180; // Altura estimada de cada card
const VIRTUALIZATION_THRESHOLD = 20; // Virtualizar apenas se tiver mais de X leads

export const VirtualizedPipelineColumn = ({
  stage,
  leads,
  getActivitiesForLead,
  onEditLead,
  onNewActivity,
  onNavigate,
}: VirtualizedPipelineColumnProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calcular valor total da coluna
  const totalValue = useMemo(() => {
    return leads.reduce((sum, lead) => sum + (lead.expected_value || 0), 0);
  }, [leads]);

  // Usar virtualização apenas para listas grandes
  const shouldVirtualize = leads.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: 5, // Renderizar 5 itens extras antes/depois
    enabled: shouldVirtualize,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <Droppable droppableId={stage.id}>
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
                  <h3 className="font-semibold text-sm uppercase tracking-wider">
                    {stage.name}
                  </h3>
                </div>
                <Badge variant="secondary" className="bg-background">
                  {leads.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {formatCurrency(totalValue)}
              </p>
            </CardHeader>

            <CardContent
              ref={parentRef}
              className="flex-1 overflow-y-auto p-2 custom-scrollbar"
            >
              {shouldVirtualize ? (
                // Renderização virtualizada para listas grandes
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {items.map((virtualRow) => {
                    const lead = leads[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <Draggable
                          draggableId={lead.id}
                          index={virtualRow.index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                padding: "4px 0",
                              }}
                              className="draggable-card"
                            >
                              <LeadCard
                                lead={lead}
                                stageColor={stage.color}
                                isDragging={snapshot.isDragging}
                                activities={getActivitiesForLead(lead.id)}
                                onEdit={onEditLead}
                                onNewActivity={onNewActivity}
                                onNavigate={onNavigate}
                              />
                            </div>
                          )}
                        </Draggable>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Renderização normal para listas pequenas
                <div className="space-y-2">
                  {leads.map((lead, index) => (
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
                            stageColor={stage.color}
                            isDragging={snapshot.isDragging}
                            activities={getActivitiesForLead(lead.id)}
                            onEdit={onEditLead}
                            onNewActivity={onNewActivity}
                            onNavigate={onNavigate}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}

              {provided.placeholder}

              {leads.length === 0 && (
                <div className="h-24 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Arraste leads para cá
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Droppable>
  );
};
