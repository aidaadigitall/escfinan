import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader, RefreshCw, Settings2 } from "lucide-react";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { generateFinancialInsights } from "@/api/aiAssistantService";
import { useAISettings } from "@/hooks/useAISettings";
import { toast } from "sonner";

export const FinancialInsightsWidget = () => {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { analyzeSystemData } = useAIAssistant();
  const { settings, getActiveProvider, getActiveModel } = useAISettings();

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const analysis = analyzeSystemData();
      const provider = getActiveProvider();
      const model = getActiveModel();
      
      const generatedInsights = await generateFinancialInsights(analysis, {
        model,
        provider,
        customApiKey: provider === "openai" ? settings.openai_api_key : 
                      provider === "google" ? settings.google_api_key : null
      });
      setInsights(generatedInsights);
      toast.success("Insights gerados com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar insights financeiros. Verifique sua conexão.");
      console.error("Erro ao gerar insights:", error);
      setInsights("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Insights Financeiros
            </h3>
            <p className="text-xs text-muted-foreground">
              Análise inteligente dos seus dados
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={loadInsights}
          disabled={isLoading}
          className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : insights ? (
        <div className="space-y-3 text-sm text-foreground whitespace-pre-wrap">
          {insights}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-4">
            Clique no botão para gerar insights inteligentes sobre suas finanças
          </p>
          <Button onClick={loadInsights} variant="outline" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Gerar Insights
          </Button>
        </div>
      )}
    </Card>
  );
};

export default FinancialInsightsWidget;
