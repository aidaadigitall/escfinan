import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects, Project } from "@/hooks/useProjects";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BurndownChartProps {
  hideValues?: boolean;
}

export const ProjectBurndownChart = ({ hideValues = false }: BurndownChartProps) => {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const projectList = projects || [];

  // Get active projects only
  const activeProjects = projectList.filter(p => p.status === "active");

  // Calculate burndown data for the current month
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Generate data points for each day of the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const burndownData = daysInMonth.map(day => {
    const dayStr = format(day, "dd/MM", { locale: ptBR });

    // Calculate total progress for this day
    let totalProgress = 0;
    let projectCount = 0;

    activeProjects.forEach(project => {
      if (project.start_date && new Date(project.start_date) <= day) {
        totalProgress += project.progress_percentage || 0;
        projectCount++;
      }
    });

    const avgProgress = projectCount > 0 ? Math.round(totalProgress / projectCount) : 0;

    return {
      date: dayStr,
      progress: hideValues ? 0 : avgProgress,
      projects: hideValues ? 0 : projectCount,
    };
  });

  // Calculate ideal burndown line (linear decrease from 0 to 100%)
  const daysInCurrentMonth = differenceInDays(monthEnd, monthStart) + 1;
  const idealBurndown = burndownData.map((_, index) => {
    const percentComplete = Math.round((index / daysInCurrentMonth) * 100);
    return percentComplete;
  });

  const chartData = burndownData.map((item, index) => ({
    ...item,
    ideal: hideValues ? 0 : idealBurndown[index],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Gráfico de Burndown - {format(today, "MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeProjects.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>Nenhum projeto ativo para exibir</p>
          </div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(daysInMonth.length / 7)}
                />
                <YAxis
                  label={{ value: "Progresso (%)", angle: -90, position: "insideLeft" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  labelFormatter={(label) => `Data: ${label}`}
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Progresso Real"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Progresso Ideal"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-muted-foreground">Projetos Ativos</p>
            <p className="text-2xl font-bold">{hideValues ? "••" : activeProjects.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-muted-foreground">Progresso Médio</p>
            <p className="text-2xl font-bold">
              {hideValues ? "••" : `${Math.round(activeProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / activeProjects.length)}%`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
