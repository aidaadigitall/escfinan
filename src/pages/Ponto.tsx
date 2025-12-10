import { useNavigate } from "react-router-dom";

export default function PontoPage() {
  const navigate = useNavigate();

  // Redirecionar para a página correta de Controle de Ponto
  React.useEffect(() => {
    navigate("/controle-ponto");
  }, [navigate]);

  const handleStartBreak = () => {
    if (!today) {
      toast.error("Nenhum registro de entrada para hoje");
      return;
    }
    startBreak(today.id);
  };

  const handleEndBreak = () => {
    if (!today) {
      toast.error("Nenhum registro de entrada para hoje");
      return;
    }
    endBreak(today.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Controle de Ponto
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu horário de trabalho e banco de horas
          </p>
        </div>
        {permissions?.can_manage_employees && (
          <Button onClick={() => navigate("/ponto/aprovacoes")}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Aprovações
          </Button>
        )}
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="balance">Banco de Horas</TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-4">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-success" />
                Registros de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {today ? (
                <div className="space-y-3">
                  {/* Clock In/Out Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Entrada</p>
                      <p className="font-bold text-lg">
                        {today.clock_in
                          ? format(parseISO(today.clock_in), "HH:mm", { locale: ptBR })
                          : "—"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={handleClockIn}
                        disabled={today.clock_in !== undefined || isClockingIn}
                      >
                        <LogIn className="h-3 w-3 mr-1" />
                        {today.clock_in ? "Registrado" : "Registrar Entrada"}
                      </Button>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Saída</p>
                      <p className="font-bold text-lg">
                        {today.clock_out
                          ? format(parseISO(today.clock_out), "HH:mm", { locale: ptBR })
                          : "—"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={handleClockOut}
                        disabled={!today.clock_in || today.clock_out !== undefined || isClockingIn}
                      >
                        <LogOut className="h-3 w-3 mr-1" />
                        {today.clock_out ? "Registrado" : "Registrar Saída"}
                      </Button>
                    </div>
                  </div>

                  {/* Break Status */}
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Intervalo</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={handleStartBreak}
                        disabled={!today.clock_in || today.break_start !== undefined}
                      >
                        <Coffee className="h-3 w-3 mr-1" />
                        {today.break_start ? "Iniciado" : "Iniciar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={handleEndBreak}
                        disabled={!today.break_start || today.break_end !== undefined}
                      >
                        <Coffee className="h-3 w-3 mr-1" />
                        {today.break_end ? "Finalizado" : "Finalizar"}
                      </Button>
                    </div>
                  </div>

                  {/* Hours Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <p className="text-muted-foreground text-xs">Trabalhado</p>
                      <p className="font-bold text-primary">
                        {today.hours_worked ? formatHours(today.hours_worked) : "—"}
                      </p>
                    </div>
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <p className="text-muted-foreground text-xs">Intervalo</p>
                      <p className="font-bold text-warning">
                        {today.break_duration ? formatHours(today.break_duration) : "—"}
                      </p>
                    </div>
                    <div className="p-2 bg-success/10 rounded-lg">
                      <p className="text-muted-foreground text-xs">Líquido</p>
                      <p className="font-bold text-success">
                        {today.net_hours ? formatHours(today.net_hours) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Request Edit Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Solicitar Edição
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Nenhum registro para hoje</p>
                  <Button className="mt-4" onClick={handleClockIn}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Fazer Clock In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Requests */}
          {pendingRequests && pendingRequests.length > 0 && (
            <Card className="border-warning/50">
              <CardHeader>
                <CardTitle className="text-warning flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Solicitações Pendentes ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="text-sm p-2 bg-muted rounded">
                      <p className="font-medium">{req.reason}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Aguardando aprovação
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico de Ponto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Trabalhado</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeTrackingRange && timeTrackingRange.length > 0 ? (
                      timeTrackingRange.map((tracking) => (
                        <TableRow key={tracking.id}>
                          <TableCell>
                            {format(parseISO(tracking.date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {tracking.clock_in
                              ? format(parseISO(tracking.clock_in), "HH:mm", { locale: ptBR })
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {tracking.clock_out
                              ? format(parseISO(tracking.clock_out), "HH:mm", { locale: ptBR })
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {tracking.hours_worked ? formatHours(tracking.hours_worked) : "—"}
                          </TableCell>
                          <TableCell>
                            {tracking.net_hours ? formatHours(tracking.net_hours) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tracking.status === "approved"
                                  ? "default"
                                  : tracking.status === "edited"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {tracking.status === "completed" ? "Completo" : tracking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank of Hours Tab */}
        <TabsContent value="balance" className="space-y-4">
          {/* Total Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Saldo Total de Banco de Horas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getBalanceColor(bankOfHours)}`}>
                {formatBalance(bankOfHours)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {bankOfHours > 0
                  ? "Você tem horas extras acumuladas"
                  : bankOfHours < 0
                  ? "Você tem déficit de horas"
                  : "Seu saldo está zerado"}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Summaries */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {yearlySummaries && yearlySummaries.length > 0 ? (
                  yearlySummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">
                            {format(
                              parseISO(`${summary.year_month}-01`),
                              "MMMM/yyyy",
                              { locale: ptBR }
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatHours(summary.total_net_hours)} trabalhadas
                          </p>
                        </div>
                        <Badge
                          variant={summary.balance_hours > 0 ? "default" : "secondary"}
                          className={getBalanceColor(summary.balance_hours)}
                        >
                          {formatBalance(summary.balance_hours)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Esperado</p>
                          <p className="font-semibold">{formatHours(summary.expected_hours)}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Realizado</p>
                          <p className="font-semibold">{formatHours(summary.total_net_hours)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum resumo disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Request Dialog */}
      <TimeClockRequestDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        timeTracking={today || undefined}
      />
    </div>
  );
}
