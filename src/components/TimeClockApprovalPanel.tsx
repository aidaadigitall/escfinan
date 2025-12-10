import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { TimeClockRequest, useTimeTracking } from "@/hooks/useTimeTracking";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeClockApprovalPanelProps {
  requests?: TimeClockRequest[];
  isLoading?: boolean;
}

export function TimeClockApprovalPanel({ requests = [], isLoading = false }: TimeClockApprovalPanelProps) {
  const { approveRequest, rejectRequest } = useTimeTracking();
  const [selectedRequest, setSelectedRequest] = useState<TimeClockRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject">("approve");

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  const handleOpenDialog = (request: TimeClockRequest, actionType: "approve" | "reject") => {
    setSelectedRequest(request);
    setAction(actionType);
    setApprovalComment("");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedRequest) return;

    if (action === "approve") {
      approveRequest(selectedRequest.id, approvalComment || undefined);
    } else {
      rejectRequest(selectedRequest.id, approvalComment || undefined);
    }

    setDialogOpen(false);
    setSelectedRequest(null);
  };

  const getRequestTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      edit_clock_in: "Editar Entrada",
      edit_clock_out: "Editar Saída",
      add_break: "Adicionar Intervalo",
      remove_break: "Remover Intervalo",
      adjust_hours: "Ajustar Horas",
    };
    return labels[type] || type;
  };

  const getStatusBadgeVariant = (status: string): any => {
    const variants: Record<string, any> = {
      pending: "default",
      approved: "success",
      rejected: "destructive",
      cancelled: "secondary",
    };
    return variants[status] || "default";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Solicitações Pendentes ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente de aprovação.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{getRequestTypeLabel(request.request_type)}</span>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(request.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                    {request.requested_value && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Novo valor:</span> {request.requested_value}
                      </p>
                    )}
                    {request.requested_hours !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Novo total:</span> {request.requested_hours}h
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-success hover:text-success"
                      onClick={() => handleOpenDialog(request, "approve")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleOpenDialog(request, "reject")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests Section */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Processadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <div key={request.id} className="flex items-start gap-4 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{getRequestTypeLabel(request.request_type)}</span>
                      <Badge variant={getStatusBadgeVariant(request.status)} className="text-xs">
                        {request.status === "approved" ? "Aprovado" : request.status === "rejected" ? "Rejeitado" : "Cancelado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                    {request.approval_comment && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Comentário:</span> {request.approval_comment}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {request.approved_at && format(new Date(request.approved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Aprovar Solicitação" : "Rejeitar Solicitação"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "A solicitação será aprovada e as alterações serão aplicadas ao registro de ponto."
                : "A solicitação será rejeitada. Você pode adicionar um comentário informando o motivo."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <>
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <p>
                    <span className="font-semibold">Tipo:</span> {getRequestTypeLabel(selectedRequest.request_type)}
                  </p>
                  <p>
                    <span className="font-semibold">Motivo:</span> {selectedRequest.reason}
                  </p>
                  {selectedRequest.requested_value && (
                    <p>
                      <span className="font-semibold">Novo valor:</span> {selectedRequest.requested_value}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Comentário (Opcional)</label>
                  <Textarea
                    placeholder={
                      action === "approve"
                        ? "Ex: Solicitação aprovada conforme justificativa"
                        : "Ex: Falta de documentação comprobatória"
                    }
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              variant={action === "approve" ? "default" : "destructive"}
            >
              {action === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
