import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Maximize, Clock, AlertTriangle, DollarSign, TrendingUp, Settings } from "lucide-react";
import { BarChartOS } from "@/components/BarChartOS";
import { BarChartTechOS } from "@/components/BarChartTechOS";
import { toast } from "sonner";
import { useOSDashboardData } from "@/hooks/useOSDashboardData";
import { Loader2 } from "lucide-react";

// Componente para os cards de métricas
const MetricCard = ({ title, value, color, icon: Icon, subTitle }: { title: string, value: number | string, color: string, icon: any, subTitle?: string }) => (
  <Card className={`p-4 flex flex-col justify-between h-32 text-white ${color}`}>
    <div className="flex justify-between items-start">
      <h3 className="text-sm font-medium">{title}</h3>
      <Icon className="h-6 w-6 opacity-70" />
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-bold">{value}</span>
      {subTitle && <span className="text-xs opacity-80">{subTitle}</span>}
    </div>
  </Card>
);



const PainelOS = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { data, isLoading, refetch } = useOSDashboardData();

  const handleRefresh = () => {
    refetch();
    toast.info("Atualizando dados do painel...");
  };

  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // Lógica para entrar/sair de tela cheia (se necessário)
  };

  // Dados de exemplo para o layout (serão substituídos na Fase 2)
  const prazoMetrics = data ? [
    { title: "Vencidas", value: data.prazoMetrics.vencidas, color: "bg-red-500", icon: Clock },
    { title: "Hoje", value: data.prazoMetrics.hoje, color: "bg-purple-600", icon: Clock },
    { title: "Amanhã", value: data.prazoMetrics.amanha, color: "bg-blue-500", icon: Clock },
    { title: "Futuras", value: data.prazoMetrics.futuras, color: "bg-green-500", icon: Clock },
    { title: "Sem Prazo", value: data.prazoMetrics.semPrazo, color: "bg-gray-600", icon: Clock },
  ] : [];

  const prioridadeMetrics = data ? [
    { title: "Muito Urgente", value: data.prioridadeMetrics.muitoUrgente, color: "bg-red-700", icon: AlertTriangle },
    { title: "Urgente", value: data.prioridadeMetrics.urgente, color: "bg-red-500", icon: AlertTriangle },
    { title: "Alta", value: data.prioridadeMetrics.alta, color: "bg-orange-500", icon: AlertTriangle },
    { title: "Média", value: data.prioridadeMetrics.media, color: "bg-yellow-500", icon: AlertTriangle },
    { title: "Baixa", value: data.prioridadeMetrics.baixa, color: "bg-green-600", icon: AlertTriangle },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando Painel de O.S...</span>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-background overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Painel de Ordens de Serviços</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleFullScreen} variant="outline">
            <Maximize className="h-4 w-4 mr-2" />
            Tela Cheia
          </Button>
          <Button variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Busca Avançada
          </Button>
        </div>
      </div>

      {/* Seção de Prazos */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Prazos
          </h2>
          <Settings className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {prazoMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </div>

      {/* Seção de Prioridade */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Prioridade
          </h2>
          <Settings className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {prioridadeMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </div>

	      {/* Seção de Faturamento */}
	      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
	        {data && <BarChartOS data={data.faturamentoMensal} />}
	        {data && <BarChartTechOS data={data.faturamentoPorTecnico} />}
	      </div>
    </div>
  );
};

export default PainelOS;
