import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      {isMobile ? (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="w-full">
            <Header 
              onMenuClick={() => setSidebarOpen(true)} 
              showMenuButton={true}
            />
            <main className="pt-16 p-4">
              {children}
            </main>
          </div>
        </>
      ) : (
        /* Desktop Sidebar */
        <>
          <Sidebar 
            collapsed={desktopSidebarCollapsed} 
            onToggle={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
          />
          <div className={desktopSidebarCollapsed ? "ml-16" : "ml-64"} style={{ transition: "margin-left 0.3s ease" }}>
            <Header 
              onMenuClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)} 
              showMenuButton={true}
            />
            <main className="pt-16 p-6">
              {children}
            </main>
          </div>
        </>
      )}
    </div>
  );
};
