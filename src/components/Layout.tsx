import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content with dynamic margin */}
      <div 
        className="transition-all duration-300"
        style={{ 
          marginLeft: sidebarCollapsed ? '64px' : '256px' 
        }}
      >
        <Header 
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
          showMenuButton={false}
        />
        <main className="pt-16 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
