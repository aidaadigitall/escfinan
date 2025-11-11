import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Home,
  TrendingUp,
  Wallet,
  Receipt,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Landmark,
  Building2,
  Target,
  ArrowRightLeft,
  Mail,
  Table,
  FileBarChart,
  ChevronLeft,
} from "lucide-react";
import { Button } from "./ui/button";

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  submenu?: MenuItem[];
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Receipt, label: "Contas a Receber", path: "/receitas" },
  {
    icon: CreditCard,
    label: "Contas a Pagar",
    submenu: [
      { icon: CreditCard, label: "Despesas", path: "/despesas" },
      { icon: FileText, label: "Despesas Fixas", path: "/contas-fixas" },
      { icon: FileBarChart, label: "Relatório de Recorrências", path: "/relatorio-recorrencias" },
    ],
  },
  { icon: FileBarChart, label: "DRE Gerencial", path: "/dre-gerencial" },
  { icon: BarChart3, label: "Fluxo de Caixa", path: "/fluxo-de-caixa" },
  { icon: ArrowRightLeft, label: "Transferências", path: "/transferencias" },
  { icon: Wallet, label: "Caixa", path: "/caixa" },
  { icon: Target, label: "Calendário Financeiro", path: "/calendario-financeiro" },
  {
    icon: Settings,
    label: "Configurações Avançadas",
    submenu: [
      { icon: Building2, label: "Contas Bancárias", path: "/auxiliares/contas-bancarias" },
      { icon: CreditCard, label: "Cartões de Crédito", path: "/auxiliares/cartoes-credito" },
      { icon: Target, label: "Centros de Custos", path: "/auxiliares/centros-custos" },
      { icon: Landmark, label: "Boletos Bancários", path: "/boletos" },
      { icon: ArrowRightLeft, label: "Conciliação Bancária", path: "/auxiliares/conciliacao" },
      { icon: FileText, label: "Campos Extras", path: "/auxiliares/campos-extras" },
      { icon: Mail, label: "Modelos de E-mails", path: "/auxiliares/modelos-emails" },
      { icon: Table, label: "Tabelas de Rateios", path: "/auxiliares/tabelas-rateios" },
    ],
  },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export const Sidebar = ({ collapsed = false, onToggle, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isSubmenuActive = (submenu?: MenuItem[]) => {
    if (!submenu) return false;
    return submenu.some((item) => location.pathname === item.path);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const itemIsActive = isActive(item.path) || isSubmenuActive(item.submenu);

    if (hasSubmenu) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleSubmenu(item.label)}
            className={cn(
              "flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors",
              level > 0 && "pl-8",
              itemIsActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium transition-opacity duration-200">{item.label}</span>}
            </div>
            {!collapsed && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200" />
              )
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="mt-1 space-y-1 animate-accordion-down">
              {item.submenu!.map((subItem) => renderMenuItem(subItem, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path!}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          level > 0 && "pl-8",
          itemIsActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium transition-opacity duration-200">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-56px)] bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between animate-fade-in">
        {!collapsed && (
          <div className="transition-opacity duration-200">
            <h1 className="text-2xl font-bold text-sidebar-foreground">
              FinanceControl
            </h1>
            <p className="text-sm text-sidebar-foreground/60 mt-1">
              Controle Financeiro Pessoal
            </p>
          </div>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("flex-shrink-0", collapsed && "mx-auto")}
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", collapsed && "rotate-180")} />
          </Button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 animate-fade-in">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </aside>
  );
};
