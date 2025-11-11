import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "./ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Sidebar as overlay */}
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
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
        <main className="pt-16 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
