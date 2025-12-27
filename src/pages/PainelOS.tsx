import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  RefreshCw, 
  Maximize, 
  Minimize,
  Clock, 
  AlertTriangle, 
  Settings,
  X,
  CheckCircle,
  Timer,
  ArrowRight,
  CalendarClock,
  HelpCircle,
  Zap,
  ChevronUp,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import { BarChartOS } from "@/components/BarChartOS";
import { BarChartTechOS } from "@/components/BarChartTechOS";
import { toast } from "sonner";
import { useOSDashboardData } from "@/hooks/useOSDashboardData";
import { useClients } from "@/hooks/useClients";
import { useUsers } from "@/hooks/useUsers";
import { useEmployees } from "@/hooks/useEmployees";
import { Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Card de métrica de prazo com design colorido
const PrazoCard = ({ 
  title, 
  value, 
  bgColor, 
  icon: Icon 
}: { 
  title: string; 
  value: number; 
  bgColor: string; 
  icon: any;
}) => (
  <Card className={`${bgColor} border-0 relative overflow-hidden`}>
    <CardContent className="p-4 text-white">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-4xl font-bold">{value}</span>
          <div className="mt-2">
            <span className="text-xs font-medium bg-black/20 px-2 py-1 rounded">
              {title}
            </span>
          </div>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
          <Icon className="h-12 w-12" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Card de métrica de prioridade
const PrioridadeCard = ({ 
  title, 
  value, 
  bgColor, 
  icon: Icon 
}: { 
  title: string; 
  value: number; 
  bgColor: string; 
  icon: any;
}) => (
  <Card className={`${bgColor} border-0 relative overflow-hidden`}>
    <CardContent className="p-4 text-white">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-4xl font-bold">{value}</span>
          <p className="text-sm mt-1 opacity-90">{title}</p>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
          <Icon className="h-10 w-10" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const PainelOS = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { data, isLoading, refetch } = useOSDashboardData();
  const { clients } = useClients();
  const { users } = useUsers();
  const { employees } = useEmployees();

  // Filtros
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedTechnician, setSelectedTechnician] = useState("all");

  const handleRefresh = () => {
    refetch();
    toast.info("Atualizando dados do painel...");
  };

  const handleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullScreen(!isFullScreen);
  };

  const handleSearch = () => {
    refetch();
    toast.success("Filtros aplicados!");
  };

  const handleClear = () => {
    setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setDateTo(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    setSelectedClient("");
    setSelectedVendor("all");
    setSelectedTechnician("all");
    refetch();
    toast.info("Filtros limpos!");
  };

  // Dados para os cards de prazo
  const prazoCards = useMemo(() => {
    if (!data) return [];
    return [
      { 
        title: "Vencidas", 
        value: data.prazoMetrics.vencidas, 
        bgColor: "bg-gradient-to-br from-red-500 to-red-600", 
        icon: X 
      },
      { 
        title: "Hoje", 
        value: data.prazoMetrics.hoje, 
        bgColor: "bg-gradient-to-br from-purple-600 to-purple-700", 
        icon: AlertTriangle 
      },
      { 
        title: "Amanhã", 
        value: data.prazoMetrics.amanha, 
        bgColor: "bg-gradient-to-br from-blue-500 to-blue-600", 
        icon: ArrowRight 
      },
      { 
        title: "Futuras", 
        value: data.prazoMetrics.futuras, 
        bgColor: "bg-gradient-to-br from-green-500 to-green-600", 
        icon: CheckCircle 
      },
      { 
        title: "Sem prazo", 
        value: data.prazoMetrics.semPrazo, 
        bgColor: "bg-gradient-to-br from-gray-500 to-gray-600", 
        icon: HelpCircle 
      },
    ];
  }, [data]);

  // Dados para os cards de prioridade
  const prioridadeCards = useMemo(() => {
    if (!data) return [];
    return [
      { 
        title: "Muito urgente", 
        value: data.prioridadeMetrics.muitoUrgente, 
        bgColor: "bg-gradient-to-br from-red-800 to-red-900", 
        icon: AlertTriangle 
      },
      { 
        title: "Urgente", 
        value: data.prioridadeMetrics.urgente, 
        bgColor: "bg-gradient-to-br from-red-500 to-red-600", 
        icon: Zap 
      },
      { 
        title: "Alta", 
        value: data.prioridadeMetrics.alta, 
        bgColor: "bg-gradient-to-br from-orange-500 to-orange-600", 
        icon: ChevronUp 
      },
      { 
        title: "Média", 
        value: data.prioridadeMetrics.media, 
        bgColor: "bg-gradient-to-br from-yellow-500 to-yellow-600", 
        icon: ChevronUp 
      },
      { 
        title: "Baixa", 
        value: data.prioridadeMetrics.baixa, 
        bgColor: "bg-gradient-to-br from-green-500 to-green-600", 
        icon: ChevronDown 
      },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando Painel de O.S...</span>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-background overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          Painel de ordens de serviços
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleRefresh} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleFullScreen} variant="default" size="sm" className="bg-red-500 hover:bg-red-600">
            {isFullScreen ? (
              <>
                <Minimize className="h-4 w-4 mr-2" />
                Sair Tela Cheia
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-2" />
                Tela cheia
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Busca avançada
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Data de entrada */}
            <div className="lg:col-span-2">
              <Label className="text-xs font-semibold text-red-600">Data de entrada</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cliente */}
            <div>
              <Label className="text-xs font-semibold text-red-600">Cliente</Label>
              <Input
                placeholder="Digite para buscar"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Vendedor */}
            <div>
              <Label className="text-xs font-semibold text-red-600">Vendedor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Técnico */}
            <div>
              <Label className="text-xs font-semibold text-red-600">Técnico</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {employees?.filter(e => e.is_active).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button onClick={handleClear} size="sm" variant="destructive">
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Prazos */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 border border-muted px-3 py-1 rounded">
            <Clock className="h-4 w-4" />
            Prazos
          </h2>
          <Settings className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {prazoCards.map((card) => (
            <PrazoCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* Seção de Prioridade */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 border border-muted px-3 py-1 rounded">
            <AlertTriangle className="h-4 w-4" />
            Prioridade
          </h2>
          <Settings className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {prioridadeCards.map((card) => (
            <PrioridadeCard key={card.title} {...card} />
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
