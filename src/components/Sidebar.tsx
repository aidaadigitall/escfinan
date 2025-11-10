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
  Tag,
  Target,
  ArrowRightLeft,
  Mail,
  Table,
  FileBarChart,
} from "lucide-react";

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Receipt, label: "Contas a Receber", path: "/receitas" },
  { icon: CreditCard, label: "Contas a Pagar", path: "/despesas" },
  { icon: FileBarChart, label: "DRE Gerencial", path: "/dre-gerencial" },
  { icon: BarChart3, label: "Fluxo de Caixa", path: "/fluxo-de-caixa" },
  {
    icon: Landmark,
    label: "Boletos Bancários",
    submenu: [
      { icon: FileText, label: "Gerar Boletos", path: "/boletos/gerar" },
      { icon: FileText, label: "Remessas", path: "/boletos/remessas" },
      { icon: FileText, label: "Retornos", path: "/boletos/retornos" },
    ],
  },
  {
    icon: Settings,
    label: "Opções Auxiliares",
    submenu: [
      { icon: Wallet, label: "Caixas", path: "/auxiliares/caixas" },
      { icon: Building2, label: "Contas Bancárias", path: "/auxiliares/contas-bancarias" },
      { icon: CreditCard, label: "Formas de Pagamento", path: "/auxiliares/formas-pagamento" },
      { icon: FileText, label: "Plano de Contas", path: "/auxiliares/plano-contas" },
      { icon: Tag, label: "Situações", path: "/auxiliares/situacoes" },
      { icon: Target, label: "Centros de Custos", path: "/auxiliares/centros-custos" },
      { icon: ArrowRightLeft, label: "Conciliação Bancária", path: "/auxiliares/conciliacao" },
      { icon: ArrowRightLeft, label: "Transferências", path: "/auxiliares/transferencias" },
      { icon: FileText, label: "Campos Extras", path: "/auxiliares/campos-extras" },
      { icon: Mail, label: "Modelos de E-mails", path: "/auxiliares/modelos-emails" },
      { icon: Table, label: "Tabelas de Rateios", path: "/auxiliares/tabelas-rateios" },
    ],
  },
  { icon: FileText, label: "Contas Fixas", path: "/contas-fixas" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export const Sidebar = () => {
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
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
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
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          level > 0 && "pl-8",
          itemIsActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-foreground">
          FinanceControl
        </h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">
          Controle Financeiro Pessoal
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </aside>
  );
};
