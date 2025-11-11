import { Bell, Calendar, LogOut, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ onMenuClick, showMenuButton = false }: HeaderProps = {}) => {
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setUserName(data.full_name);
          }
        });
    }
  }, [user]);

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <>
      {/* Top bar - Black background */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-border px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          {showMenuButton && onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">FinanceControl</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-expense rounded-full" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Calendar className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sair" className="text-white hover:bg-white/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Greeting section - Below top bar */}
      <div className="fixed top-14 left-0 right-0 bg-background border-b border-border px-6 py-3 z-10">
        <h2 className="text-xl font-semibold text-foreground">
          {greeting()}, {userName}
        </h2>
        <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
      </div>
    </>
  );
};
