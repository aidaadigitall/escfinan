import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

const Configuracoes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    system_name: "FinanceControl",
    system_subtitle: "Controle Financeiro Pessoal",
    logo_url: "",
  });

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

      if (data) {
        setFormData({
          system_name: data.system_name || "FinanceControl",
          system_subtitle: data.system_subtitle || "Controle Financeiro Pessoal",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar configurações:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from("system_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("system_settings")
          .update(formData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("system_settings")
          .insert({ ...formData, user_id: user.id });

        if (error) throw error;
      }

      toast.success("Configurações atualizadas com sucesso!");
      
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
          <CardTitle>White Label</CardTitle>
          <CardDescription>
            Personalize a identidade visual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="system_name">Nome do Sistema</Label>
              <Input
                id="system_name"
                value={formData.system_name}
                onChange={(e) =>
                  setFormData({ ...formData, system_name: e.target.value })
                }
                placeholder="Ex: FinanceControl"
                required
              />
            </div>

            <div>
              <Label htmlFor="system_subtitle">Subtítulo</Label>
              <Input
                id="system_subtitle"
                value={formData.system_subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, system_subtitle: e.target.value })
                }
                placeholder="Ex: Controle Financeiro Pessoal"
                required
              />
            </div>

            <div>
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder="Ex: https://exemplo.com/logo.png"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole a URL completa do seu logo (formato PNG, JPG ou SVG recomendado)
              </p>
            </div>

            {formData.logo_url && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <Label className="mb-2 block">Preview do Logo</Label>
                <img
                  src={formData.logo_url}
                  alt="Preview do logo"
                  className="h-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    toast.error("Não foi possível carregar a imagem do logo");
                  }}
                />
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Configurações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;
