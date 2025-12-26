import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useCurrentUserPermissions } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X, Database, Building2, Image, ArrowRightLeft, ShieldAlert, History, Globe, Hash, Bot } from "lucide-react";
import { AISettingsPanel } from "@/components/AISettingsPanel";
import { DataManagementDialog } from "@/components/DataManagementDialog";
import { DataMigrationDialog } from "@/components/DataMigrationDialog";
import { MaskedInput } from "@/components/ui/masked-input";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const Configuracoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { permissions, isLoading: loadingPermissions } = useCurrentUserPermissions();
  const { companySettings, isLoading: loadingSettings, saveCompanySettings } = useCompanySettings();
  const [loading, setLoading] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingSidebar, setUploadingSidebar] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [dataMigrationOpen, setDataMigrationOpen] = useState(false);
  
  const [companyData, setCompanyData] = useState({
    company_name: "",
    trading_name: "",
    cnpj: "",
    ie: "",
    im: "",
    phone: "",
    phone2: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    warranty_terms: "",
    logo_header_url: "",
    logo_sidebar_url: "",
    favicon_url: "",
    next_quote_number: 1,
    next_service_order_number: 1,
    next_sale_number: 1,
  });

  const [headerPreview, setHeaderPreview] = useState("");
  const [sidebarPreview, setSidebarPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [sidebarFile, setSidebarFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  
  const headerInputRef = useRef<HTMLInputElement>(null);
  const sidebarInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (companySettings) {
      setCompanyData({
        company_name: companySettings.company_name || "",
        trading_name: companySettings.trading_name || "",
        cnpj: companySettings.cnpj || "",
        ie: companySettings.ie || "",
        im: companySettings.im || "",
        phone: companySettings.phone || "",
        phone2: companySettings.phone2 || "",
        email: companySettings.email || "",
        website: companySettings.website || "",
        address: companySettings.address || "",
        city: companySettings.city || "",
        state: companySettings.state || "",
        zipcode: companySettings.zipcode || "",
        warranty_terms: companySettings.warranty_terms || "",
        logo_header_url: companySettings.logo_header_url || "",
        logo_sidebar_url: companySettings.logo_sidebar_url || "",
        favicon_url: companySettings.favicon_url || "",
        next_quote_number: companySettings.next_quote_number || 1,
        next_service_order_number: companySettings.next_service_order_number || 1,
        next_sale_number: companySettings.next_sale_number || 1,
      });
      setHeaderPreview(companySettings.logo_header_url || "");
      setSidebarPreview(companySettings.logo_sidebar_url || "");
      setFaviconPreview(companySettings.favicon_url || "");
    }
  }, [companySettings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "header" | "sidebar" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida (PNG ou JPEG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    const preview = URL.createObjectURL(file);
    if (type === "header") {
      setHeaderFile(file);
      setHeaderPreview(preview);
    } else if (type === "sidebar") {
      setSidebarFile(file);
      setSidebarPreview(preview);
    } else {
      setFaviconFile(file);
      setFaviconPreview(preview);
    }
  };

  const uploadLogo = async (file: File, type: "header" | "sidebar" | "favicon") => {
    if (!user) return null;

    const setUploading = type === "header" ? setUploadingHeader : type === "sidebar" ? setUploadingSidebar : setUploadingFavicon;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = (type: "header" | "sidebar" | "favicon") => {
    if (type === "header") {
      setHeaderFile(null);
      setHeaderPreview("");
      setCompanyData({ ...companyData, logo_header_url: "" });
      if (headerInputRef.current) headerInputRef.current.value = "";
    } else if (type === "sidebar") {
      setSidebarFile(null);
      setSidebarPreview("");
      setCompanyData({ ...companyData, logo_sidebar_url: "" });
      if (sidebarInputRef.current) sidebarInputRef.current.value = "";
    } else {
      setFaviconFile(null);
      setFaviconPreview("");
      setCompanyData({ ...companyData, favicon_url: "" });
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let headerUrl = companyData.logo_header_url;
      let sidebarUrl = companyData.logo_sidebar_url;
      let faviconUrl = companyData.favicon_url;

      if (headerFile) {
        const uploadedUrl = await uploadLogo(headerFile, "header");
        if (uploadedUrl) headerUrl = uploadedUrl;
      }

      if (sidebarFile) {
        const uploadedUrl = await uploadLogo(sidebarFile, "sidebar");
        if (uploadedUrl) sidebarUrl = uploadedUrl;
      }

      if (faviconFile) {
        const uploadedUrl = await uploadLogo(faviconFile, "favicon");
        if (uploadedUrl) faviconUrl = uploadedUrl;
      }

      saveCompanySettings({
        ...companyData,
        logo_header_url: headerUrl,
        logo_sidebar_url: sidebarUrl,
        favicon_url: faviconUrl,
      });

      // Update favicon in the document
      if (faviconUrl) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = faviconUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
        localStorage.setItem("favicon_url", faviconUrl);
      }

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = async (value: string) => {
    const cepNumbers = value.replace(/\D/g, "");
    setCompanyData({ ...companyData, zipcode: value });

    if (cepNumbers.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setCompanyData((prev) => ({
            ...prev,
            address: data.logradouro,
            city: data.localidade,
            state: data.uf,
          }));
          toast.success("CEP encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  if (loadingSettings || loadingPermissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user has permission to view settings
  if (!permissions.can_view_settings) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acesso Negado</h2>
        <p className="text-muted-foreground text-center">
          Você não tem permissão para acessar as configurações do sistema.
        </p>
        <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const canManage = permissions.can_manage_settings;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Configure os dados da sua empresa e personalize o sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informações que aparecem em documentos e relatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Razão Social</Label>
                <Input
                  value={companyData.company_name}
                  onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                  placeholder="Razão Social da empresa"
                />
              </div>
              <div>
                <Label>Nome Fantasia</Label>
                <Input
                  value={companyData.trading_name}
                  onChange={(e) => setCompanyData({ ...companyData, trading_name: e.target.value })}
                  placeholder="Nome Fantasia"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>CNPJ</Label>
                <MaskedInput
                  mask="cnpj"
                  value={companyData.cnpj}
                  onChange={(value) => setCompanyData({ ...companyData, cnpj: value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label>Inscrição Estadual</Label>
                <Input
                  value={companyData.ie}
                  onChange={(e) => setCompanyData({ ...companyData, ie: e.target.value })}
                  placeholder="Inscrição Estadual"
                />
              </div>
              <div>
                <Label>Inscrição Municipal</Label>
                <Input
                  value={companyData.im}
                  onChange={(e) => setCompanyData({ ...companyData, im: e.target.value })}
                  placeholder="Inscrição Municipal"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Telefone Principal</Label>
                <MaskedInput
                  mask="phone"
                  value={companyData.phone}
                  onChange={(value) => setCompanyData({ ...companyData, phone: value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Telefone Secundário</Label>
                <MaskedInput
                  mask="phone"
                  value={companyData.phone2}
                  onChange={(value) => setCompanyData({ ...companyData, phone2: value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  placeholder="www.empresa.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>CEP</Label>
                <MaskedInput
                  mask="cep"
                  value={companyData.zipcode}
                  onChange={(value) => handleCepChange(value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-3">
                <Label>Endereço</Label>
                <Input
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={companyData.city}
                  onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={companyData.state}
                  onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label>Termos de Garantia Padrão</Label>
              <Textarea
                value={companyData.warranty_terms}
                onChange={(e) => setCompanyData({ ...companyData, warranty_terms: e.target.value })}
                placeholder="Termos de garantia que aparecerão nos documentos"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logos do Sistema
            </CardTitle>
            <CardDescription>
              Personalize as logos do sistema (Header e Sidebar)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">Logo do Header (formato horizontal)</Label>
                <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => handleFileSelect(e, "header")}
                  className="hidden"
                />
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => headerInputRef.current?.click()}
                    className="w-full rounded-xl"
                    disabled={uploadingHeader}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Logo Header
                  </Button>
                  {headerPreview && (
                    <div className="p-4 border rounded-xl bg-muted/50 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveLogo("header")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center justify-center h-20">
                        <img
                          src={headerPreview}
                          alt="Logo Header"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Logo da Sidebar (formato quadrado)</Label>
                <input
                  ref={sidebarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => handleFileSelect(e, "sidebar")}
                  className="hidden"
                />
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => sidebarInputRef.current?.click()}
                    className="w-full rounded-xl"
                    disabled={uploadingSidebar}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Logo Sidebar
                  </Button>
                  {sidebarPreview && (
                    <div className="p-4 border rounded-xl bg-muted/50 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveLogo("sidebar")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center justify-center h-20">
                        <img
                          src={sidebarPreview}
                          alt="Logo Sidebar"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PNG ou JPEG (máximo 5MB cada)
            </p>
          </CardContent>
        </Card>

        {/* Favicon Card */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Favicon do Sistema
            </CardTitle>
            <CardDescription>
              Ícone que aparece na aba do navegador (formato quadrado, recomendado 32x32 ou 64x64 pixels)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/x-icon,image/ico"
              onChange={(e) => handleFileSelect(e, "favicon")}
              className="hidden"
            />
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => faviconInputRef.current?.click()}
                className="w-full rounded-xl"
                disabled={uploadingFavicon}
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Favicon
              </Button>
              {faviconPreview && (
                <div className="p-4 border rounded-xl bg-muted/50 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveLogo("favicon")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-center h-16">
                    <img
                      src={faviconPreview}
                      alt="Favicon"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PNG, JPEG ou ICO (máximo 5MB)
            </p>
          </CardContent>
        </Card>

        {/* Numeração de Documentos */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Numeração de Documentos
            </CardTitle>
            <CardDescription>
              Configure o próximo número sequencial para orçamentos, ordens de serviço e vendas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Próximo Orçamento (ORC-)</Label>
                <Input
                  type="number"
                  min={1}
                  value={companyData.next_quote_number}
                  onChange={(e) => setCompanyData({ ...companyData, next_quote_number: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  disabled={!canManage}
                />
              </div>
              <div>
                <Label>Próxima OS (OS-)</Label>
                <Input
                  type="number"
                  min={1}
                  value={companyData.next_service_order_number}
                  onChange={(e) => setCompanyData({ ...companyData, next_service_order_number: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  disabled={!canManage}
                />
              </div>
              <div>
                <Label>Próxima Venda (PED-)</Label>
                <Input
                  type="number"
                  min={1}
                  value={companyData.next_sale_number}
                  onChange={(e) => setCompanyData({ ...companyData, next_sale_number: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  disabled={!canManage}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Atenção: Alterar esses valores pode causar duplicação de números se você definir um valor já utilizado.
            </p>
          </CardContent>
        </Card>

        {canManage && (
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || uploadingHeader || uploadingSidebar || uploadingFavicon} className="rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        )}
      </form>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerenciamento de Dados
          </CardTitle>
          <CardDescription>
            Backup, importação e exclusão de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            onClick={() => setDataManagementOpen(true)}
            className="w-full rounded-xl"
            disabled={!canManage}
          >
            <Database className="mr-2 h-4 w-4" />
            Backup e Restauração
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setDataMigrationOpen(true)}
            className="w-full rounded-xl"
            disabled={!canManage}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Migrar Dados de Outro Sistema
          </Button>
        </CardContent>
      </Card>

      {/* AI Settings Panel - Only visible for admins */}
      {canManage && <AISettingsPanel />}

      <SettingsAuditLog />

      <DataManagementDialog 
        open={dataManagementOpen} 
        onOpenChange={setDataManagementOpen} 
      />

      <DataMigrationDialog
        open={dataMigrationOpen}
        onOpenChange={setDataMigrationOpen}
      />
    </div>
  );
};

const fieldLabels: Record<string, string> = {
  company_name: "Razão Social",
  trading_name: "Nome Fantasia",
  cnpj: "CNPJ",
  ie: "Inscrição Estadual",
  im: "Inscrição Municipal",
  phone: "Telefone Principal",
  phone2: "Telefone Secundário",
  email: "Email",
  website: "Website",
  address: "Endereço",
  city: "Cidade",
  state: "Estado",
  zipcode: "CEP",
  logo_header_url: "Logo Header",
  logo_sidebar_url: "Logo Sidebar",
  warranty_terms: "Termos de Garantia",
  favicon_url: "Favicon",
  next_quote_number: "Próximo Nº Orçamento",
  next_service_order_number: "Próximo Nº OS",
  next_sale_number: "Próximo Nº Venda",
};

const SettingsAuditLog = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["company_settings_audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings_audit")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
        <CardDescription>
          Registro de todas as alterações realizadas nas configurações
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs && auditLogs.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Valor Anterior</TableHead>
                  <TableHead>Novo Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.changed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{log.user_name || "Sistema"}</TableCell>
                    <TableCell>{fieldLabels[log.changed_field] || log.changed_field}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={log.old_value}>
                      {log.old_value || "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={log.new_value}>
                      {log.new_value || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma alteração registrada ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Configuracoes;
