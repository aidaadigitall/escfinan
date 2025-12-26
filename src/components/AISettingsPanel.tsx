import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, 
  Key, 
  BarChart3, 
  Settings, 
  Eye, 
  EyeOff,
  Sparkles,
  Cpu,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAISettings, AIProvider, AIModel } from "@/hooks/useAISettings";
import { toast } from "sonner";

export const AISettingsPanel = () => {
  const { 
    settings, 
    usageLogs, 
    isLoading, 
    upsertSettings, 
    getUsagePercentage,
    getUsageByProvider,
    getUsageByDay,
    hasCustomApiKey
  } = useAISettings();

  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [localOpenAIKey, setLocalOpenAIKey] = useState(settings?.openai_api_key || "");
  const [localGoogleKey, setLocalGoogleKey] = useState(settings?.google_api_key || "");
  const [localProvider, setLocalProvider] = useState<AIProvider>(settings?.default_provider || "lovable");
  const [localModel, setLocalModel] = useState<AIModel>(settings?.default_model || "gemini-2.5-flash");

  const handleSaveSettings = () => {
    upsertSettings({
      openai_api_key: localOpenAIKey || null,
      google_api_key: localGoogleKey || null,
      default_provider: localProvider,
      default_model: localModel,
    });
  };

  const usageByProvider = getUsageByProvider();
  const usageByDay = getUsageByDay();
  const usagePercentage = getUsagePercentage();

  const providerModels: Record<AIProvider, AIModel[]> = {
    lovable: ["gemini-2.5-flash", "gemini-2.5-pro", "gpt-4o", "gpt-4o-mini"],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1-mini"],
    google: ["gemini-2.5-flash", "gemini-2.5-pro"],
  };

  const modelLabels: Record<AIModel, string> = {
    "gemini-2.5-flash": "Gemini 2.5 Flash (Rápido)",
    "gemini-2.5-pro": "Gemini 2.5 Pro (Avançado)",
    "gpt-4o": "GPT-4o (Poderoso)",
    "gpt-4o-mini": "GPT-4o Mini (Econômico)",
    "gpt-4.1-mini": "GPT-4.1 Mini (Otimizado)",
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Configurações de IA</CardTitle>
              <CardDescription>
                Configure modelos de IA, chaves API e monitore o consumo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="provider" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Provedor
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Chaves API
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Consumo
          </TabsTrigger>
        </TabsList>

        {/* Provedor Tab */}
        <TabsContent value="provider" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Selecionar Provedor de IA
              </CardTitle>
              <CardDescription>
                Escolha qual serviço de IA será usado para análises e assistência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    localProvider === "lovable" 
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" 
                      : "border-border hover:border-indigo-300"
                  }`}
                  onClick={() => setLocalProvider("lovable")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Lovable AI</h4>
                        <p className="text-sm text-muted-foreground">
                          Integração nativa - Sem necessidade de chave API
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Recomendado
                    </Badge>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    localProvider === "openai" 
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30" 
                      : "border-border hover:border-green-300"
                  }`}
                  onClick={() => setLocalProvider("openai")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Cpu className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">OpenAI</h4>
                        <p className="text-sm text-muted-foreground">
                          GPT-4o e modelos avançados - Requer chave API
                        </p>
                      </div>
                    </div>
                    {localOpenAIKey ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Configurado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sem chave
                      </Badge>
                    )}
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    localProvider === "google" 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                      : "border-border hover:border-blue-300"
                  }`}
                  onClick={() => setLocalProvider("google")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Google AI (Gemini)</h4>
                        <p className="text-sm text-muted-foreground">
                          Gemini Pro e Flash - Requer chave API
                        </p>
                      </div>
                    </div>
                    {localGoogleKey ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Configurado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sem chave
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modelo Padrão</Label>
                <Select 
                  value={localModel} 
                  onValueChange={(value: AIModel) => setLocalModel(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providerModels[localProvider].map((model) => (
                      <SelectItem key={model} value={model}>
                        {modelLabels[model]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chaves API Tab */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-500" />
                Chaves de API
              </CardTitle>
              <CardDescription>
                Configure suas chaves API para usar provedores externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai-key" className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Chave API OpenAI
                </Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showOpenAIKey ? "text" : "password"}
                    value={localOpenAIKey}
                    onChange={(e) => setLocalOpenAIKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  >
                    {showOpenAIKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave em{" "}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>

              {/* Google API Key */}
              <div className="space-y-2">
                <Label htmlFor="google-key" className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Chave API Google (Gemini)
                </Label>
                <div className="relative">
                  <Input
                    id="google-key"
                    type={showGoogleKey ? "text" : "password"}
                    value={localGoogleKey}
                    onChange={(e) => setLocalGoogleKey(e.target.value)}
                    placeholder="AIza..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowGoogleKey(!showGoogleKey)}
                  >
                    {showGoogleKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave em{" "}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    aistudio.google.com
                  </a>
                </p>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                Salvar Chaves
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumo Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Consumo de Tokens
              </CardTitle>
              <CardDescription>
                Monitore o uso mensal de tokens de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uso mensal</span>
                  <span className="font-medium">
                    {settings.tokens_used_this_month?.toLocaleString('pt-BR') || 0} / {settings.monthly_token_limit?.toLocaleString('pt-BR') || 100000}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-3" />
                <p className="text-xs text-muted-foreground text-right">
                  {usagePercentage}% utilizado
                </p>
              </div>

              {/* Usage by Provider */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Por Provedor</h4>
                <div className="grid gap-2">
                  {Object.entries(usageByProvider).map(([provider, tokens]) => (
                    <div key={provider} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          provider === 'lovable' ? 'bg-indigo-500' :
                          provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="capitalize">{provider}</span>
                      </div>
                      <span className="font-mono text-sm">{tokens.toLocaleString('pt-BR')} tokens</span>
                    </div>
                  ))}
                  {Object.keys(usageByProvider).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum uso registrado ainda
                    </p>
                  )}
                </div>
              </div>

              {/* Usage by Day */}
              {usageByDay.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Últimos 7 dias</h4>
                  <div className="grid gap-1">
                    {usageByDay.map(({ day, tokens }) => (
                      <div key={day} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">{day}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ 
                              width: `${Math.min((tokens / Math.max(...usageByDay.map(d => d.tokens))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono w-16 text-right">{tokens}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AISettingsPanel;
