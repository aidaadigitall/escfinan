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
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFluxoCaixaData } from "@/hooks/useFluxoCaixaData";
import * as XLSX from "xlsx";

const FluxoDeCaixa = () => {
  const today = new Date();
  const [activeTab, setActiveTab] = useState("saldo");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  const fluxoData = useFluxoCaixaData(selectedPeriod, filters);

  const handleExport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ["Fluxo de Caixa - Resumo"],
        ["Período", `${format(selectedPeriod.start, "dd/MM/yyyy")} a ${format(selectedPeriod.end, "dd/MM/yyyy")}`],
        [],
        ["Receitas Realizadas", fluxoData.income],
        ["Despesas Realizadas", fluxoData.expenses],
        ["Saldo Realizado", fluxoData.balance],
        [],
        ["Receitas Pendentes", fluxoData.pendingIncome],
        ["Despesas Pendentes", fluxoData.pendingExpenses],
        ["Saldo Final Previsto", fluxoData.finalBalance],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Resumo");

      // Income transactions sheet
      if (fluxoData.incomeTransactions && fluxoData.incomeTransactions.length > 0) {
        const incomeData = [
          ["Data Vencimento", "Descrição", "Cliente", "Valor", "Status", "Valor Pago"],
          ...fluxoData.incomeTransactions.map((t: any) => [
            format(new Date(t.due_date), "dd/MM/yyyy"),
            t.description,
            t.client || "-",
            t.amount,
            t.status,
            t.paid_amount || 0,
          ]),
        ];
        const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(wb, incomeSheet, "Receitas");
      }

      // Expense transactions sheet
      if (fluxoData.expenseTransactions && fluxoData.expenseTransactions.length > 0) {
        const expenseData = [
          ["Data Vencimento", "Descrição", "Fornecedor", "Valor", "Status", "Valor Pago"],
          ...fluxoData.expenseTransactions.map((t: any) => [
            format(new Date(t.due_date), "dd/MM/yyyy"),
            t.description,
            t.entity || "-",
            t.amount,
            t.status,
            t.paid_amount || 0,
          ]),
        ];
        const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
        XLSX.utils.book_append_sheet(wb, expenseSheet, "Despesas");
      }

      // Daily flow sheet
      if (fluxoData.dailyFlow && fluxoData.dailyFlow.length > 0) {
        const dailyData = [
          ["Data", "Valor do Dia", "Saldo Acumulado"],
          ...fluxoData.dailyFlow.map((d: any) => [
            d.date,
            d.value,
            d.accumulated,
          ]),
        ];
        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(wb, dailySheet, "Fluxo Diário");
      }

      // Category data sheet
      if (fluxoData.categoryData && fluxoData.categoryData.length > 0) {
        const categoryDataSheet = [
          ["Categoria", "Valor"],
          ...fluxoData.categoryData.map((c: any) => [c.name, c.value]),
        ];
        const catSheet = XLSX.utils.aoa_to_sheet(categoryDataSheet);
        XLSX.utils.book_append_sheet(wb, catSheet, "Por Categoria");
      }

      // Download file
      const fileName = `fluxo_caixa_${format(selectedPeriod.start, "yyyy-MM-dd")}_${format(selectedPeriod.end, "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success("Fluxo de caixa exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Erro ao exportar fluxo de caixa");
    }
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
          <ResumoTab selectedPeriod={selectedPeriod} filters={filters} />
        </TabsContent>

        <TabsContent value="diario">
          <DiarioTab selectedPeriod={selectedPeriod} filters={filters} />
        </TabsContent>

        <TabsContent value="estatisticas">
          <EstatisticasTab selectedPeriod={selectedPeriod} filters={filters} />
        </TabsContent>

        <TabsContent value="demonstrativo">
          <DemonstrativoTab selectedPeriod={selectedPeriod} filters={filters} />
        </TabsContent>
      </Tabs>

      <AdvancedSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={(newFilters) => {
          setFilters(newFilters);
          // Se o período foi definido na busca, atualiza o período selecionado
          if (newFilters.startDate && newFilters.endDate) {
            try {
              const start = new Date(newFilters.startDate);
              const end = new Date(newFilters.endDate);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                setSelectedPeriod({ start, end });
              }
            } catch {}
          }
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
