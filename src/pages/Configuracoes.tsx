import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const Configuracoes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data && data.logo_url) {
        setLogoUrl(data.logo_url);
        setPreviewUrl(data.logo_url);
      }
    } catch (error: any) {
      console.error("Erro ao buscar configurações:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida (PNG ou JPEG)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setLogoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setPreviewUrl("");
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !user) return logoUrl;

    setUploading(true);
    try {
      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('logos')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Erro ao fazer upload da logo:", error);
      toast.error("Erro ao fazer upload da imagem");
      return logoUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Upload logo if a new file was selected
      const uploadedLogoUrl = await uploadLogo();

      const updateData = {
        system_name: "FinanceControl",
        system_subtitle: "Controle Financeiro Pessoal",
        logo_url: uploadedLogoUrl || null,
      };

      const { data: existing } = await supabase
        .from("system_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("system_settings")
          .update(updateData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("system_settings")
          .insert({ ...updateData, user_id: user.id });

        if (error) throw error;
      }

      toast.success("Logo atualizada com sucesso!");
      
      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      toast.error(error.message || "Erro ao atualizar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Personalize o sistema com suas preferências
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logo do Sistema</CardTitle>
          <CardDescription>
            Personalize a logo que aparece no cabeçalho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="logo">Upload da Logo</Label>
              <input
                ref={fileInputRef}
                type="file"
                id="logo"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="mt-2 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Imagem
                </Button>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PNG ou JPEG (máximo 5MB)
                </p>
              </div>
            </div>

            {previewUrl && (
              <div className="p-4 border rounded-lg bg-muted/50 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Label className="mb-2 block">Preview da Logo</Label>
                <div className="flex items-center justify-center h-24">
                  <img
                    src={previewUrl}
                    alt="Preview da logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading || uploading}>
                {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? "Enviando..." : "Salvar Logo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;
