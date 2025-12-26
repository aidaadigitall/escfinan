import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  MessageCircle,
  Send,
  X,
  Loader,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAISettings, AIModel } from "@/hooks/useAISettings";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "suggestion" | "insight";
}

interface AIAssistantProps {
  systemData?: {
    totalIncome?: number;
    totalExpense?: number;
    balance?: number;
    pendingTransactions?: number;
    accountsCount?: number;
  };
}

export const AIAssistant = ({ systemData }: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, getActiveProvider, getActiveModel } = useAISettings();
  const [selectedModel, setSelectedModel] = useState<AIModel>(getActiveModel());
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Olá! 👋 Sou seu Analista de Negócios com IA. Atuo como CEO/Estrategista do seu negócio.\n\n• 📊 **Análise Financeira** - DRE, fluxo de caixa, indicadores\n• 💼 **Estratégias Comerciais** - Vendas e crescimento\n• 🎯 **Insights de Negócios** - Oportunidades e otimização\n• 📈 **Recomendações Estratégicas** - Decisões baseadas em dados\n\nComo posso ajudá-lo hoje?",
      timestamp: new Date(),
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callAIAssistant = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const { callAIAssistant: callService } = await import("@/api/aiAssistantService");
      const provider = getActiveProvider();
      
      const data = await callService({
        message: userMessage,
        systemData,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        model: selectedModel,
        provider,
        customApiKey: provider === "openai" ? settings.openai_api_key : 
                      provider === "google" ? settings.google_api_key : null
      });

      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        type: data.type || "text",
      }]);
    } catch (error) {
      toast.error("Erro ao conectar com o assistente de IA");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      type: "text",
    }]);
    const msg = input;
    setInput("");
    await callAIAssistant(msg);
  };

  const handleQuickAction = async (action: string) => {
    const quickMessages: Record<string, string> = {
      help: "Como uso o sistema de contas a receber?",
      strategy: "Analise meus dados e sugira estratégias para melhorar minha gestão financeira.",
      analysis: "Faça uma análise completa da saúde financeira do meu negócio.",
      decision: "Qual é a melhor estratégia para otimizar custos e aumentar receitas?",
    };
    const message = quickMessages[action];
    if (message) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: message, timestamp: new Date(), type: "text" }]);
      await callAIAssistant(message);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 rounded-full p-3 sm:p-4 shadow-lg transition-all duration-300 hover:scale-110",
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
      >
        {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
      </button>

      {isOpen && (
        <Card className="fixed bottom-16 right-4 sm:bottom-24 sm:right-6 z-30 w-[calc(100vw-32px)] sm:w-96 max-h-[60vh] sm:max-h-[500px] flex flex-col shadow-2xl border-2 border-blue-200 bg-background">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Analista IA
              </h3>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => navigate("/configuracoes")}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-blue-100 mt-1">CEO & Estrategista de Negócios</p>
            <Select value={selectedModel} onValueChange={(v: AIModel) => setSelectedModel(v)}>
              <SelectTrigger className="w-full h-8 text-xs mt-2 bg-white/20 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash">Gemini Flash (Rápido)</SelectItem>
                <SelectItem value="gemini-2.5-pro">Gemini Pro (Avançado)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (Poderoso)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">IA</div>}
                <div className={cn("max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap", msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-card border text-foreground rounded-bl-none")}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">IA</div>
                <div className="bg-card border px-4 py-2 rounded-lg"><Loader className="h-4 w-4 animate-spin text-blue-600" /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 py-3 border-t space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Ações rápidas:</p>
              <div className="grid grid-cols-2 gap-1">
                {[{ key: "help", icon: HelpCircle, label: "Ajuda" }, { key: "strategy", icon: TrendingUp, label: "Estratégia" }, { key: "analysis", icon: Lightbulb, label: "Análise" }, { key: "decision", icon: TrendingUp, label: "Decisão" }].map(({ key, icon: Icon, label }) => (
                  <Button key={key} size="sm" variant="outline" className="text-xs h-8" onClick={() => handleQuickAction(key)}>
                    <Icon className="h-3 w-3 mr-1" />{label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input placeholder="Faça uma pergunta..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()} disabled={isLoading} className="text-sm" />
              <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIAssistant;
