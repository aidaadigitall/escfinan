import { useState, useEffect, useCallback } from "react";
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
import { useLeadCaptureForms, CaptureFormFormData } from "@/hooks/useLeadCaptureForms";
import {
  Code,
  Copy,
  ExternalLink,
  Settings,
  Share2,
  Plus,
  Trash2,
  Loader2,
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

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
};

const FIELD_TYPE_LABELS: Record<CaptureField['type'], string> = {
  text: 'Campo de texto',
  email: 'Campo de email',
  tel: 'Campo de telefone',
  textarea: 'Área de texto',
  select: 'Lista de opções',
};

export const LeadCaptureForm = () => {
  const { sources = [] } = useLeadSources();
  const { stages = [] } = usePipelineStages();
  const { 
    forms, 
    isLoading, 
    createForm, 
    updateForm, 
    deleteForm 
  } = useLeadCaptureForms();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState<string | null>(null);

  const selectedForm = selectedFormId ? forms.find(f => f.id === selectedFormId) : null;

  const buildDefaultFormData = useCallback((): CaptureFormFormData => ({
    name: 'Novo Formulário',
    description: '',
    slug: generateSlug('novo-formulario'),
    fields: [
      { id: generateId(), label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome completo' },
      { id: generateId(), label: 'Email', type: 'email', required: true, placeholder: 'seu@email.com' },
      { id: generateId(), label: 'Telefone', type: 'tel', required: false, placeholder: '(00) 00000-0000' },
    ],
    default_source: sources[0]?.name,
    default_pipeline_stage_id: stages[0]?.id,
    title: '',
    subtitle: '',
    success_message: 'Obrigado! Entraremos em contato em breve.',
    button_text: 'Enviar',
    theme_color: '#2563eb',
    is_active: true,
  }), [sources, stages]);

  const [formData, setFormData] = useState<CaptureFormFormData>(() => buildDefaultFormData());

  useEffect(() => {
    if (!isDialogOpen) return;

    if (selectedForm) {
      setFormData({
        name: selectedForm.name,
        description: selectedForm.description || '',
        slug: selectedForm.slug,
        fields: (selectedForm.fields || []).map((field: any) => ({
          ...field,
          options: field.options ? [...field.options] : [],
        })),
        default_source: selectedForm.default_source || '',
        default_pipeline_stage_id: selectedForm.default_pipeline_stage_id || undefined,
        title: selectedForm.title || '',
        subtitle: selectedForm.subtitle || '',
        success_message: selectedForm.success_message || '',
        button_text: selectedForm.button_text || 'Enviar',
        theme_color: selectedForm.theme_color || '#2563eb',
        is_active: selectedForm.is_active,
      });
    } else {
      setFormData(buildDefaultFormData());
    }
  }, [isDialogOpen, selectedForm, buildDefaultFormData]);

  const handleCreateForm = () => {
    setSelectedFormId(null);
    setIsDialogOpen(true);
  };

  const handleEditForm = (formId: string) => {
    setSelectedFormId(formId);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedFormId(null);
    }
  };

  const handleSaveForm = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome do formulário é obrigatório");
      return;
    }

    try {
      if (selectedFormId) {
        await updateForm.mutateAsync({ id: selectedFormId, data: formData });
      } else {
        await createForm.mutateAsync({
          ...formData,
          slug: generateSlug(formData.name),
        });
      }
      setIsDialogOpen(false);
      setSelectedFormId(null);
    } catch (error) {
      console.error("Error saving form:", error);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Tem certeza que deseja excluir este formulário?")) return;
    try {
      await deleteForm.mutateAsync(formId);
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  const handleFieldChange = (fieldId: string, updates: Partial<CaptureField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((field: any) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  };

  const handleAddField = () => {
    setFormData((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: generateId(),
          label: `Campo ${prev.fields.length + 1}`,
          type: 'text' as const,
          required: false,
          placeholder: 'Digite aqui',
          options: [],
        },
      ],
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((field: any) => field.id !== fieldId),
    }));
  };

  const generateEmbedCode = (formId: string, formName: string) => {
    const baseUrl = window.location.origin;
    
    return `<!-- Formulário de Captura: ${formName} -->
<iframe 
  src="${baseUrl}/capture/${formId}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none; max-width: 600px;">
</iframe>`;
  };

  const copyEmbedCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência!");
  };

  const getPublicLink = (formId: string) => {
    return `${window.location.origin}/capture/${formId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                  setFormData({
                    ...buildDefaultFormData(),
                    name: 'Contato Simples',
                  });
                  setIsDialogOpen(true);
                }}>
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

                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                  setFormData({
                    ...buildDefaultFormData(),
                    name: 'B2B Completo',
                    fields: [
                      { id: generateId(), label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
                      { id: generateId(), label: 'Email', type: 'email', required: true, placeholder: 'seu@email.com' },
                      { id: generateId(), label: 'Telefone', type: 'tel', required: false, placeholder: '(00) 00000-0000' },
                      { id: generateId(), label: 'Empresa', type: 'text', required: true, placeholder: 'Nome da empresa' },
                      { id: generateId(), label: 'Cargo', type: 'text', required: false, placeholder: 'Seu cargo' },
                      { id: generateId(), label: 'Mensagem', type: 'textarea', required: false, placeholder: 'Descreva sua necessidade' },
                    ],
                  });
                  setIsDialogOpen(true);
                }}>
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

                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                  setFormData({
                    ...buildDefaultFormData(),
                    name: 'Evento/Webinar',
                    fields: [
                      { id: generateId(), label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
                      { id: generateId(), label: 'Email', type: 'email', required: true, placeholder: 'seu@email.com' },
                      { id: generateId(), label: 'WhatsApp', type: 'tel', required: true, placeholder: '(00) 00000-0000' },
                      { id: generateId(), label: 'Como conheceu?', type: 'select', required: false, placeholder: '', options: ['Instagram', 'LinkedIn', 'Google', 'Indicação', 'Outro'] },
                    ],
                  });
                  setIsDialogOpen(true);
                }}>
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
                      onClick={() => handleEditForm(form.id)}
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
                  <span>{(form.fields as any[])?.length || 0} campos</span>
                  <span>•</span>
                  <span>{form.submission_count || 0} submissões</span>
                  <span>•</span>
                  <span>Link: <code className="text-xs bg-muted px-1 py-0.5 rounded">{getPublicLink(form.id)}</code></span>
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
            <Tabs defaultValue="link">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Link Direto</TabsTrigger>
                <TabsTrigger value="embed">Código HTML</TabsTrigger>
              </TabsList>
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
              <TabsContent value="embed" className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{generateEmbedCode(showEmbedCode, forms.find(f => f.id === showEmbedCode)?.name || '')}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyEmbedCode(generateEmbedCode(showEmbedCode, forms.find(f => f.id === showEmbedCode)?.name || ''))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de criar/editar formulário */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFormId ? 'Editar Formulário' : 'Novo Formulário de Captura'}
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
                <Input
                  placeholder="Ex: Formulário de Contato - Site Principal"
                  value={formData?.name || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Descrição interna para identificar este formulário"
                  rows={2}
                  value={formData?.description || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título do Formulário (exibido ao usuário)</Label>
                  <Input
                    placeholder="Ex: Entre em contato"
                    value={formData?.title || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Subtítulo (opcional)</Label>
                  <Input
                    placeholder="Ex: Preencha o formulário abaixo"
                    value={formData?.subtitle || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, subtitle: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Configurações de integração */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Integração com Pipeline</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Origem do Lead</Label>
                  <Select
                    value={formData?.default_source || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, default_source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(source => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estágio Inicial</Label>
                  <Select
                    value={formData?.default_pipeline_stage_id || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, default_pipeline_stage_id: value }))
                    }
                  >
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
                <Button variant="outline" size="sm" onClick={handleAddField}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Campo
                </Button>
              </div>

              <div className="space-y-3">
                {formData?.fields?.map((field: any, index: number) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <Label>Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => handleFieldChange(field.id, { label: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Tipo</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: any) => handleFieldChange(field.id, { type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(field.id)}
                          disabled={formData.fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => handleFieldChange(field.id, { placeholder: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => handleFieldChange(field.id, { required: checked })}
                          />
                          <Label>Obrigatório</Label>
                        </div>
                      </div>

                      {field.type === 'select' && (
                        <div>
                          <Label>Opções (separadas por vírgula)</Label>
                          <Input
                            value={(field.options || []).join(', ')}
                            onChange={(e) => handleFieldChange(field.id, { 
                              options: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                            })}
                            placeholder="Opção 1, Opção 2, Opção 3"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Configurações pós-submissão */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Após o Envio</h4>
              <div className="space-y-4">
                <div>
                  <Label>Mensagem de Sucesso</Label>
                  <Textarea
                    rows={2}
                    value={formData?.success_message || ""}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, success_message: event.target.value }))
                    }
                    placeholder="Obrigado! Entraremos em contato em breve."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Texto do Botão</Label>
                    <Input
                      value={formData?.button_text || "Enviar"}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, button_text: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Cor do Tema</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData?.theme_color || "#2563eb"}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, theme_color: event.target.value }))
                        }
                        className="w-16 p-1 h-10"
                      />
                      <Input
                        value={formData?.theme_color || "#2563eb"}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, theme_color: event.target.value }))
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData?.is_active ?? true}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label>Formulário Ativo</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveForm}
              disabled={createForm.isPending || updateForm.isPending}
            >
              {(createForm.isPending || updateForm.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedFormId ? 'Salvar Alterações' : 'Criar Formulário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
