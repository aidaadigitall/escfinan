import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader, RefreshCw } from "lucide-react";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { generateFinancialInsights } from "@/api/aiAssistantService";
import { toast } from "sonner";

export const FinancialInsightsWidget = () => {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { analyzeSystemData } = useAIAssistant();

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const analysis = analyzeSystemData();
      const generatedInsights = await generateFinancialInsights(analysis);
      setInsights(generatedInsights);
    } catch (error) {
      toast.error("Erro ao gerar insights financeiros");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">
              Insights Financeiros
            </h3>
            <p className="text-xs text-gray-600">
              Análise inteligente dos seus dados
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={loadInsights}
          disabled={isLoading}
          className="text-blue-600 hover:bg-blue-100"
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
        <div className="space-y-3 text-sm text-gray-700 whitespace-pre-wrap">
          {insights}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">
          Clique em atualizar para gerar insights
        </p>
      )}
    </Card>
  );
};

export default FinancialInsightsWidget;
