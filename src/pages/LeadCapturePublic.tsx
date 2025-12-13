import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { LeadCaptureForm as LeadCaptureFormType } from "@/hooks/useLeadCaptureForms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CaptureField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

const formatFieldValue = (fields: CaptureField[], values: Record<string, string>) => {
  return fields.reduce<Record<string, string>>((acc, field) => {
    const key = field.label || field.id;
    acc[key] = values[field.id] || "";
    return acc;
  }, {});
};

const LeadCapturePublic = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<LeadCaptureFormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const utmParams = useMemo(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_term: params.get("utm_term") || undefined,
      utm_content: params.get("utm_content") || undefined,
    };
  }, []);

  const trackingData = useMemo(() => ({
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  }), []);

  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) {
        setError("Formulário não encontrado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Check if formId is a UUID or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formId);
        
        let query = (supabase as any)
          .from("lead_capture_forms")
          .select("*")
          .eq("is_active", true);
        
        if (isUUID) {
          query = query.eq("id", formId);
        } else {
          query = query.eq("slug", formId);
        }
        
        const { data, error: fetchError } = await query.maybeSingle();

        if (fetchError) {
          throw fetchError;
        }
        
        if (!data) {
          throw new Error("Formulário não encontrado ou inativo");
        }

        setForm(data as LeadCaptureFormType);
        setValues(() => {
          const initial: Record<string, string> = {};
          (data?.fields || []).forEach((field: CaptureField) => {
            initial[field.id] = "";
          });
          return initial;
        });
      } catch (fetchErr: any) {
        console.error("Erro ao buscar formulário:", fetchErr);
        setError("Não foi possível carregar o formulário. Verifique o link ou tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = formatFieldValue((form.fields || []) as CaptureField[], values);
      const submissionPayload: Record<string, any> = {
        form_id: form.id,
        form_data: payload,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_term: utmParams.utm_term,
        utm_content: utmParams.utm_content,
        status: 'pending',
      };

      if (trackingData.user_agent) {
        submissionPayload.user_agent = trackingData.user_agent;
      }

      if (trackingData.referrer) {
        submissionPayload.referrer = trackingData.referrer;
      }

      // Incrementar view count (ignorar erros)
      try {
        await (supabase as any).rpc('increment_form_view', { form_id: form.id });
      } catch (e) {
        console.log('View count increment skipped');
      }

      const { data, error: submissionError } = await (supabase as any)
        .from("lead_capture_submissions")
        .insert([submissionPayload])
        .select()
        .single();

      if (submissionError) {
        throw submissionError;
      }

      // Processar submissão (ignorar erros)
      try {
        await (supabase as any).rpc('process_lead_capture_submission', { submission_id_param: data.id });
      } catch (processError) {
        console.error("Erro ao processar submissão:", processError);
      }

      setSuccessMessage(form.success_message || "Obrigado! Recebemos suas informações.");
      setValues((prev) => {
        const cleared: Record<string, string> = {};
        Object.keys(prev).forEach((key) => {
          cleared[key] = "";
        });
        return cleared;
      });

      if (form.redirect_url) {
        setTimeout(() => {
          window.location.href = form.redirect_url!;
        }, 1200);
      }
    } catch (submitErr: any) {
      console.error("Erro ao enviar formulário:", submitErr);
      setError(submitErr?.message || "Não foi possível enviar suas informações agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: CaptureField) => {
    const commonProps = {
      id: field.id,
      required: field.required,
      value: values[field.id] || "",
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleChange(field.id, event.target.value),
      placeholder: field.placeholder,
      className: "w-full",
    };

    switch (field.type) {
      case "textarea":
        return <Textarea {...commonProps} rows={4} />;
      case "select":
        return (
          <select {...commonProps} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <option value="">Selecione</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return <Input type={field.type} {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!form || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-3xl font-semibold text-foreground">Formulário indisponível</h1>
          <p className="text-muted-foreground">
            {error || "Este formulário não está mais ativo ou o link está incorreto."}
          </p>
          <Button onClick={() => window.location.replace("/")} variant="secondary">
            Voltar para o início
          </Button>
        </div>
      </div>
    );
  }

  const fields = (form.fields || []) as CaptureField[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-8">
          {form.logo_url && (
            <div className="mb-6 flex justify-center">
              <img src={form.logo_url} alt={form.name} className="h-12 object-contain" />
            </div>
          )}
          <div className="space-y-2 text-center mb-10">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">{(form as any).source || "Formulário"}</p>
            <h1 className="text-3xl font-semibold text-white">{form.title || form.name}</h1>
            {form.subtitle && <p className="text-white/70">{form.subtitle}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="text-white">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-400">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: form.theme_color || "#2563eb" }}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </span>
              ) : (
                form.button_text || "Enviar"
              )}
            </Button>

            {form.redirect_url && (
              <p className="text-center text-xs text-white/60">
                Após enviar, você será redirecionado para outra página.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadCapturePublic;
