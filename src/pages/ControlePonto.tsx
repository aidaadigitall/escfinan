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
import { TimeClockWidget } from "@/components/TimeClockWidget";
import { useTimeEntries, TimeEntry } from "@/hooks/useTimeEntries";
import { TimeClockApprovalPanel } from "@/components/TimeClockApprovalPanel";
import { TimeEntryEditDialog } from "@/components/TimeEntryEditDialog";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useUsers } from "@/hooks/useUsers";
import { useCurrentUserPermissions } from "@/hooks/useUserPermissions";
import { format, startOfMonth, endOfMonth, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Users, Calendar, TrendingUp, Timer, AlertCircle, Search, Download, Edit } from "lucide-react";

export default function ControlePonto() {
  const { timeEntries, isLoading } = useTimeEntries();
  const { users } = useUsers();
  const { permissions } = useCurrentUserPermissions();
  
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isAdmin = permissions?.can_manage_users || false;
  const { pendingRequests } = useTimeTracking();

  // Filter entries based on selected filters
  const filteredEntries = useMemo(() => {
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));

    return timeEntries.filter((entry) => {
      const entryDate = parseISO(entry.clock_in);
      const inMonth = entryDate >= monthStart && entryDate <= monthEnd;
      const matchesUser = selectedUser === "all" || entry.user_id === selectedUser;
      const user = users.find(u => u.user_id === entry.user_id || u.id === entry.user_id);
      const matchesSearch = !searchTerm || 
        user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return inMonth && matchesUser && matchesSearch;
    });
  }, [timeEntries, selectedMonth, selectedUser, searchTerm, users]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalHours = filteredEntries.reduce((acc, entry) => acc + (entry.total_hours || 0), 0);
    const totalBreakMinutes = filteredEntries.reduce((acc, entry) => acc + (entry.total_break_minutes || 0), 0);
    const completedEntries = filteredEntries.filter(e => e.status === "completed").length;
    const activeEntries = filteredEntries.filter(e => e.status === "active").length;
    
    // Average hours per day
    const uniqueDays = new Set(filteredEntries.map(e => format(parseISO(e.clock_in), "yyyy-MM-dd"))).size;
    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;

    // By user
    const byUser: Record<string, { hours: number; entries: number; breaks: number }> = {};
    filteredEntries.forEach(entry => {
      if (!byUser[entry.user_id]) {
        byUser[entry.user_id] = { hours: 0, entries: 0, breaks: 0 };
      }
      byUser[entry.user_id].hours += entry.total_hours || 0;
      byUser[entry.user_id].entries += 1;
      byUser[entry.user_id].breaks += entry.total_break_minutes || 0;
    });

    return {
      totalHours,
      totalBreakMinutes,
      completedEntries,
      activeEntries,
      avgHoursPerDay,
      byUser,
      uniqueDays,
    };
  }, [filteredEntries]);

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId || u.id === userId);
    return user?.name || "Usuário";
  };

  return (
    <Layout>
      <div className="space-y-3 px-2 sm:px-3 md:px-4 max-w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Controle de Ponto</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gerencie entradas, saídas e intervalos</p>
          </div>
        </div>

        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {/* Clock Widget */}
          <div className="md:col-span-1">
            <TimeClockWidget />
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Card className="p-2 sm:p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total de Horas</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatHours(metrics.totalHours)}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Dias Trabalhados</span>
              </div>
              <p className="text-xl font-bold mt-1">{metrics.uniqueDays}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Média/Dia</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatHours(metrics.avgHoursPerDay)}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Intervalos</span>
              </div>
              <p className="text-xl font-bold mt-1">{Math.round(metrics.totalBreakMinutes)}min</p>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="records" className="space-y-3">
          <TabsList className="h-9">
            <TabsTrigger value="records" className="text-sm">Registros</TabsTrigger>
            {isAdmin && <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>}
            {isAdmin && <TabsTrigger value="users" className="text-sm">Por Usuário</TabsTrigger>}
            {isAdmin && <TabsTrigger value="approvals" className="text-sm">Aprovações</TabsTrigger>}
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full sm:w-48"
                  />
                  {isAdmin && (
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Todos usuários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos usuários</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.user_id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Registros de Ponto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isAdmin && <TableHead>Usuário</TableHead>}
                        <TableHead>Data</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Intervalo</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : filteredEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            {isAdmin && <TableCell>{getUserName(entry.user_id)}</TableCell>}
                            <TableCell>
                              {format(parseISO(entry.clock_in), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {format(parseISO(entry.clock_in), "HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {entry.clock_out
                                ? format(parseISO(entry.clock_out), "HH:mm", { locale: ptBR })
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {entry.total_break_minutes
                                ? `${Math.round(entry.total_break_minutes)}min`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {entry.total_hours ? formatHours(entry.total_hours) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={entry.status === "completed" ? "default" : "secondary"}
                              >
                                {entry.status === "completed" ? "Completo" : "Ativo"}
                              </Badge>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Usuários Ativos</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{metrics.activeEntries}</p>
                    <p className="text-xs text-muted-foreground">Trabalhando agora</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Registros no Mês</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{filteredEntries.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Horas Totais</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{formatHours(metrics.totalHours)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Pendentes</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{metrics.activeEntries}</p>
                    <p className="text-xs text-muted-foreground">Sem registro de saída</p>
                  </CardContent>
                </Card>
              </div>

              {/* Summary by User */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo por Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Total de Horas</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Média/Dia</TableHead>
                        <TableHead>Intervalos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(metrics.byUser).map(([userId, data]) => (
                        <TableRow key={userId}>
                          <TableCell className="font-medium">
                            {getUserName(userId)}
                          </TableCell>
                          <TableCell>{formatHours(data.hours)}</TableCell>
                          <TableCell>{data.entries}</TableCell>
                          <TableCell>
                            {data.entries > 0
                              ? formatHours(data.hours / data.entries)
                              : "-"}
                          </TableCell>
                          <TableCell>{Math.round(data.breaks)}min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="users" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(metrics.byUser).map(([userId, data]) => (
                  <Card key={userId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{getUserName(userId)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total de Horas</span>
                        <span className="font-medium">{formatHours(data.hours)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Dias Trabalhados</span>
                        <span className="font-medium">{data.entries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Média por Dia</span>
                        <span className="font-medium">
                          {data.entries > 0 ? formatHours(data.hours / data.entries) : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Intervalos</span>
                        <span className="font-medium">{Math.round(data.breaks)}min</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="approvals" className="space-y-4">
              <TimeClockApprovalPanel requests={pendingRequests} isLoading={false} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Diálogo de edição */}
      <TimeEntryEditDialog
        entry={editingEntry}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        isAdmin={isAdmin}
      />
    </Layout>
  );
}
