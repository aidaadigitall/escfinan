import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeClockApprovalPanel } from "@/components/TimeClockApprovalPanel";
import { TimeEntryEditDialog } from "@/components/TimeEntryEditDialog";
import { useTimeEntries, TimeEntry } from "@/hooks/useTimeEntries";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useUsers } from "@/hooks/useUsers";
import { useEmployees } from "@/hooks/useEmployees";
import { format, startOfMonth, endOfMonth, parseISO, differenceInMinutes, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  Users as UsersIcon,
  Calendar,
  TrendingUp,
  Timer,
  AlertCircle,
  Search,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

export default function ControlePontoRH() {
  const { timeEntries, isLoading } = useTimeEntries();
  const { users } = useUsers();
  const { employees } = useEmployees();
  const { pendingRequests } = useTimeTracking();

  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Combinar users e employees para lista completa
  const allStaff = useMemo(() => {
    const staffMap = new Map();
    
    users.forEach(u => {
      staffMap.set(u.user_id || u.id, { ...u, type: 'user' });
    });
    
    employees.forEach(e => {
      if (!staffMap.has(e.id)) {
        staffMap.set(e.id, { ...e, type: 'employee' });
      }
    });
    
    return Array.from(staffMap.values());
  }, [users, employees]);

  // Filtrar registros por período e usuário
  const filteredEntries = useMemo(() => {
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));

    return timeEntries.filter((entry) => {
      const entryDate = parseISO(entry.clock_in);
      const inMonth = entryDate >= monthStart && entryDate <= monthEnd;
      const matchesUser = selectedUser === "all" || entry.user_id === selectedUser;
      const staff = allStaff.find(s => (s.user_id || s.id) === entry.user_id);
      const matchesSearch = !searchTerm || 
        staff?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return inMonth && matchesUser && matchesSearch;
    });
  }, [timeEntries, selectedMonth, selectedUser, searchTerm, allStaff]);

  // Calcular métricas e banco de horas por funcionário
  const staffMetrics = useMemo(() => {
    const metrics: Record<string, {
      name: string;
      totalHours: number;
      expectedHours: number;
      bankHours: number;
      workDays: number;
      lateEntries: number;
      missingEntries: number;
      overtimeHours: number;
      entries: typeof filteredEntries;
    }> = {};

    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));
    const workDaysInMonth = 22; // Aproximadamente 22 dias úteis por mês
    const expectedDailyHours = 8;

    filteredEntries.forEach(entry => {
      const userId = entry.user_id;
      const staff = allStaff.find(s => (s.user_id || s.id) === userId);
      
      if (!metrics[userId]) {
        metrics[userId] = {
          name: staff?.name || "Usuário",
          totalHours: 0,
          expectedHours: workDaysInMonth * expectedDailyHours,
          bankHours: 0,
          workDays: 0,
          lateEntries: 0,
          missingEntries: 0,
          overtimeHours: 0,
          entries: []
        };
      }

      const hours = entry.total_hours || 0;
      metrics[userId].totalHours += hours;
      metrics[userId].workDays += 1;
      metrics[userId].entries.push(entry);

      // Detectar atrasos (entrada depois das 9h)
      const clockInHour = parseISO(entry.clock_in).getHours();
      if (clockInHour > 9) {
        metrics[userId].lateEntries += 1;
      }

      // Calcular horas extras (mais de 8h por dia)
      if (hours > 8) {
        metrics[userId].overtimeHours += (hours - 8);
      }
    });

    // Calcular banco de horas (total - esperado)
    Object.keys(metrics).forEach(userId => {
      const m = metrics[userId];
      m.bankHours = m.totalHours - m.expectedHours;
      
      // Detectar faltas (dias úteis sem registro)
      m.missingEntries = Math.max(0, workDaysInMonth - m.workDays);
    });

    return metrics;
  }, [filteredEntries, selectedMonth, allStaff]);

  // Sumarização geral
  const summary = useMemo(() => {
    const totalStaff = Object.keys(staffMetrics).length;
    const totalHours = Object.values(staffMetrics).reduce((sum, m) => sum + m.totalHours, 0);
    const totalBankHours = Object.values(staffMetrics).reduce((sum, m) => sum + m.bankHours, 0);
    const totalLateEntries = Object.values(staffMetrics).reduce((sum, m) => sum + m.lateEntries, 0);
    const totalMissingEntries = Object.values(staffMetrics).reduce((sum, m) => sum + m.missingEntries, 0);
    const totalOvertimeHours = Object.values(staffMetrics).reduce((sum, m) => sum + m.overtimeHours, 0);

    return {
      totalStaff,
      totalHours,
      avgHoursPerStaff: totalStaff > 0 ? totalHours / totalStaff : 0,
      totalBankHours,
      totalLateEntries,
      totalMissingEntries,
      totalOvertimeHours,
      pendingApprovals: pendingRequests?.length || 0,
    };
  }, [staffMetrics, pendingRequests]);

  const formatHours = (hours: number) => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    const sign = hours < 0 ? "-" : "+";
    return `${sign}${h}h ${m}m`;
  };

  const exportReport = () => {
    // Gerar CSV com dados do período
    const headers = ["Funcionário", "Horas Totais", "Banco de Horas", "Dias Trabalhados", "Atrasos", "Faltas", "Horas Extras"];
    const rows = Object.entries(staffMetrics).map(([userId, m]) => [
      m.name,
      m.totalHours.toFixed(2),
      m.bankHours.toFixed(2),
      m.workDays,
      m.lateEntries,
      m.missingEntries,
      m.overtimeHours.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-ponto-${selectedMonth}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3 px-2 sm:px-3 md:px-4 max-w-full">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              Painel RH - Controle de Ponto
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gestão completa de ponto, banco de horas e relatórios
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Período</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Funcionário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {allStaff.map((staff) => (
                    <SelectItem key={staff.user_id || staff.id} value={staff.user_id || staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Funcionários</span>
            </div>
            <p className="text-xl font-bold mt-1">{summary.totalStaff}</p>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Horas Totais</span>
            </div>
            <p className="text-xl font-bold mt-1">{summary.totalHours.toFixed(0)}h</p>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Banco de Horas</span>
            </div>
            <p className={`text-xl font-bold mt-1 ${summary.totalBankHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatHours(summary.totalBankHours)}
            </p>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Atrasos</span>
            </div>
            <p className="text-xl font-bold mt-1 text-orange-600">{summary.totalLateEntries}</p>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Faltas</span>
            </div>
            <p className="text-xl font-bold mt-1 text-red-600">{summary.totalMissingEntries}</p>
          </Card>

          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-xl font-bold mt-1 text-purple-600">{summary.pendingApprovals}</p>
          </Card>
        </div>

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          </TabsList>

          {/* Visão Geral - Resumo por Funcionário */}
          <TabsContent value="overview" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo por Funcionário</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-2 sm:p-4">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead className="text-right">Horas Trabalhadas</TableHead>
                        <TableHead className="text-right">Banco de Horas</TableHead>
                        <TableHead className="text-right">Dias Trabalhados</TableHead>
                        <TableHead className="text-right">Atrasos</TableHead>
                        <TableHead className="text-right">Faltas</TableHead>
                        <TableHead className="text-right">Horas Extras</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(staffMetrics).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nenhum registro encontrado para o período selecionado
                          </TableCell>
                        </TableRow>
                      ) : (
                        Object.entries(staffMetrics).map(([userId, m]) => (
                          <TableRow key={userId}>
                            <TableCell className="font-medium">{m.name}</TableCell>
                            <TableCell className="text-right">{m.totalHours.toFixed(1)}h</TableCell>
                            <TableCell className={`text-right font-semibold ${m.bankHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatHours(m.bankHours)}
                            </TableCell>
                            <TableCell className="text-right">{m.workDays}</TableCell>
                            <TableCell className="text-right">
                              {m.lateEntries > 0 && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                  {m.lateEntries}
                                </Badge>
                              )}
                              {m.lateEntries === 0 && <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              {m.missingEntries > 0 && (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                  {m.missingEntries}
                                </Badge>
                              )}
                              {m.missingEntries === 0 && <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="text-right">{m.overtimeHours.toFixed(1)}h</TableCell>
                            <TableCell className="text-center">
                              {m.missingEntries > 0 ? (
                                <Badge variant="destructive">Irregular</Badge>
                              ) : m.bankHours < -8 ? (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  Atenção
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                  Regular
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detalhes - Registros Individuais */}
          <TabsContent value="details" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros de Ponto</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-2 sm:p-4">
                <div className="min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead className="text-right">Horas</TableHead>
                        <TableHead className="text-right">Intervalo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEntries.map((entry) => {
                          const staff = allStaff.find(s => (s.user_id || s.id) === entry.user_id);
                          return (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">{staff?.name || "N/A"}</TableCell>
                              <TableCell>{format(parseISO(entry.clock_in), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                              <TableCell>{format(parseISO(entry.clock_in), "HH:mm")}</TableCell>
                              <TableCell>
                                {entry.clock_out ? format(parseISO(entry.clock_out), "HH:mm") : "-"}
                              </TableCell>
                              <TableCell className="text-right">{(entry.total_hours || 0).toFixed(2)}h</TableCell>
                              <TableCell className="text-right">{(entry.total_break_minutes || 0)}min</TableCell>
                              <TableCell>
                                {entry.status === "active" && <Badge variant="outline" className="bg-blue-100 text-blue-800">Ativo</Badge>}
                                {entry.status === "completed" && <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingEntry(entry);
                                    setShowEditDialog(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aprovações */}
          <TabsContent value="approvals" className="space-y-3">
            <TimeClockApprovalPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo de edição */}
      <TimeEntryEditDialog
        entry={editingEntry}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        isAdmin={true}
      />
    </Layout>
  );
}
