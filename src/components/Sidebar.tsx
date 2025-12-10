import { Link, useLocation, useNavigate } from "react-router-dom";
import escSolutionsLogo from "@/assets/esc_solutions_logo.png";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Users,
  User,
  Package,
  Briefcase,
  PieChart,
  ClipboardList,
  Wrench,
  ShoppingCart,
  CheckSquare,
  Calendar,
  Boxes,
  Clock,
} from "lucide-react";
import { Button } from "./ui/button";
import { useCurrentUserPermissions } from "@/hooks/useUserPermissions";

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  submenu?: MenuItem[];
  permissionKey?: string;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

const getMenuItems = (permissions: Record<string, boolean>): MenuItem[] => {
  const items: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/" },
    {
      icon: Users,
      label: "Cadastros",
      submenu: [
        { icon: Briefcase, label: "Clientes", path: "/cadastros/clientes" },
        { icon: Building2, label: "Fornecedores", path: "/cadastros/fornecedores" },
        { icon: Package, label: "Produtos", path: "/cadastros/produtos" },
        { icon: Wrench, label: "Serviços", path: "/cadastros/servicos" },
        { icon: Users, label: "Funcionários", path: "/cadastros/funcionarios" },
        ...(permissions.can_view_users ? [{ icon: User, label: "Usuários", path: "/cadastros/usuarios" }] : []),
      ],
    },
    {
      icon: ShoppingCart,
      label: "Comercial",
      submenu: [
        { icon: ClipboardList, label: "Orçamentos", path: "/orcamentos" },
        { icon: FileText, label: "Ordens de Serviço", path: "/ordens-servico" },
        { icon: ShoppingCart, label: "Vendas", path: "/vendas" },
      ],
    },
    {
      icon: Boxes,
      label: "Estoque",
      submenu: [
        { icon: Package, label: "Produtos", path: "/cadastros/produtos" },
        { icon: ArrowRightLeft, label: "Movimentações", path: "/estoque/movimentacoes" },
      ],
    },
    {
      icon: BarChart3,
      label: "Financeiro",
      submenu: [
        { icon: Receipt, label: "Contas a Receber", path: "/receitas" },
        { icon: CreditCard, label: "Contas a Pagar", path: "/despesas" },
        { icon: FileText, label: "Despesas Fixas", path: "/contas-fixas" },
        { icon: FileText, label: "Receitas Fixas", path: "/receitas-fixas" },
        { icon: Wallet, label: "Lançamentos Diários", path: "/lancamentos-diarios" },
        { icon: FileBarChart, label: "DRE Gerencial", path: "/dre-gerencial" },
        { icon: PieChart, label: "Relatórios Gerenciais", path: "/relatorios-gerenciais" },
        { icon: BarChart3, label: "Fluxo de Caixa", path: "/fluxo-de-caixa" },
        { icon: ArrowRightLeft, label: "Transferências", path: "/transferencias" },
        { icon: Wallet, label: "Caixa", path: "/caixa" },
      ],
    },
    {
      icon: Clock,
      label: "Ponto",
      submenu: [
        { icon: Clock, label: "Controle de Ponto", path: "/controle-ponto" },
        { icon: Clock, label: "Sistema de Ponto", path: "/ponto" },
      ],
    },
    { icon: CheckSquare, label: "Tarefas", path: "/tarefas" },
    { icon: Calendar, label: "Calendário Financeiro", path: "/calendario-financeiro" },
    {
      icon: Settings,
      label: "Configurações Avançadas",
      submenu: [
        { icon: Building2, label: "Contas Bancárias", path: "/auxiliares/contas-bancarias" },
        { icon: CreditCard, label: "Cartões de Crédito", path: "/auxiliares/cartoes-credito" },
        { icon: Target, label: "Centros de Custos", path: "/auxiliares/centros-custos" },
        { icon: FileText, label: "Categorias", path: "/categorias" },
        { icon: Table, label: "Plano de Contas", path: "/plano-contas" },
        { icon: Landmark, label: "Formas de Pagamento", path: "/formas-pagamento" },
        { icon: FileBarChart, label: "Relatório de Recorrências", path: "/relatorio-recorrencias" },
      ],
    },
  ];

  // Only show Configurações if user has permission
  if (permissions.can_view_settings) {
    items.push({ icon: Settings, label: "Configurações", path: "/configuracoes" });
  }

  return items;
};

export const Sidebar = ({ collapsed = false, onToggle, onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { permissions } = useCurrentUserPermissions();
  const [sidebarLogoUrl, setSidebarLogoUrl] = useState<string | null>(null);
  
  const menuItems = useMemo(() => getMenuItems(permissions), [permissions]);
  
  // Fetch sidebar logo from company settings
  useEffect(() => {
    const fetchSidebarLogo = async () => {
      if (!user) return;

      // Get effective owner ID for the current user
      const { data: effectiveOwnerData } = await supabase
        .rpc('get_effective_owner_id', { _user_id: user.id });
      
      const effectiveUserId = effectiveOwnerData || user.id;

      const { data: companyData } = await supabase
        .from("company_settings")
        .select("logo_sidebar_url")
        .eq("user_id", effectiveUserId)
        .maybeSingle();
      
      if (companyData?.logo_sidebar_url) {
        setSidebarLogoUrl(companyData.logo_sidebar_url);
        localStorage.setItem("logo_sidebar_url", companyData.logo_sidebar_url);
      } else {
        // Fallback to localStorage
        const storedLogo = localStorage.getItem("logo_sidebar_url");
        if (storedLogo) setSidebarLogoUrl(storedLogo);
      }
    };

    fetchSidebarLogo();
  }, [user]);
  
  // Initialize expanded menus based on current route
  const getInitialExpandedMenus = () => {
    const expanded: string[] = [];
    menuItems.forEach(item => {
      if (item.submenu?.some(sub => location.pathname === sub.path)) {
        expanded.push(item.label);
      }
    });
    return expanded;
  };
  
  const [expandedMenus, setExpandedMenus] = useState<string[]>(getInitialExpandedMenus);

  // Keep parent menu open when navigating within submenu
  const toggleSubmenu = (label: string, keepOpen = false) => {
    setExpandedMenus((prev) => {
      if (keepOpen) {
        return prev.includes(label) ? prev : [...prev, label];
      }
      return prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label];
    });
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
              "flex items-center justify-between w-full gap-2 px-3 sm:px-4 py-3 rounded-lg transition-colors min-h-10 sm:min-h-auto",
              level > 0 && "pl-6 sm:pl-8",
              itemIsActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-xs sm:text-sm font-medium transition-opacity duration-200 truncate">{item.label}</span>}
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
          "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg transition-colors min-h-10 sm:min-h-auto",
          level > 0 && "pl-6 sm:pl-8",
          itemIsActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="text-xs sm:text-sm font-medium transition-opacity duration-200 truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-56px)] bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto transition-all duration-300 ease-in-out z-40",
        collapsed ? "w-14 md:w-16" : "w-full sm:w-56 md:w-64"
      )}
    >
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between animate-fade-in">
        <button
          onClick={() => navigate("/")}
          className={cn("flex items-center justify-center", collapsed ? "w-full" : "w-auto")}
        >
          <img 
            src={sidebarLogoUrl || escSolutionsLogo} 
            alt="Logo" 
            className={cn("transition-all duration-200 object-contain", collapsed ? "w-8 h-8" : "w-40 max-h-16")} 
          />
        </button>
        
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("flex-shrink-0", collapsed ? "mx-auto" : "ml-auto")}
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
