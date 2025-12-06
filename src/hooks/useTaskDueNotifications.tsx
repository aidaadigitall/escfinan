import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { differenceInMinutes } from "date-fns";
import { Task } from "@/hooks/useTasks";
import { playNotificationSound } from "@/lib/notificationSound";

interface NotifiedTask {
  taskId: string;
  notifiedAt60: boolean;
  notifiedAt30: boolean;
}

export const useTaskDueNotifications = (tasks: Task[]) => {
  const notifiedTasksRef = useRef<Map<string, NotifiedTask>>(new Map());

  useEffect(() => {
    const checkTasksDue = () => {
      const now = new Date();
      
      tasks.forEach((task) => {
        // Skip completed or cancelled tasks
        if (task.status === "completed" || task.status === "cancelled") return;
        if (!task.due_date) return;

        let targetDate = new Date(task.due_date);
        
        // If due_time is provided, set the time
        if (task.due_time) {
          const [hours, minutes] = task.due_time.split(":");
          targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          targetDate.setHours(23, 59, 59, 999);
        }

        // Skip past due tasks
        if (targetDate < now) return;

        const minutesUntilDue = differenceInMinutes(targetDate, now);
        
        // Get or create notification record
        let notified = notifiedTasksRef.current.get(task.id);
        if (!notified) {
          notified = { taskId: task.id, notifiedAt60: false, notifiedAt30: false };
          notifiedTasksRef.current.set(task.id, notified);
        }

        // Check for 1 hour (60 minutes) notification
        if (minutesUntilDue <= 60 && minutesUntilDue > 30 && !notified.notifiedAt60) {
          notified.notifiedAt60 = true;
          notifiedTasksRef.current.set(task.id, notified);
          
          playNotificationSound();
          toast.warning(`Tarefa vence em 1 hora!`, {
            description: task.title,
            duration: 10000,
          });
        }

        // Check for 30 minutes notification
        if (minutesUntilDue <= 30 && minutesUntilDue > 0 && !notified.notifiedAt30) {
          notified.notifiedAt30 = true;
          notifiedTasksRef.current.set(task.id, notified);
          
          playNotificationSound();
          toast.error(`Tarefa vence em 30 minutos!`, {
            description: task.title,
            duration: 15000,
          });
        }
      });
    };

    // Check immediately
    checkTasksDue();

    // Check every minute
    const interval = setInterval(checkTasksDue, 60000);

    return () => clearInterval(interval);
  }, [tasks]);
};
