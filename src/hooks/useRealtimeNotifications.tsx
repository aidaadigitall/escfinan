import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notificationSound';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
        },
        async (payload) => {
          const newTask = payload.new as any;
          
          // Check if current user is assigned to this task
          const assignedUsers = newTask.assigned_users || [];
          const responsibleId = newTask.responsible_id;
          
          if (
            newTask.user_id !== user.id && // Not created by current user
            (assignedUsers.includes(user.id) || responsibleId === user.id)
          ) {
            // Play notification sound
            playNotificationSound();
            
            toast.info('Nova tarefa atribuída', {
              description: `Você foi atribuído à tarefa: "${newTask.title}"`,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
        },
        async (payload) => {
          const newTask = payload.new as any;
          const oldTask = payload.old as any;
          
          // Check if current user was newly assigned
          const newAssignedUsers = newTask.assigned_users || [];
          const oldAssignedUsers = oldTask.assigned_users || [];
          
          const wasNewlyAssigned = 
            newAssignedUsers.includes(user.id) && 
            !oldAssignedUsers.includes(user.id);
          
          const wasNewlyResponsible = 
            newTask.responsible_id === user.id && 
            oldTask.responsible_id !== user.id;
          
          if (newTask.user_id !== user.id && (wasNewlyAssigned || wasNewlyResponsible)) {
            // Play notification sound
            playNotificationSound();
            
            toast.info('Tarefa atribuída', {
              description: `Você foi atribuído à tarefa: "${newTask.title}"`,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
        },
        async (payload) => {
          const newComment = payload.new as any;
          
          // Check if current user is mentioned in this comment
          const mentions = newComment.mentions || [];
          
          if (
            newComment.user_id !== user.id && // Not created by current user
            mentions.includes(user.id)
          ) {
            // Play notification sound
            playNotificationSound();
            
            toast.info('Você foi mencionado', {
              description: `Alguém mencionou você em um comentário de tarefa`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
