import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects, Project } from "@/hooks/useProjects";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHoursWidgetProps {
  hideValues?: boolean;
}

export const ProjectHoursWidget = ({ hideValues = false }: ProjectHoursWidgetProps) => {
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();

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

  // Get active projects with budget hours
  const projectsWithHours = projectList
    .filter(p => p.status === "active" && p.budget_hours && p.budget_hours > 0)
    .sort((a, b) => (b.budget_hours || 0) - (a.budget_hours || 0))
    .slice(0, 8);

  const chartData = projectsWithHours.map(project => ({
    name: hideValues ? "••••" : project.name.substring(0, 15),
    hours: hideValues ? 0 : project.budget_hours || 0,
    id: project.id,
  }));

  const totalHours = projectsWithHours.reduce((sum, p) => sum + (p.budget_hours || 0), 0);
  const avgHours = projectsWithHours.length > 0 ? Math.round(totalHours / projectsWithHours.length) : 0;

  // Color palette for bars
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#14b8a6", // teal
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Horas por Projeto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projectsWithHours.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>Nenhum projeto ativo com horas orçadas</p>
          </div>
        ) : (
          <>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    label={{ value: "Horas", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value}h`}
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-muted-foreground">Total de Horas</p>
                <p className="text-2xl font-bold">{hideValues ? "••" : `${totalHours}h`}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-muted-foreground">Média por Projeto</p>
                <p className="text-2xl font-bold">{hideValues ? "••" : `${avgHours}h`}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-muted-foreground">Projetos</p>
                <p className="text-2xl font-bold">{hideValues ? "••" : projectsWithHours.length}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Detalhes dos Projetos</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {projectsWithHours.map((project, index) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/projetos/${project.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="truncate">{hideValues ? "••••" : project.name}</span>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {hideValues ? "••" : `${project.budget_hours}h`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
