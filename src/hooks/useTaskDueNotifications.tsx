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

// Singleton to track if notifications have already been shown this session
const sessionNotifiedTasks = new Set<string>();

export const useTaskDueNotifications = (tasks: Task[]) => {
  const notifiedTasksRef = useRef<Map<string, NotifiedTask>>(new Map());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Skip first check to avoid flooding notifications on page load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Mark all current tasks as already notified to prevent initial flood
      tasks.forEach((task) => {
        if (task.due_date && task.status !== "completed" && task.status !== "cancelled") {
          let targetDate = new Date(task.due_date);
          if (task.due_time) {
            const [hours, minutes] = task.due_time.split(":");
            targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
          const now = new Date();
          const minutesUntilDue = differenceInMinutes(targetDate, now);
          
          // Mark as already notified if already within notification window
          if (minutesUntilDue <= 60 && minutesUntilDue > 0) {
            sessionNotifiedTasks.add(`${task.id}-60`);
          }
          if (minutesUntilDue <= 30 && minutesUntilDue > 0) {
            sessionNotifiedTasks.add(`${task.id}-30`);
          }
        }
      });
      return;
    }

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

        // Check for 1 hour (60 minutes) notification - only once per session
        if (minutesUntilDue <= 60 && minutesUntilDue > 30 && !sessionNotifiedTasks.has(`${task.id}-60`)) {
          sessionNotifiedTasks.add(`${task.id}-60`);
          
          playNotificationSound();
          toast.warning(`Tarefa vence em 1 hora!`, {
            description: task.title,
            duration: 8000,
          });
        }

        // Check for 30 minutes notification - only once per session
        if (minutesUntilDue <= 30 && minutesUntilDue > 0 && !sessionNotifiedTasks.has(`${task.id}-30`)) {
          sessionNotifiedTasks.add(`${task.id}-30`);
          
          playNotificationSound();
          toast.error(`Tarefa vence em 30 minutos!`, {
            description: task.title,
            duration: 10000,
          });
        }
      });
    };

    // Check immediately
    checkTasksDue();

    // Check every 5 minutes instead of every minute (less intrusive)
    const interval = setInterval(checkTasksDue, 300000);

    return () => clearInterval(interval);
  }, [tasks]);
};
