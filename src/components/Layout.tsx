import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "./ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar as overlay for all screen sizes */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content - full width */}
      <div className="w-full">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          showMenuButton={true}
        />
        <main className="pt-16 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
