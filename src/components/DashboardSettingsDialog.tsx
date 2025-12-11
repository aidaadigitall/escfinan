import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import {
  Settings,
  Layout,
  Palette,
  Grid,
  Save,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Check,
  Sparkles,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_WIDGETS = [
  { id: 'total-leads', name: 'Total de Leads', category: 'metrics', icon: '👥' },
  { id: 'conversion-rate', name: 'Taxa de Conversão', category: 'metrics', icon: '🎯' },
  { id: 'total-value', name: 'Valor Total', category: 'metrics', icon: '💰' },
  { id: 'average-ticket', name: 'Ticket Médio', category: 'metrics', icon: '🏆' },
  { id: 'funnel-chart', name: 'Funil de Vendas', category: 'charts', icon: '📊' },
  { id: 'conversion-chart', name: 'Conversão por Estágio', category: 'charts', icon: '⚡' },
  { id: 'sources-chart', name: 'Top Fontes de Leads', category: 'charts', icon: '📈' },
  { id: 'score-distribution', name: 'Distribuição de Score', category: 'charts', icon: '🎨' },
  { id: 'timeline-chart', name: 'Timeline (30 dias)', category: 'charts', icon: '📅' },
  { id: 'stage-performance', name: 'Performance por Estágio', category: 'lists', icon: '📋' },
];

const PRESET_THEMES = [
  {
    id: 'blue',
    name: 'Azul Profissional',
    colors: { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa' }
  },
  {
    id: 'purple',
    name: 'Roxo Moderno',
    colors: { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#a78bfa' }
  },
  {
    id: 'green',
    name: 'Verde Crescimento',
    colors: { primary: '#10b981', secondary: '#059669', accent: '#34d399' }
  },
  {
    id: 'orange',
    name: 'Laranja Energia',
    colors: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' }
  },
  {
    id: 'red',
    name: 'Vermelho Ação',
    colors: { primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' }
  },
];

export const DashboardSettingsDialog = ({ open, onOpenChange }: DashboardSettingsDialogProps) => {
  const {
    preferences,
    templates,
    setThemeMode,
    setCustomTheme,
    toggleWidget,
    applyTemplate,
    saveAsTemplate,
    resetToDefault,
    isWidgetEnabled,
    updatePreferences,
  } = useDashboardPreferences();

  const [activeTab, setActiveTab] = useState("layout");
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [customColors, setCustomColors] = useState({
    primary: preferences?.custom_theme?.primary || '#3b82f6',
    secondary: preferences?.custom_theme?.secondary || '#1e40af',
    accent: preferences?.custom_theme?.accent || '#60a5fa',
  });

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      return;
    }

    await saveAsTemplate.mutateAsync({
      name: templateName,
      description: templateDesc,
      isPublic: false,
    });

    setTemplateName("");
    setTemplateDesc("");
  };

  const handleApplyPresetTheme = (colors: any) => {
    setCustomColors(colors);
    setCustomTheme.mutate(colors);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Dashboard
          </DialogTitle>
          <DialogDescription>
            Personalize seu dashboard com widgets, temas e layouts
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="layout" className="gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="widgets" className="gap-2">
              <Grid className="h-4 w-4" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="h-4 w-4" />
              Tema
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Aba: Layout */}
            <TabsContent value="layout" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Visualização</CardTitle>
                  <CardDescription>
                    Ajuste como o dashboard é exibido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label>Modo Compacto</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduz o espaçamento entre widgets
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.compact_mode || false}
                      onCheckedChange={(checked) =>
                        updatePreferences.mutate({ compact_mode: checked })
                      }
                      className="data-[state=checked]:bg-primary scale-75"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label>Mostrar Sidebar</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibe a barra lateral de navegação
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.show_sidebar !== false}
                      onCheckedChange={(checked) =>
                        updatePreferences.mutate({ show_sidebar: checked })
                      }
                      className="data-[state=checked]:bg-primary scale-75"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label>Mostrar Métricas</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibe os cards de métricas no topo
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.show_metrics !== false}
                      onCheckedChange={(checked) =>
                        updatePreferences.mutate({ show_metrics: checked })
                      }
                      className="data-[state=checked]:bg-primary scale-75"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => resetToDefault.mutate()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetar para Padrão
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Widgets */}
            <TabsContent value="widgets" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Widgets Disponíveis</CardTitle>
                  <CardDescription>
                    Ative ou desative widgets no seu dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Métricas */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        📊 Métricas
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {AVAILABLE_WIDGETS.filter(w => w.category === 'metrics').map(widget => (
                          <div
                            key={widget.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xl">{widget.icon}</span>
                              <span className="text-sm font-medium">{widget.name}</span>
                            </div>
                            <Switch
                              checked={isWidgetEnabled(widget.id)}
                              onCheckedChange={() => toggleWidget.mutate(widget.id)}
                              className="data-[state=checked]:bg-primary scale-75"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        📈 Gráficos
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {AVAILABLE_WIDGETS.filter(w => w.category === 'charts').map(widget => (
                          <div
                            key={widget.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xl">{widget.icon}</span>
                              <span className="text-sm font-medium">{widget.name}</span>
                            </div>
                            <Switch
                              checked={isWidgetEnabled(widget.id)}
                              onCheckedChange={() => toggleWidget.mutate(widget.id)}
                              className="data-[state=checked]:bg-primary scale-75"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Listas */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        📋 Listas
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {AVAILABLE_WIDGETS.filter(w => w.category === 'lists').map(widget => (
                          <div
                            key={widget.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xl">{widget.icon}</span>
                              <span className="text-sm font-medium">{widget.name}</span>
                            </div>
                            <Switch
                              checked={isWidgetEnabled(widget.id)}
                              onCheckedChange={() => toggleWidget.mutate(widget.id)}
                              className="data-[state=checked]:bg-primary scale-75"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Tema */}
            <TabsContent value="theme" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Modo de Tema</CardTitle>
                  <CardDescription>
                    Escolha entre modo claro, escuro ou automático
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={preferences?.theme_mode === 'light' ? 'default' : 'outline'}
                      className="h-24 flex-col gap-2"
                      onClick={() => setThemeMode.mutate('light')}
                    >
                      <Sun className="h-6 w-6" />
                      <span>Claro</span>
                      {preferences?.theme_mode === 'light' && (
                        <Check className="h-4 w-4 absolute top-2 right-2" />
                      )}
                    </Button>

                    <Button
                      variant={preferences?.theme_mode === 'dark' ? 'default' : 'outline'}
                      className="h-24 flex-col gap-2"
                      onClick={() => setThemeMode.mutate('dark')}
                    >
                      <Moon className="h-6 w-6" />
                      <span>Escuro</span>
                      {preferences?.theme_mode === 'dark' && (
                        <Check className="h-4 w-4 absolute top-2 right-2" />
                      )}
                    </Button>

                    <Button
                      variant={preferences?.theme_mode === 'auto' ? 'default' : 'outline'}
                      className="h-24 flex-col gap-2"
                      onClick={() => setThemeMode.mutate('auto')}
                    >
                      <Monitor className="h-6 w-6" />
                      <span>Auto</span>
                      {preferences?.theme_mode === 'auto' && (
                        <Check className="h-4 w-4 absolute top-2 right-2" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Temas Predefinidos</CardTitle>
                  <CardDescription>
                    Escolha um esquema de cores pronto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {PRESET_THEMES.map(theme => (
                      <Button
                        key={theme.id}
                        variant="outline"
                        className="h-auto p-4 flex items-center justify-between"
                        onClick={() => handleApplyPresetTheme(theme.colors)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.colors.primary }}
                            />
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.colors.secondary }}
                            />
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: theme.colors.accent }}
                            />
                          </div>
                          <span className="font-medium">{theme.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cores Personalizadas</CardTitle>
                  <CardDescription>
                    Crie seu próprio esquema de cores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <Input
                        type="color"
                        value={customColors.primary}
                        onChange={(e) =>
                          setCustomColors({ ...customColors, primary: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <Input
                        type="color"
                        value={customColors.secondary}
                        onChange={(e) =>
                          setCustomColors({ ...customColors, secondary: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cor de Destaque</Label>
                      <Input
                        type="color"
                        value={customColors.accent}
                        onChange={(e) =>
                          setCustomColors({ ...customColors, accent: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setCustomTheme.mutate(customColors)}
                  >
                    Aplicar Cores Personalizadas
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Templates */}
            <TabsContent value="templates" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Templates do Sistema</CardTitle>
                  <CardDescription>
                    Layouts pré-configurados para diferentes necessidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {templates.filter(t => t.is_system).map(template => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {template.category && (
                              <Badge variant="outline">{template.category}</Badge>
                            )}
                            <Badge variant="secondary">
                              {template.usage_count} usos
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => applyTemplate.mutate(template.id)}
                        >
                          Aplicar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {templates.filter(t => !t.is_system).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Meus Templates</CardTitle>
                    <CardDescription>
                      Templates personalizados que você criou
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {templates.filter(t => !t.is_system).map(template => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            {template.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => applyTemplate.mutate(template.id)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Salvar Layout Atual</CardTitle>
                  <CardDescription>
                    Salve seu layout atual como um template reutilizável
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Template</Label>
                    <Input
                      placeholder="Ex: Meu Dashboard Personalizado"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      placeholder="Descreva este layout..."
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar como Template
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
