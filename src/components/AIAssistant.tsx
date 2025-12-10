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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Olá! 👋 Sou o assistente de IA do Esc. Posso ajudá-lo com:\n\n• 📚 **Dúvidas sobre o sistema** - Como usar funcionalidades\n• 💡 **Estratégias financeiras** - Ideias para melhorar sua gestão\n• 📊 **Análises e insights** - Baseado nos seus dados\n• 🎯 **Tomadas de decisão** - Recomendações personalizadas\n\nComo posso ajudá-lo?",
      timestamp: new Date(),
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callAIAssistant = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const { callAIAssistant: callService } = await import("@/api/aiAssistantService");
      const data = await callService({
        message: userMessage,
        systemData,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
      });

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        type: data.type || "text",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Erro ao conectar com o assistente de IA");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await callAIAssistant(input);
  };

  const handleQuickAction = async (action: string) => {
    const quickMessages: { [key: string]: string } = {
      help: "Como uso o sistema de contas a receber?",
      strategy: "Quais são as melhores estratégias para melhorar minha gestão financeira?",
      analysis:
        "Analise meus dados financeiros e me dê insights sobre meu desempenho",
      decision:
        "Qual é a melhor estratégia para reduzir minhas despesas mantendo a qualidade?",
    };

    const message = quickMessages[action];
    if (message) {
      setInput(message);
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, userMsg]);
      await callAIAssistant(message);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 rounded-full p-3 sm:p-4 shadow-lg transition-all duration-300 hover:scale-110",
          isOpen
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
        title="Assistente de IA"
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : (
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-16 right-4 sm:bottom-24 sm:right-6 z-30 w-[calc(100vw-32px)] sm:w-96 max-h-[60vh] sm:max-h-[500px] flex flex-col shadow-2xl border-2 border-blue-200 bg-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Assistente de IA
            </h3>
            <p className="text-xs text-blue-100 mt-1">
              Consultoria e suporte inteligente
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] sm:max-w-xs px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm whitespace-pre-wrap break-words",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  AI
                </div>
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
                  <Loader className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 border-t bg-white space-y-2">
              <p className="text-xs font-semibold text-gray-600">
                Ações rápidas:
              </p>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] sm:text-xs h-7 sm:h-8"
                  onClick={() => handleQuickAction("help")}
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Ajuda
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] sm:text-xs h-7 sm:h-8"
                  onClick={() => handleQuickAction("strategy")}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Estratégia
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] sm:text-xs h-7 sm:h-8"
                  onClick={() => handleQuickAction("analysis")}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Análise
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] sm:text-xs h-7 sm:h-8"
                  onClick={() => handleQuickAction("decision")}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Decisão
                </Button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                placeholder="Faça uma pergunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="text-sm"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIAssistant;
