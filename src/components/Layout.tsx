import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "./ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIAssistant } from "./AIAssistant";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useTaskDueNotifications } from "@/hooks/useTaskDueNotifications";
import { useTasks } from "@/hooks/useTasks";
import { UrgentTasksWidget } from "./UrgentTasksWidget";
import { useFavicon } from "@/hooks/useFavicon";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { analyzeSystemData } = useAIAssistant();
  const systemData = analyzeSystemData();
  const { tasks } = useTasks();
  
  // Enable realtime notifications for tasks and comments
  useRealtimeNotifications();
  
  // Enable task due notifications globally
  useTaskDueNotifications(tasks);

  // Apply custom favicon
  useFavicon();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Sidebar as overlay */}
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent 
            side="left" 
            className="p-0 w-64 animate-slide-in-right data-[state=closed]:animate-slide-out-right"
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Fixed sidebar */
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main content */}
      <div 
        className={isMobile ? "w-full" : "transition-all duration-300"}
        style={!isMobile ? { 
          marginLeft: sidebarCollapsed ? '64px' : '256px' 
        } : undefined}
      >
        <Header 
          onMenuClick={isMobile ? () => setSidebarOpen(true) : () => setSidebarCollapsed(!sidebarCollapsed)} 
          showMenuButton={isMobile}
        />
        <main className="pt-20 md:pt-24 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Urgent Tasks Widget - global visibility */}
      <UrgentTasksWidget />

      {/* AI Assistant */}
      <AIAssistant systemData={systemData} />
    </div>
  );
};
