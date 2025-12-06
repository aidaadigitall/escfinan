import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X, Database, Building2, Image } from "lucide-react";
import { DataManagementDialog } from "@/components/DataManagementDialog";
import { MaskedInput } from "@/components/ui/masked-input";

const Configuracoes = () => {
  const { user } = useAuth();
  const { companySettings, isLoading: loadingSettings, saveCompanySettings } = useCompanySettings();
  const [loading, setLoading] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingSidebar, setUploadingSidebar] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  
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
  });

  const [headerPreview, setHeaderPreview] = useState("");
  const [sidebarPreview, setSidebarPreview] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [sidebarFile, setSidebarFile] = useState<File | null>(null);
  
  const headerInputRef = useRef<HTMLInputElement>(null);
  const sidebarInputRef = useRef<HTMLInputElement>(null);

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
      });
      setHeaderPreview(companySettings.logo_header_url || "");
      setSidebarPreview(companySettings.logo_sidebar_url || "");
    }
  }, [companySettings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "header" | "sidebar") => {
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
    } else {
      setSidebarFile(file);
      setSidebarPreview(preview);
    }
  };

  const uploadLogo = async (file: File, type: "header" | "sidebar") => {
    if (!user) return null;

    const setUploading = type === "header" ? setUploadingHeader : setUploadingSidebar;
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

  const handleRemoveLogo = (type: "header" | "sidebar") => {
    if (type === "header") {
      setHeaderFile(null);
      setHeaderPreview("");
      setCompanyData({ ...companyData, logo_header_url: "" });
      if (headerInputRef.current) headerInputRef.current.value = "";
    } else {
      setSidebarFile(null);
      setSidebarPreview("");
      setCompanyData({ ...companyData, logo_sidebar_url: "" });
      if (sidebarInputRef.current) sidebarInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let headerUrl = companyData.logo_header_url;
      let sidebarUrl = companyData.logo_sidebar_url;

      if (headerFile) {
        const uploadedUrl = await uploadLogo(headerFile, "header");
        if (uploadedUrl) headerUrl = uploadedUrl;
      }

      if (sidebarFile) {
        const uploadedUrl = await uploadLogo(sidebarFile, "sidebar");
        if (uploadedUrl) sidebarUrl = uploadedUrl;
      }

      saveCompanySettings({
        ...companyData,
        logo_header_url: headerUrl,
        logo_sidebar_url: sidebarUrl,
      });

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

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

        <div className="flex justify-end">
          <Button type="submit" disabled={loading || uploadingHeader || uploadingSidebar} className="rounded-xl">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
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
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => setDataManagementOpen(true)}
            className="w-full rounded-xl"
          >
            <Database className="mr-2 h-4 w-4" />
            Abrir Gerenciamento de Dados
          </Button>
        </CardContent>
      </Card>

      <DataManagementDialog 
        open={dataManagementOpen} 
        onOpenChange={setDataManagementOpen} 
      />
    </div>
  );
};

export default Configuracoes;
