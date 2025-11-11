import { Calendar, LogOut, Menu, TrendingUp, User, Settings, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { DailyTransactionDialog } from "./DailyTransactionDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ onMenuClick, showMenuButton = false }: HeaderProps = {}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Usuário");
  const [systemSettings, setSystemSettings] = useState({
    system_name: "FinanceControl",
    system_subtitle: "Controle Financeiro Pessoal",
    logo_url: "",
  });
  const [dailyExpenseOpen, setDailyExpenseOpen] = useState(false);
  const { createTransaction } = useTransactions();

  useEffect(() => {
    if (user) {
      // Buscar nome do usuário
      supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) {
            setUserName(data.full_name);
          }
        });

      // Buscar configurações do sistema
      supabase
        .from("system_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setSystemSettings({
              system_name: data.system_name || "FinanceControl",
              system_subtitle: data.system_subtitle || "Controle Financeiro Pessoal",
              logo_url: data.logo_url || "",
            });
          }
        });
    }
  }, [user]);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#1a1f37] px-4 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        {showMenuButton && onMenuClick && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-white hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {systemSettings.logo_url ? (
            <img 
              src={systemSettings.logo_url} 
              alt={systemSettings.system_name}
              className="h-10 object-contain"
            />
          ) : (
            <div className="bg-primary p-1.5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="hidden md:block text-left">
            <h2 className="text-sm font-bold text-white leading-tight">
              {systemSettings.system_name}
            </h2>
            <p className="text-xs text-white/70 leading-tight">
              {systemSettings.system_subtitle}
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDailyExpenseOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-white text-primary border-white hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          Despesa Rápida
        </Button>
        <NotificationsDropdown />
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Calendar className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/perfil")}>
              <User className="mr-2 h-4 w-4" />
              <span>Editar Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/configuracoes")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-expense">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DailyTransactionDialog
        open={dailyExpenseOpen}
        onOpenChange={setDailyExpenseOpen}
        type="expense"
        onSave={(data) => createTransaction(data)}
      />
    </header>
  );
};
