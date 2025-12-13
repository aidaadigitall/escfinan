import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { Lead } from "@/hooks/useLeads";
import { LeadActivity } from "@/hooks/useLeadActivities";
import { useLeadDocuments, ClientDocument } from "@/hooks/useClientDocuments";
import { Plus, Bell, Calendar, Clock, CheckCircle2, AlertCircle, Phone, Mail, MessageSquare, FileText, ShoppingCart, Wrench } from "lucide-react";
import { format, isAfter, isBefore, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadCardProps {
  lead: Lead;
  stageColor: string;
  isDragging?: boolean;
  activities?: LeadActivity[];
  onEdit: (lead: Lead) => void;
  onNewActivity: (leadId: string) => void;
  onNavigate: (path: string) => void;
}

export const LeadCard = ({
  lead,
  stageColor,
  isDragging = false,
  activities = [],
  onEdit,
  onNewActivity,
  onNavigate,
}: LeadCardProps) => {
  // Fetch documents for this lead's client
  const { documents } = useLeadDocuments(lead.client_id);

  // Calculate total value from documents
  const documentsMetrics = useMemo(() => {
    const quotes = documents.filter(d => d.type === 'quote');
    const sales = documents.filter(d => d.type === 'sale');
    const serviceOrders = documents.filter(d => d.type === 'service_order');
    
    const totalQuotesValue = quotes.reduce((sum, d) => sum + d.total_amount, 0);
    const totalSalesValue = sales.reduce((sum, d) => sum + d.total_amount, 0);
    const totalServiceOrdersValue = serviceOrders.reduce((sum, d) => sum + d.total_amount, 0);
    
    return {
      quotes: quotes.length,
      sales: sales.length,
      serviceOrders: serviceOrders.length,
      totalQuotesValue,
      totalSalesValue,
      totalServiceOrdersValue,
      totalValue: totalQuotesValue + totalSalesValue + totalServiceOrdersValue,
      hasDocuments: documents.length > 0,
    };
  }, [documents]);
  // Calcular métricas de atividades
  const activityMetrics = useMemo(() => {
    const now = new Date();
    const pendingActivities = activities.filter(a => !a.is_completed);
    const scheduledActivities = pendingActivities.filter(a => a.scheduled_for);
    
    // Atividades atrasadas (agendadas para antes de hoje e não completadas)
    const overdueActivities = scheduledActivities.filter(a => {
      const scheduledDate = new Date(a.scheduled_for!);
      return isBefore(scheduledDate, now) && !isToday(scheduledDate);
    });
    
    // Atividades para hoje
    const todayActivities = scheduledActivities.filter(a => 
      isToday(new Date(a.scheduled_for!))
    );
    
    // Próxima atividade agendada
    const upcomingActivities = scheduledActivities
      .filter(a => {
        const scheduledDate = new Date(a.scheduled_for!);
        return isAfter(scheduledDate, now) || isToday(scheduledDate);
      })
      .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime());
    
    const nextActivity = upcomingActivities[0] || todayActivities[0];
    
    // Dias sem contato
    const lastActivityDate = activities.length > 0 
      ? new Date(activities[0].created_at) 
      : new Date(lead.created_at);
    const daysSinceLastActivity = differenceInDays(now, lastActivityDate);
    
    return {
      total: activities.length,
      pending: pendingActivities.length,
      overdue: overdueActivities.length,
      today: todayActivities.length,
      nextActivity,
      daysSinceLastActivity,
      hasWarning: overdueActivities.length > 0 || daysSinceLastActivity > 7,
    };
  }, [activities, lead.created_at]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'whatsapp': return <MessageSquare className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  return (
    <Card
      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 group ${
        isDragging ? "shadow-lg ring-2 ring-primary/20 rotate-2" : ""
      } ${activityMetrics.overdue > 0 ? "ring-1 ring-red-200" : ""}`}
      style={{ borderLeftColor: stageColor }}
      onClick={() => onEdit(lead)}
    >
      <div className="space-y-2">
        {/* Header com nome e valor */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm truncate">{lead.name}</p>
              {/* Indicadores de alerta */}
              <TooltipProvider>
                {activityMetrics.overdue > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activityMetrics.overdue} atividade(s) atrasada(s)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {activityMetrics.today > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Bell className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activityMetrics.today} atividade(s) para hoje</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {activityMetrics.daysSinceLastActivity > 7 && activityMetrics.overdue === 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Clock className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activityMetrics.daysSinceLastActivity} dias sem contato</p>
                    </TooltipContent>
                  </Tooltip>
        )}

        {/* Documentos vinculados */}
        {documentsMetrics.hasDocuments && (
          <div className="flex flex-wrap gap-1 pt-1">
            <TooltipProvider>
              {documentsMetrics.quotes > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200">
                      <FileText className="h-2.5 w-2.5" />
                      {documentsMetrics.quotes}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{documentsMetrics.quotes} orçamento(s) - {formatCurrency(documentsMetrics.totalQuotesValue)}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {documentsMetrics.sales > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200">
                      <ShoppingCart className="h-2.5 w-2.5" />
                      {documentsMetrics.sales}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{documentsMetrics.sales} venda(s) - {formatCurrency(documentsMetrics.totalSalesValue)}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {documentsMetrics.serviceOrders > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200">
                      <Wrench className="h-2.5 w-2.5" />
                      {documentsMetrics.serviceOrders}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{documentsMetrics.serviceOrders} OS(s) - {formatCurrency(documentsMetrics.totalServiceOrdersValue)}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        )}
              </TooltipProvider>
            </div>
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

        {/* Contato */}
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

        {/* Próxima atividade agendada */}
        {activityMetrics.nextActivity && (
          <div 
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md ${
              activityMetrics.overdue > 0 
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" 
                : activityMetrics.today > 0
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {getActivityIcon(activityMetrics.nextActivity.type)}
            <span className="truncate flex-1">{activityMetrics.nextActivity.title}</span>
            <span className="flex-shrink-0">
              {format(new Date(activityMetrics.nextActivity.scheduled_for!), "dd/MM", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Probabilidade e ações */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Badge variant={lead.probability > 70 ? "default" : "secondary"} className="text-[10px] h-5">
              {lead.probability || 0}%
            </Badge>
            {/* Contador de atividades */}
            {activityMetrics.total > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{activityMetrics.total - activityMetrics.pending}/{activityMetrics.total}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{activityMetrics.total - activityMetrics.pending} de {activityMetrics.total} atividades concluídas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title="Nova Atividade"
              onClick={(e) => {
                e.stopPropagation();
                onNewActivity(lead.id);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Ações rápidas */}
        <div className="flex gap-1 pt-1 border-t mt-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-[10px] px-2 flex-1" 
            onClick={(e) => { e.stopPropagation(); onNavigate(`/orcamentos?leadId=${lead.id}`); }}
          >
            Orçamento
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-[10px] px-2 flex-1" 
            onClick={(e) => { e.stopPropagation(); onNavigate(`/ordens-servico?leadId=${lead.id}`); }}
          >
            OS
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-[10px] px-2 flex-1" 
            onClick={(e) => { e.stopPropagation(); onNavigate(`/vendas?leadId=${lead.id}`); }}
          >
            Venda
          </Button>
        </div>
      </div>
    </Card>
  );
};
