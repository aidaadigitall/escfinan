import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Search } from "lucide-react";
import { SaldoTab } from "@/components/fluxo-caixa/SaldoTab";
import { ResumoTab } from "@/components/fluxo-caixa/ResumoTab";
import { DiarioTab } from "@/components/fluxo-caixa/DiarioTab";
import { EstatisticasTab } from "@/components/fluxo-caixa/EstatisticasTab";
import { DemonstrativoTab } from "@/components/fluxo-caixa/DemonstrativoTab";
import { AdvancedSearchDialog } from "@/components/fluxo-caixa/AdvancedSearchDialog";
import { PeriodSelector } from "@/components/fluxo-caixa/PeriodSelector";
import { useFluxoCaixaData } from "@/hooks/useFluxoCaixaData";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";

const FluxoDeCaixa = () => {
  const [filters, setFilters] = useState({});
  const today = new Date();
  const [activeTab, setActiveTab] = useState("saldo");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  const { transactions, isLoading } = useFluxoCaixaData(selectedPeriod, filters); // Usar o hook com os filtros

  const handleExport = () => {
    toast.success("Exportando dados...");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">📊</span> Fluxo de caixa
        </h1>
        <div className="flex gap-3">
          <PeriodSelector onPeriodChange={setSelectedPeriod} />
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Busca avançada
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="saldo">Saldo</TabsTrigger>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="diario">Diário</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            <TabsTrigger value="demonstrativo">Demonstrativo</TabsTrigger>
          </TabsList>
          <Button size="sm" variant="outline" className="bg-success text-success-foreground hover:bg-success/90" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <TabsContent value="saldo">
          <SaldoTab />
        </TabsContent>

        <TabsContent value="resumo">
          <ResumoTab selectedPeriod={selectedPeriod} />
        </TabsContent>

        <TabsContent value="diario">
          <DiarioTab selectedPeriod={selectedPeriod} />
        </TabsContent>

        <TabsContent value="estatisticas">
          <EstatisticasTab selectedPeriod={selectedPeriod} />
        </TabsContent>

        <TabsContent value="demonstrativo">
          <DemonstrativoTab selectedPeriod={selectedPeriod} />
        </TabsContent>
      </Tabs>

      <AdvancedSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={(newFilters) => {
          setFilters(newFilters);
          toast.success("Busca avançada aplicada!");
        }}
        onClear={() => {
          setFilters({});
          toast.info("Filtros removidos.");
        }}
      />
    </div>
  );
};

export default FluxoDeCaixa;
