import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LeadCaptureForm {
  id: string;
  user_id: string;
  owner_user_id?: string;
  name: string;
  description?: string;
  slug: string;
  fields: any[];
  default_source?: string;
  default_pipeline_stage_id?: string;
  assign_to_user_id?: string;
  automation_rule_id?: string;
  title?: string;
  subtitle?: string;
  success_message?: string;
  redirect_url?: string;
  button_text: string;
  theme_color: string;
  logo_url?: string;
  background_image_url?: string;
  custom_css?: string;
  is_active: boolean;
  require_double_optin: boolean;
  view_count: number;
  submission_count: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface LeadCaptureSubmission {
  id: string;
  form_id: string;
  lead_id?: string;
  form_data: any;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  status: 'pending' | 'processed' | 'failed' | 'spam';
  error_message?: string;
  submitted_at: string;
  processed_at?: string;
}

export interface CaptureFormFormData {
  name: string;
  description?: string;
  slug: string;
  fields: any[];
  default_source?: string;
  default_pipeline_stage_id?: string;
  assign_to_user_id?: string;
  title?: string;
  subtitle?: string;
  success_message?: string;
  button_text?: string;
  theme_color?: string;
  is_active?: boolean;
}

export const useLeadCaptureForms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar formulários
  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ["lead_capture_forms"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lead_capture_forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as LeadCaptureForm[];
    },
    enabled: !!user,
  });

  // Buscar formulário por slug (público)
  const getFormBySlug = async (slug: string) => {
    const { data, error } = await (supabase as any)
      .from("lead_capture_forms")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    return data as LeadCaptureForm;
  };

  // Buscar submissões de um formulário
  const { data: submissions = [] } = useQuery({
    queryKey: ["lead_capture_submissions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lead_capture_submissions")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as LeadCaptureSubmission[];
    },
    enabled: !!user,
  });

  // Criar formulário
  const createForm = useMutation({
    mutationFn: async (formData: CaptureFormFormData) => {
      const { data, error } = await (supabase as any)
        .from("lead_capture_forms")
        .insert([{
          ...formData,
          user_id: user?.id,
          owner_user_id: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_capture_forms"] });
      toast.success("Formulário criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar formulário: " + error.message);
    },
  });

  // Atualizar formulário
  const updateForm = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CaptureFormFormData> }) => {
      const { data: updated, error } = await (supabase as any)
        .from("lead_capture_forms")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_capture_forms"] });
      toast.success("Formulário atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar formulário: " + error.message);
    },
  });

  // Deletar formulário
  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("lead_capture_forms")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_capture_forms"] });
      toast.success("Formulário deletado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar formulário: " + error.message);
    },
  });

  // Submeter formulário (público)
  const submitForm = useMutation({
    mutationFn: async ({
      formId,
      formData,
      utmParams,
      trackingData
    }: {
      formId: string;
      formData: any;
      utmParams?: any;
      trackingData?: any;
    }) => {
      // Incrementar view count
      await (supabase as any).rpc('increment_form_view', { form_id: formId }).catch(() => {});

      // Criar submissão
      const { data, error } = await (supabase as any)
        .from("lead_capture_submissions")
        .insert([{
          form_id: formId,
          form_data: formData,
          utm_source: utmParams?.utm_source,
          utm_medium: utmParams?.utm_medium,
          utm_campaign: utmParams?.utm_campaign,
          utm_term: utmParams?.utm_term,
          utm_content: utmParams?.utm_content,
          ip_address: trackingData?.ip_address,
          user_agent: trackingData?.user_agent,
          referrer: trackingData?.referrer,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      // Processar submissão (criar lead)
      const { data: leadId, error: processError } = await (supabase as any)
        .rpc('process_lead_capture_submission', { submission_id_param: data.id });

      if (processError) {
        console.error("Erro ao processar submissão:", processError);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Formulário enviado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar formulário: " + error.message);
    },
  });

  // Duplicar formulário
  const duplicateForm = useMutation({
    mutationFn: async (formId: string) => {
      const form = forms.find(f => f.id === formId);
      if (!form) throw new Error("Formulário não encontrado");

      const { data, error } = await (supabase as any)
        .from("lead_capture_forms")
        .insert([{
          user_id: user?.id,
          owner_user_id: user?.id,
          name: `${form.name} (Cópia)`,
          description: form.description,
          slug: `${form.slug}-copy-${Date.now()}`,
          fields: form.fields,
          default_source: form.default_source,
          default_pipeline_stage_id: form.default_pipeline_stage_id,
          title: form.title,
          subtitle: form.subtitle,
          success_message: form.success_message,
          button_text: form.button_text,
          theme_color: form.theme_color,
          is_active: false, // Inicia desativado
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_capture_forms"] });
      toast.success("Formulário duplicado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao duplicar formulário: " + error.message);
    },
  });

  return {
    forms,
    submissions,
    isLoading,
    error,
    getFormBySlug,
    createForm,
    updateForm,
    deleteForm,
    submitForm,
    duplicateForm,
  };
};
