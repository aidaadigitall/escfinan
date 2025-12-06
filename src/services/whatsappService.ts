import { supabase } from "@/integrations/supabase/client";

interface SendWhatsAppParams {
  to: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
}

export const sendWhatsAppMessage = async (params: SendWhatsAppParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: params
    });

    if (error) {
      console.error('Error invoking WhatsApp function:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

export const sendTaskNotification = async (
  phoneNumber: string,
  taskTitle: string,
  dueDate?: string,
  assignedBy?: string
) => {
  const message = dueDate
    ? `📋 Nova tarefa atribuída: "${taskTitle}"\n📅 Vencimento: ${dueDate}${assignedBy ? `\n👤 Atribuída por: ${assignedBy}` : ''}`
    : `📋 Nova tarefa atribuída: "${taskTitle}"${assignedBy ? `\n👤 Atribuída por: ${assignedBy}` : ''}`;

  return sendWhatsAppMessage({
    to: phoneNumber,
    message
  });
};

export const sendTaskReminderNotification = async (
  phoneNumber: string,
  taskTitle: string,
  dueDate: string
) => {
  const message = `⏰ Lembrete de tarefa!\n📋 "${taskTitle}"\n📅 Vence em: ${dueDate}`;

  return sendWhatsAppMessage({
    to: phoneNumber,
    message
  });
};

export const sendTaskCommentNotification = async (
  phoneNumber: string,
  taskTitle: string,
  commenterName: string,
  commentPreview: string
) => {
  const message = `💬 Novo comentário na tarefa "${taskTitle}"\n👤 ${commenterName}: "${commentPreview.substring(0, 100)}${commentPreview.length > 100 ? '...' : ''}"`;

  return sendWhatsAppMessage({
    to: phoneNumber,
    message
  });
};
