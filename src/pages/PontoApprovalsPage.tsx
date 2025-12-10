import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { TimeClockApprovalPanel } from "@/components/TimeClockApprovalPanel";
import { useUserPermissions } from "@/hooks/useUserPermissions";

export default function PontoApprovalsPage() {
  const navigate = useNavigate();
  const { permissions } = useUserPermissions();
  const { pendingRequests } = useTimeTracking();

  if (!permissions?.can_manage_employees) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Você não tem permissão para acessar esta página. Apenas gerentes e administradores podem aprovar solicitações de ponto.
            </p>
            <Button onClick={() => navigate("/ponto")} className="w-full">
              Voltar para Ponto
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/ponto")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Aprovações de Ponto</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de alteração de horário dos colaboradores
          </p>
        </div>
      </div>

      <TimeClockApprovalPanel requests={pendingRequests} />
    </div>
  );
}
