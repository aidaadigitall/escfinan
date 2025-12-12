import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, ShoppingCart, Wrench, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeads";
import { toast } from "sonner";

interface LeadConversionActionsProps {
  leadId: string;
  leadName: string;
  clientId?: string;
  status: string;
}

export const LeadConversionActions = ({ 
  leadId, 
  leadName, 
  clientId,
  status 
}: LeadConversionActionsProps) => {
  const navigate = useNavigate();
  const { updateLeadStatus } = useLeads();
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'quote' | 'sale' | 'service' | null>(null);

  const handleConvert = (action: 'quote' | 'sale' | 'service') => {
    if (!clientId) {
      toast.error("Este lead precisa estar vinculado a um cliente primeiro!");
      return;
    }

    setSelectedAction(action);
    setShowConversionDialog(true);
  };

  const confirmConversion = async () => {
    if (!selectedAction) return;

    try {
      // Marcar lead como ganho se ainda não estiver
      if (status !== 'won') {
        await updateLeadStatus.mutateAsync({
          leadId,
          status: 'won',
        });
      }

      // Redirecionar para a página apropriada com o leadId
      const routes = {
        quote: `/orcamentos?leadId=${leadId}`,
        sale: `/vendas?leadId=${leadId}`,
        service: `/ordens-servico?leadId=${leadId}`,
      };

      navigate(routes[selectedAction]);
      toast.success(`Redirecionando para criar ${getActionLabel(selectedAction)}...`);
      setShowConversionDialog(false);
    } catch (error) {
      console.error('Erro ao converter lead:', error);
      toast.error("Erro ao processar conversão");
    }
  };

  const getActionLabel = (action: 'quote' | 'sale' | 'service') => {
    const labels = {
      quote: 'orçamento',
      sale: 'venda',
      service: 'ordem de serviço',
    };
    return labels[action];
  };

  const getActionIcon = (action: 'quote' | 'sale' | 'service') => {
    const icons = {
      quote: FileText,
      sale: ShoppingCart,
      service: Wrench,
    };
    const Icon = icons[action];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowRight className="mr-2 h-4 w-4" />
            Converter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleConvert('quote')}>
            <FileText className="mr-2 h-4 w-4" />
            Gerar Orçamento
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert('sale')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Gerar Venda
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert('service')}>
            <Wrench className="mr-2 h-4 w-4" />
            Gerar Ordem de Serviço
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              if (status !== 'won') {
                await updateLeadStatus.mutateAsync({
                  leadId,
                  status: 'won',
                });
                toast.success("Lead marcado como ganho!");
              }
            }}
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            Marcar como Ganho
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmação */}
      <Dialog open={showConversionDialog} onOpenChange={setShowConversionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction && getActionIcon(selectedAction)}
              Converter Lead
            </DialogTitle>
            <DialogDescription>
              Você está prestes a converter o lead <strong>{leadName}</strong> em{' '}
              {selectedAction && getActionLabel(selectedAction)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Lead será marcado como ganho</p>
                <p className="text-xs text-muted-foreground">
                  O status do lead será atualizado automaticamente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {selectedAction && getActionIcon(selectedAction)}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Criar {selectedAction && getActionLabel(selectedAction)}
                </p>
                <p className="text-xs text-muted-foreground">
                  O formulário será pré-preenchido com os dados do lead
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConversionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmConversion}>
              Confirmar Conversão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
