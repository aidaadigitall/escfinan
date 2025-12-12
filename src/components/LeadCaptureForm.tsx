import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeadSources } from "@/hooks/useLeadSources";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import {
  Code,
  Copy,
  ExternalLink,
  Settings,
  Share2,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface CaptureField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface CaptureFormConfig {
  id: string;
  name: string;
  description?: string;
  fields: CaptureField[];
  source_id?: string;
  stage_id?: string;
  redirect_url?: string;
  success_message?: string;
  is_active: boolean;
  created_at: string;
}

export const LeadCaptureForm = () => {
  const { sources = [] } = useLeadSources();
  const { stages = [] } = usePipelineStages();
  
  const [forms, setForms] = useState<CaptureFormConfig[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<CaptureFormConfig | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState<string | null>(null);

  // Formulário padrão para criar novo
  const getDefaultForm = (): Omit<CaptureFormConfig, 'id' | 'created_at'> => ({
    name: 'Novo Formulário',
    description: '',
    fields: [
      { id: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome completo' },
      { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'seu@email.com' },
      { id: 'phone', label: 'Telefone', type: 'tel', required: false, placeholder: '(00) 00000-0000' },
    ],
    source_id: sources[0]?.id,
    stage_id: stages[0]?.id,
    redirect_url: '',
    success_message: 'Obrigado! Entraremos em contato em breve.',
    is_active: true,
  });

  const handleCreateForm = () => {
    setSelectedForm(null);
    setIsDialogOpen(true);
  };

  const handleEditForm = (form: CaptureFormConfig) => {
    setSelectedForm(form);
    setIsDialogOpen(true);
  };

  const handleSaveForm = () => {
    // TODO: Implementar salvamento no Supabase
    toast.success("Formulário salvo com sucesso!");
    setIsDialogOpen(false);
  };

  const handleDeleteForm = (formId: string) => {
    // TODO: Implementar exclusão
    setForms(forms.filter(f => f.id !== formId));
    toast.success("Formulário excluído");
  };

  const generateEmbedCode = (form: CaptureFormConfig) => {
    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}/api/lead-capture/${form.id}`;
    
    return `<!-- Formulário de Captura: ${form.name} -->
<script src="${baseUrl}/capture.js"></script>
<div id="lead-capture-${form.id}"></div>
<script>
  LeadCapture.render('#lead-capture-${form.id}', {
    formId: '${form.id}',
    theme: 'light',
    onSuccess: function(response) {
      console.log('Lead capturado:', response);
    }
  });
</script>`;
  };

  const copyEmbedCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência!");
  };

  const getPublicLink = (formId: string) => {
    return `${window.location.origin}/capture/${formId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Formulários de Captura</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie formulários para capturar leads automaticamente
          </p>
        </div>
        <Button onClick={handleCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Formulário
        </Button>
      </div>

      {/* Lista de formulários ou estado vazio */}
      {forms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">Nenhum formulário criado</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Crie formulários personalizados para capturar leads do seu site, landing pages ou campanhas
              </p>
              <Button onClick={handleCreateForm} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Formulário
              </Button>
            </div>

            {/* Templates rápidos */}
            <div className="mt-8 pt-8 border-t">
              <h5 className="font-semibold mb-4">Templates Prontos</h5>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">📋 Contato Simples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Nome, email e telefone
                    </p>
                    <Badge variant="secondary">3 campos</Badge>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">💼 B2B Completo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Dados da empresa e cargo
                    </p>
                    <Badge variant="secondary">6 campos</Badge>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">🎯 Evento/Webinar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Inscrição otimizada
                    </p>
                    <Badge variant="secondary">4 campos</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{form.name}</CardTitle>
                      <Badge variant={form.is_active ? "default" : "secondary"}>
                        {form.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground">{form.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmbedCode(form.id)}
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Código
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getPublicLink(form.id), '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditForm(form)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteForm(form.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{form.fields.length} campos</span>
                  <span>•</span>
                  <span>0 submissões hoje</span>
                  <span>•</span>
                  <span>Link: <code className="text-xs">{getPublicLink(form.id)}</code></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de código embed */}
      {showEmbedCode && (
        <Dialog open={!!showEmbedCode} onOpenChange={() => setShowEmbedCode(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Código de Incorporação</DialogTitle>
              <DialogDescription>
                Copie e cole este código no seu site para adicionar o formulário
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="embed">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="embed">Código HTML</TabsTrigger>
                <TabsTrigger value="link">Link Direto</TabsTrigger>
              </TabsList>
              <TabsContent value="embed" className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{generateEmbedCode(forms.find(f => f.id === showEmbedCode)!)}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyEmbedCode(generateEmbedCode(forms.find(f => f.id === showEmbedCode)!))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="link" className="space-y-4">
                <div>
                  <Label>URL Pública do Formulário</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      readOnly
                      value={getPublicLink(showEmbedCode)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(getPublicLink(showEmbedCode));
                        toast.success("Link copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Compartilhe este link em emails, redes sociais ou QR codes
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de criar/editar formulário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedForm ? 'Editar Formulário' : 'Novo Formulário de Captura'}
            </DialogTitle>
            <DialogDescription>
              Configure os campos e integrações do seu formulário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div>
                <Label>Nome do Formulário</Label>
                <Input placeholder="Ex: Formulário de Contato - Site Principal" />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea 
                  placeholder="Descrição interna para identificar este formulário"
                  rows={2}
                />
              </div>
            </div>

            {/* Configurações de integração */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Integração com Pipeline</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Origem do Lead</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(source => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estágio Inicial</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estágio" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Campos do formulário */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Campos do Formulário</h4>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-3 w-3" />
                  Adicionar Campo
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Nome</p>
                    <p className="text-xs text-muted-foreground">Campo de texto obrigatório</p>
                  </div>
                  <Badge>Obrigatório</Badge>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-xs text-muted-foreground">Campo de email obrigatório</p>
                  </div>
                  <Badge>Obrigatório</Badge>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Configurações pós-submissão */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Após Submissão</h4>
              <div>
                <Label>Mensagem de Sucesso</Label>
                <Textarea 
                  placeholder="Obrigado! Entraremos em contato em breve."
                  rows={2}
                />
              </div>
              <div>
                <Label>URL de Redirecionamento (opcional)</Label>
                <Input placeholder="https://seusite.com/obrigado" />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Switch />
              <div>
                <Label>Formulário Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Desative para parar de receber submissões
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveForm}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Salvar Formulário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
