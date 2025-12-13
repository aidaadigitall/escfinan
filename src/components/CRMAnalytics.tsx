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
import { useMemo } from "react";
import { differenceInDays, differenceInHours, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={chartForegroundColor}
      textAnchor={x > cx ? "start" : "end"}
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

      {/* Indicadores Recomendados */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Indicadores recomendados (KPIs)</h3>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                Tempo médio por estágio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {averageTimePerStage.length ? (
                <div className="space-y-3">
                  {averageTimePerStage.map((item) => (
                    <div key={item.stage} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.stage}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sampleSize} lead{item.sampleSize === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {item.avgDays !== null ? `${item.avgDays} dia(s)` : "Sem dados"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                Taxa de conversão por etapa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversionByStage.length ? (
                <div className="space-y-3">
                  {conversionByStage.map((stage) => (
                    <div key={stage.stage} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{stage.stage}</p>
                        <p className="text-xs text-muted-foreground">{stage.leads} leads</p>
                      </div>
                      <span className="font-semibold">{stage.conversion}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Configure seus estágios para visualizar este indicador.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CircleX className="h-4 w-4 text-muted-foreground" />
                Motivos de perda
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lossReasonStats.length ? (
                <div className="space-y-3">
                  {lossReasonStats.map((reason) => (
                    <div key={reason.reason} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{reason.reason}</p>
                        <p className="text-xs text-muted-foreground">{reason.count} lead{reason.count === 1 ? "" : "s"}</p>
                      </div>
                      <span className="font-semibold">{reason.percent}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lead perdido no período.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-muted-foreground" />
                SLA estourado por vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Consideramos SLA de {SLA_THRESHOLD_HOURS}h sem interação registrada.
              </p>
              {slaBreaches.length ? (
                <div className="space-y-3">
                  {slaBreaches.map((item) => (
                    <div key={item.ownerId} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="font-semibold text-red-500">{item.count} lead{item.count === 1 ? "" : "s"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum vendedor com SLA estourado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
