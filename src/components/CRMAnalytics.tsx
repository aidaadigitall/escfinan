import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeads } from "@/hooks/useLeads";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useUsers } from "@/hooks/useUsers";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Award,
  Activity,
  Zap,
  Timer,
  BarChart2,
  CircleX,
  AlarmClock,
  Filter,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { useMemo, useState } from "react";
import { differenceInDays, differenceInHours, format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, subMonths, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SLA_THRESHOLD_HOURS = 48;
const UNASSIGNED_OWNER = "__unassigned__";
const chartTextColor = "hsl(var(--muted-foreground))";
const chartForegroundColor = "hsl(var(--foreground))";
const chartBorderColor = "hsl(var(--border))";
const tooltipContentStyle = {
  backgroundColor: "hsl(var(--popover))",
  borderColor: chartBorderColor,
  color: chartForegroundColor,
};
const tooltipLabelStyle = { color: chartForegroundColor };
const tooltipItemStyle = { color: chartForegroundColor };
const axisTickProps = { fill: chartTextColor };
const axisLineProps = { stroke: chartBorderColor };
const gridStrokeColor = "rgba(148, 163, 184, 0.3)";
const legendStyle = { color: chartTextColor };
const RADIAN = Math.PI / 180;

const renderScoreLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  name,
  value,
}: PieLabelRenderProps) => {
  if (!value) {
    return null;
  }
  const numCx = Number(cx) || 0;
  const numCy = Number(cy) || 0;
  const numInnerRadius = Number(innerRadius) || 0;
  const numOuterRadius = Number(outerRadius) || 0;
  const numMidAngle = Number(midAngle) || 0;
  const radius = numInnerRadius + (numOuterRadius - numInnerRadius) * 0.5;
  const x = numCx + radius * Math.cos(-numMidAngle * RADIAN);
  const y = numCy + radius * Math.sin(-numMidAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={chartForegroundColor}
      textAnchor={x > numCx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name}: ${value}`}
    </text>
  );
};

export const CRMAnalytics = () => {
  const { leads = [] } = useLeads();
  const { stages = [] } = usePipelineStages();
  const { users } = useUsers();
  
  // Estados dos filtros de KPIs
  const [kpiPeriod, setKpiPeriod] = useState<string>("30d");
  const [kpiStage, setKpiStage] = useState<string>("all");

  // Filtrar leads por período
  const filteredLeadsForKpi = useMemo(() => {
    let filtered = [...leads];
    
    // Filtro por período
    if (kpiPeriod !== "all") {
      const now = new Date();
      let startDate: Date;
      
      switch (kpiPeriod) {
        case "7d":
          startDate = subDays(now, 7);
          break;
        case "30d":
          startDate = subDays(now, 30);
          break;
        case "90d":
          startDate = subDays(now, 90);
          break;
        default:
          startDate = subDays(now, 30);
      }
      
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return isWithinInterval(leadDate, { start: startOfDay(startDate), end: endOfDay(now) });
      });
    }
    
    // Filtro por estágio
    if (kpiStage !== "all") {
      filtered = filtered.filter(lead => lead.pipeline_stage_id === kpiStage);
    }
    
    return filtered;
  }, [leads, kpiPeriod, kpiStage]);

  // Dados filtrados para tempo médio por estágio
  const filteredAverageTimePerStage = useMemo(() => {
    const now = new Date();
    return stages.map((stage) => {
      const stageLeads = kpiStage === "all" 
        ? filteredLeadsForKpi.filter(lead => lead.pipeline_stage_id === stage.id)
        : filteredLeadsForKpi;
        
      const { totalHours, counted } = stageLeads.reduce(
        (acc, lead) => {
          if (!lead.created_at) return acc;
          const hours = Math.max(differenceInHours(now, new Date(lead.created_at)), 0);
          return { totalHours: acc.totalHours + hours, counted: acc.counted + 1 };
        },
        { totalHours: 0, counted: 0 }
      );
      const avgDays = counted > 0 ? Number(((totalHours / counted) / 24).toFixed(1)) : null;
      return {
        stage: stage.name,
        avgDays,
        sampleSize: counted,
      };
    }).filter(item => kpiStage === "all" || item.sampleSize > 0);
  }, [filteredLeadsForKpi, stages, kpiStage]);

  // Dados filtrados para conversão por etapa
  const filteredConversionByStage = useMemo(() => {
    return stages.map((stage, index) => {
      const currentStageLeads = filteredLeadsForKpi.filter(l => l.pipeline_stage_id === stage.id).length;
      const nextStage = stages[index + 1];
      const nextStageLeads = nextStage
        ? filteredLeadsForKpi.filter(l => l.pipeline_stage_id === nextStage.id).length
        : filteredLeadsForKpi.filter(l => l.status === 'won').length;
      
      const conversionRate = currentStageLeads > 0
        ? (nextStageLeads / currentStageLeads) * 100
        : 0;

      return {
        stage: stage.name,
        leads: currentStageLeads,
        conversion: Math.round(conversionRate),
      };
    }).filter(item => kpiStage === "all" || item.leads > 0);
  }, [filteredLeadsForKpi, stages, kpiStage]);

  // Dados filtrados para motivos de perda
  const filteredLossReasonStats = useMemo(() => {
    const lostLeads = filteredLeadsForKpi.filter((lead) => lead.status === "lost");
    if (!lostLeads.length) return [];

    const counts = lostLeads.reduce<Record<string, number>>((acc, lead) => {
      const reason = lead.lost_reason?.trim() || "Não informado";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([reason, count]) => ({
        reason,
        count,
        percent: Math.round((count / lostLeads.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeadsForKpi]);

  // Métricas principais
  const metrics = useMemo(() => {
    const total = leads.length;
    const won = leads.filter(l => l.status === 'won').length;
    const lost = leads.filter(l => l.status === 'lost').length;
    const active = leads.filter(l => l.status !== 'won' && l.status !== 'lost').length;
    
    const totalValue = leads.reduce((sum, l) => sum + (l.expected_value || 0), 0);
    const wonValue = leads
      .filter(l => l.status === 'won')
      .reduce((sum, l) => sum + (l.expected_value || 0), 0);
    
    const conversionRate = total > 0 ? (won / total) * 100 : 0;
    const averageTicket = won > 0 ? wonValue / won : 0;

    // Calcular velocidade de vendas (tempo médio até fechamento)
    const closedLeads = leads.filter(l => 
      l.status === 'won' && l.created_at && l.converted_at
    );
    const totalDays = closedLeads.reduce((sum, l) => {
      const days = differenceInDays(
        new Date(l.converted_at!),
        new Date(l.created_at)
      );
      return sum + days;
    }, 0);
    const avgSalesCycle = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;

    // Leads ativos por estágio
    const leadsPerStage = stages.map(stage => ({
      stage: stage.name,
      count: leads.filter(l => l.pipeline_stage_id === stage.id).length,
      value: leads
        .filter(l => l.pipeline_stage_id === stage.id)
        .reduce((sum, l) => sum + (l.expected_value || 0), 0),
    }));

    return {
      total,
      won,
      lost,
      active,
      totalValue,
      wonValue,
      conversionRate,
      averageTicket,
      avgSalesCycle,
      leadsPerStage,
    };
  }, [leads, stages]);

  // Dados para gráfico de funil
  const funnelData = useMemo(() => {
    return stages.map(stage => {
      const stageLeads = leads.filter(l => l.pipeline_stage_id === stage.id);
      const stageValue = stageLeads.reduce((sum, l) => sum + (l.expected_value || 0), 0);
      
      return {
        name: stage.name,
        value: stageLeads.length,
        fill: stage.color,
      };
    });
  }, [leads, stages]);

  // Dados para gráfico de conversão por estágio
  const conversionByStage = useMemo(() => {
    return stages.map((stage, index) => {
      const currentStageLeads = leads.filter(l => l.pipeline_stage_id === stage.id).length;
      const nextStage = stages[index + 1];
      const nextStageLeads = nextStage
        ? leads.filter(l => l.pipeline_stage_id === nextStage.id).length
        : leads.filter(l => l.status === 'won').length;
      
      const conversionRate = currentStageLeads > 0
        ? (nextStageLeads / currentStageLeads) * 100
        : 0;

      return {
        stage: stage.name,
        leads: currentStageLeads,
        conversion: Math.round(conversionRate),
      };
    });
  }, [leads, stages]);

  // Dados para gráfico de origem dos leads
  const leadsBySource = useMemo(() => {
    const sourceMap = new Map<string, number>();
    leads.forEach(lead => {
      const source = lead.source || 'Não definido';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });

    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [leads]);

  // Dados para gráfico de leads por dia (últimos 30 dias)
  const leadsOverTime = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLeads = leads.filter(l => {
        const leadDate = format(new Date(l.created_at), 'yyyy-MM-dd');
        return leadDate === dayStr;
      });

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        leads: dayLeads.length,
        value: dayLeads.reduce((sum, l) => sum + (l.expected_value || 0), 0),
      };
    });
  }, [leads]);

  // Distribuição de score dos leads
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { name: 'Frio (0-25)', min: 0, max: 25, count: 0 },
      { name: 'Morno (26-50)', min: 26, max: 50, count: 0 },
      { name: 'Quente (51-75)', min: 51, max: 75, count: 0 },
      { name: 'Muito Quente (76-100)', min: 76, max: 100, count: 0 },
    ];

    leads.forEach(lead => {
      const score = lead.score || 0;
      const range = ranges.find(r => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [leads]);

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      if (user.user_id) {
        map.set(user.user_id, user.name || user.email);
      }
    });
    return map;
  }, [users]);

  const averageTimePerStage = useMemo(() => {
    const now = new Date();
    return stages.map((stage) => {
      const { totalHours, counted } = leads
        .filter((lead) => lead.pipeline_stage_id === stage.id)
        .reduce(
          (acc, lead) => {
            if (!lead.created_at) return acc;
            const hours = Math.max(differenceInHours(now, new Date(lead.created_at)), 0);
            return { totalHours: acc.totalHours + hours, counted: acc.counted + 1 };
          },
          { totalHours: 0, counted: 0 }
        );
      const avgDays = counted > 0 ? Number(((totalHours / counted) / 24).toFixed(1)) : null;
      return {
        stage: stage.name,
        avgDays,
        sampleSize: counted,
      };
    });
  }, [leads, stages]);

  const lossReasonStats = useMemo(() => {
    const lostLeads = leads.filter((lead) => lead.status === "lost");
    if (!lostLeads.length) return [];

    const counts = lostLeads.reduce<Record<string, number>>((acc, lead) => {
      const reason = lead.lost_reason?.trim() || "Não informado";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([reason, count]) => ({
        reason,
        count,
        percent: Math.round((count / lostLeads.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const slaBreaches = useMemo(() => {
    const now = new Date();
    const breaches = leads.reduce<Record<string, number>>((acc, lead) => {
      const referenceDate = lead.last_activity_date || lead.last_contact_date || lead.created_at;
      if (!referenceDate) return acc;
      const hoursSince = differenceInHours(now, new Date(referenceDate));
      if (hoursSince <= SLA_THRESHOLD_HOURS) return acc;
      const ownerId = lead.assigned_to || UNASSIGNED_OWNER;
      acc[ownerId] = (acc[ownerId] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(breaches)
      .map(([ownerId, count]) => ({
        ownerId,
        label:
          ownerId === UNASSIGNED_OWNER
            ? "Não atribuído"
            : usersById.get(ownerId) || `Usuário ${ownerId.slice(0, 6)}...`,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [leads, usersById]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.active} ativos · {metrics.won} ganhos · {metrics.lost} perdidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.won} de {metrics.total} leads convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(metrics.wonValue)} em vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageTicket)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ciclo: {Math.round(metrics.avgSalesCycle)} dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard de KPIs Visual */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Dashboard de KPIs</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={kpiPeriod} onValueChange={setKpiPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    <SelectItem value="all">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={kpiStage} onValueChange={setKpiStage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estágios</SelectItem>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tempo médio por estágio - Visual */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Timer className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Tempo médio por estágio</h4>
              </div>
              {filteredAverageTimePerStage.length ? (
                <div className="space-y-4">
                  {filteredAverageTimePerStage.map((item, index) => {
                    const maxDays = Math.max(...filteredAverageTimePerStage.map(i => i.avgDays || 0), 1);
                    const progressValue = item.avgDays !== null ? (item.avgDays / maxDays) * 100 : 0;
                    const stageColor = stages.find(s => s.name === item.stage)?.color || '#6366f1';
                    
                    return (
                      <div key={item.stage} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: stageColor }}
                            />
                            <span className="font-medium text-sm">{item.stage}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.sampleSize} lead{item.sampleSize === 1 ? "" : "s"}
                            </Badge>
                          </div>
                          <span className="font-bold text-sm">
                            {item.avgDays !== null ? `${item.avgDays} dia(s)` : "—"}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={progressValue} 
                            className="h-3"
                            style={{ 
                              ['--progress-background' as string]: stageColor + '40',
                              ['--progress-foreground' as string]: stageColor
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p>Sem dados suficientes para o período selecionado.</p>
                </div>
              )}
            </div>

            {/* Taxa de conversão por etapa - Visual */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <BarChart2 className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Taxa de conversão por etapa</h4>
              </div>
              {filteredConversionByStage.length ? (
                <div className="space-y-4">
                  {filteredConversionByStage.map((stage) => {
                    const stageColor = stages.find(s => s.name === stage.stage)?.color || '#6366f1';
                    const conversionColor = stage.conversion >= 50 ? '#10b981' : stage.conversion >= 25 ? '#f59e0b' : '#ef4444';
                    
                    return (
                      <div key={stage.stage} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: stageColor }}
                            />
                            <span className="font-medium text-sm">{stage.stage}</span>
                            <Badge variant="outline" className="text-xs">
                              {stage.leads} leads
                            </Badge>
                          </div>
                          <span 
                            className="font-bold text-sm"
                            style={{ color: conversionColor }}
                          >
                            {stage.conversion}%
                          </span>
                        </div>
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(stage.conversion, 100)}%`,
                              backgroundColor: conversionColor
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p>Configure seus estágios para visualizar este indicador.</p>
                </div>
              )}
            </div>

            {/* Motivos de perda - Gráfico de barras horizontal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <CircleX className="h-5 w-5 text-destructive" />
                <h4 className="font-semibold">Motivos de perda</h4>
              </div>
              {filteredLossReasonStats.length ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredLossReasonStats}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                      <XAxis type="number" tick={axisTickProps} axisLine={axisLineProps} />
                      <YAxis 
                        type="category" 
                        dataKey="reason" 
                        tick={axisTickProps} 
                        axisLine={axisLineProps}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={tooltipContentStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(value: number) => [`${value} leads`, 'Quantidade']}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--destructive))" 
                        radius={[0, 4, 4, 0]}
                        label={{ position: 'right', fill: chartTextColor, fontSize: 12 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p>Nenhum lead perdido no período selecionado.</p>
                </div>
              )}
            </div>

            {/* SLA estourado por vendedor - Visual com badges */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <AlarmClock className="h-5 w-5 text-orange-500" />
                <h4 className="font-semibold">SLA estourado por vendedor</h4>
                <Badge variant="outline" className="text-xs">
                  Limite: {SLA_THRESHOLD_HOURS}h
                </Badge>
              </div>
              {slaBreaches.length ? (
                <div className="space-y-3">
                  {slaBreaches.map((item, index) => {
                    const maxBreaches = Math.max(...slaBreaches.map(i => i.count), 1);
                    const severity = item.count / maxBreaches;
                    const severityColor = severity >= 0.7 ? '#ef4444' : severity >= 0.4 ? '#f59e0b' : '#eab308';
                    
                    return (
                      <div key={item.ownerId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: severityColor }}
                        >
                          {item.count}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} lead{item.count === 1 ? "" : "s"} sem interação há mais de {SLA_THRESHOLD_HOURS}h
                          </p>
                        </div>
                        <Badge 
                          variant="destructive" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: severityColor + '20',
                            color: severityColor,
                            borderColor: severityColor
                          }}
                        >
                          {severity >= 0.7 ? 'Crítico' : severity >= 0.4 ? 'Alto' : 'Médio'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                  <Award className="h-8 w-8 text-green-500" />
                  <p>Nenhum vendedor com SLA estourado!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                <XAxis
                  type="number"
                  tick={axisTickProps}
                  axisLine={axisLineProps}
                  tickLine={axisLineProps}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={axisTickProps}
                  axisLine={axisLineProps}
                  tickLine={axisLineProps}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taxa de Conversão por Estágio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Conversão por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                <XAxis
                  dataKey="stage"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={axisTickProps}
                  axisLine={axisLineProps}
                  tickLine={axisLineProps}
                />
                <YAxis
                  tick={axisTickProps}
                  axisLine={axisLineProps}
                  tickLine={axisLineProps}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="leads" fill="#6366f1" name="Leads" />
                <Bar dataKey="conversion" fill="#10b981" name="Conversão %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads por Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Top 5 Fontes de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsBySource}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                <XAxis
                  dataKey="source"
                  tick={axisTickProps}
                  axisLine={axisLineProps}
                  tickLine={axisLineProps}
                />
                <YAxis
                  tick={axisTickProps}
                  axisLine={axisLineProps}
                  tickLine={axisLineProps}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Bar dataKey="count" fill="#f59e0b" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribuição de Temperatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderScoreLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Leads ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Leads nos Últimos 30 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
              <XAxis
                dataKey="date"
                tick={axisTickProps}
                axisLine={axisLineProps}
                tickLine={axisLineProps}
              />
              <YAxis
                yAxisId="left"
                tick={axisTickProps}
                axisLine={axisLineProps}
                tickLine={axisLineProps}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={axisTickProps}
                axisLine={axisLineProps}
                tickLine={axisLineProps}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <Legend wrapperStyle={legendStyle} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="leads"
                stroke="#6366f1"
                strokeWidth={2}
                name="Quantidade"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                name="Valor (R$)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance por Estágio */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Detalhada por Estágio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.leadsPerStage.map((stage, index) => {
              const percentage = metrics.total > 0
                ? (stage.count / metrics.total) * 100
                : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="text-right">
                      <div className="font-semibold">{stage.count} leads</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(stage.value)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}% do total
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
