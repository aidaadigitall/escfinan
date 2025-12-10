// Page removed - functionality migrated to ControlePonto
export default function PontoPage() {
  return null;
}
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
