import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Users, ShoppingCart, Package, DollarSign, Settings, Calendar, CheckSquare,
  Eye, Pencil
} from "lucide-react";

export type UserPermissions = {
  // Cadastros
  can_view_clients: boolean;
  can_manage_clients: boolean;
  can_view_suppliers: boolean;
  can_manage_suppliers: boolean;
  can_view_products: boolean;
  can_manage_products: boolean;
  can_view_services: boolean;
  can_manage_services: boolean;
  can_view_employees: boolean;
  can_manage_employees: boolean;
  can_view_users: boolean;
  can_manage_users: boolean;
  
  // Comercial
  can_view_quotes: boolean;
  can_manage_quotes: boolean;
  can_view_sales: boolean;
  can_manage_sales: boolean;
  can_view_service_orders: boolean;
  can_manage_service_orders: boolean;
  
  // Estoque
  can_view_stock: boolean;
  can_manage_stock: boolean;
  can_view_stock_movements: boolean;
  can_manage_stock_movements: boolean;
  
  // Financeiro
  can_view_receivables: boolean;
  can_manage_receivables: boolean;
  can_view_payables: boolean;
  can_manage_payables: boolean;
  can_view_fixed_expenses: boolean;
  can_manage_fixed_expenses: boolean;
  can_view_fixed_income: boolean;
  can_manage_fixed_income: boolean;
  can_view_daily_entries: boolean;
  can_manage_daily_entries: boolean;
  can_view_dre: boolean;
  can_view_reports: boolean;
  can_view_cashflow: boolean;
  can_view_transfers: boolean;
  can_manage_transfers: boolean;
  can_view_cash: boolean;
  can_manage_cash: boolean;
  
  // Configurações
  can_view_categories: boolean;
  can_manage_categories: boolean;
  can_view_chart_of_accounts: boolean;
  can_manage_chart_of_accounts: boolean;
  can_view_cost_centers: boolean;
  can_manage_cost_centers: boolean;
  can_view_payment_methods: boolean;
  can_manage_payment_methods: boolean;
  can_view_bank_accounts: boolean;
  can_manage_bank_accounts: boolean;
  can_view_credit_cards: boolean;
  can_manage_credit_cards: boolean;
  can_view_settings: boolean;
  can_manage_settings: boolean;
  
  // Tasks and Calendar
  can_view_tasks: boolean;
  can_manage_tasks: boolean;
  can_view_calendar: boolean;
};

export const defaultPermissions: UserPermissions = {
  can_view_clients: true,
  can_manage_clients: true,
  can_view_suppliers: true,
  can_manage_suppliers: true,
  can_view_products: true,
  can_manage_products: true,
  can_view_services: true,
  can_manage_services: true,
  can_view_employees: true,
  can_manage_employees: true,
  can_view_users: false,
  can_manage_users: false,
  can_view_quotes: true,
  can_manage_quotes: true,
  can_view_sales: true,
  can_manage_sales: true,
  can_view_service_orders: true,
  can_manage_service_orders: true,
  can_view_stock: true,
  can_manage_stock: true,
  can_view_stock_movements: true,
  can_manage_stock_movements: true,
  can_view_receivables: true,
  can_manage_receivables: true,
  can_view_payables: true,
  can_manage_payables: true,
  can_view_fixed_expenses: true,
  can_manage_fixed_expenses: true,
  can_view_fixed_income: true,
  can_manage_fixed_income: true,
  can_view_daily_entries: true,
  can_manage_daily_entries: true,
  can_view_dre: true,
  can_view_reports: true,
  can_view_cashflow: true,
  can_view_transfers: true,
  can_manage_transfers: true,
  can_view_cash: true,
  can_manage_cash: true,
  can_view_categories: true,
  can_manage_categories: true,
  can_view_chart_of_accounts: true,
  can_manage_chart_of_accounts: true,
  can_view_cost_centers: true,
  can_manage_cost_centers: true,
  can_view_payment_methods: true,
  can_manage_payment_methods: true,
  can_view_bank_accounts: true,
  can_manage_bank_accounts: true,
  can_view_credit_cards: true,
  can_manage_credit_cards: true,
  can_view_settings: false,
  can_manage_settings: false,
  can_view_tasks: true,
  can_manage_tasks: true,
  can_view_calendar: true,
};

type PermissionGroup = {
  title: string;
  icon: React.ReactNode;
  items: {
    viewKey: keyof UserPermissions;
    manageKey?: keyof UserPermissions;
    label: string;
  }[];
};

const permissionGroups: PermissionGroup[] = [
  {
    title: "Cadastros",
    icon: <Users className="h-4 w-4" />,
    items: [
      { viewKey: "can_view_clients", manageKey: "can_manage_clients", label: "Clientes" },
      { viewKey: "can_view_suppliers", manageKey: "can_manage_suppliers", label: "Fornecedores" },
      { viewKey: "can_view_products", manageKey: "can_manage_products", label: "Produtos" },
      { viewKey: "can_view_services", manageKey: "can_manage_services", label: "Serviços" },
      { viewKey: "can_view_employees", manageKey: "can_manage_employees", label: "Funcionários" },
      { viewKey: "can_view_users", manageKey: "can_manage_users", label: "Usuários" },
    ],
  },
  {
    title: "Comercial",
    icon: <ShoppingCart className="h-4 w-4" />,
    items: [
      { viewKey: "can_view_quotes", manageKey: "can_manage_quotes", label: "Orçamentos" },
      { viewKey: "can_view_sales", manageKey: "can_manage_sales", label: "Vendas" },
      { viewKey: "can_view_service_orders", manageKey: "can_manage_service_orders", label: "Ordens de Serviço" },
    ],
  },
  {
    title: "Estoque",
    icon: <Package className="h-4 w-4" />,
    items: [
      { viewKey: "can_view_stock", manageKey: "can_manage_stock", label: "Produtos em Estoque" },
      { viewKey: "can_view_stock_movements", manageKey: "can_manage_stock_movements", label: "Movimentações" },
    ],
  },
  {
    title: "Financeiro",
    icon: <DollarSign className="h-4 w-4" />,
    items: [
      { viewKey: "can_view_receivables", manageKey: "can_manage_receivables", label: "Contas a Receber" },
      { viewKey: "can_view_payables", manageKey: "can_manage_payables", label: "Contas a Pagar" },
      { viewKey: "can_view_fixed_expenses", manageKey: "can_manage_fixed_expenses", label: "Despesas Fixas" },
      { viewKey: "can_view_fixed_income", manageKey: "can_manage_fixed_income", label: "Receitas Fixas" },
      { viewKey: "can_view_daily_entries", manageKey: "can_manage_daily_entries", label: "Lançamentos Diários" },
      { viewKey: "can_view_dre", label: "DRE Gerencial" },
      { viewKey: "can_view_reports", label: "Relatórios" },
      { viewKey: "can_view_cashflow", label: "Fluxo de Caixa" },
      { viewKey: "can_view_transfers", manageKey: "can_manage_transfers", label: "Transferências" },
      { viewKey: "can_view_cash", manageKey: "can_manage_cash", label: "Caixa" },
    ],
  },
  {
    title: "Configurações",
    icon: <Settings className="h-4 w-4" />,
    items: [
      { viewKey: "can_view_categories", manageKey: "can_manage_categories", label: "Categorias" },
      { viewKey: "can_view_chart_of_accounts", manageKey: "can_manage_chart_of_accounts", label: "Plano de Contas" },
      { viewKey: "can_view_cost_centers", manageKey: "can_manage_cost_centers", label: "Centros de Custo" },
      { viewKey: "can_view_payment_methods", manageKey: "can_manage_payment_methods", label: "Formas de Pagamento" },
      { viewKey: "can_view_bank_accounts", manageKey: "can_manage_bank_accounts", label: "Contas Bancárias" },
      { viewKey: "can_view_credit_cards", manageKey: "can_manage_credit_cards", label: "Cartões de Crédito" },
      { viewKey: "can_view_settings", manageKey: "can_manage_settings", label: "Configurações Gerais" },
    ],
  },
  {
    title: "Tarefas e Calendário",
    icon: <CheckSquare className="h-4 w-4" />,
    items: [
      { viewKey: "can_view_tasks", manageKey: "can_manage_tasks", label: "Tarefas" },
      { viewKey: "can_view_calendar", label: "Calendário Financeiro" },
    ],
  },
];

interface UserPermissionsFormProps {
  permissions: UserPermissions;
  onChange: (permissions: UserPermissions) => void;
  disabled?: boolean;
}

export const UserPermissionsForm = ({ permissions, onChange, disabled }: UserPermissionsFormProps) => {
  const handleCheckboxChange = (key: keyof UserPermissions, checked: boolean) => {
    const newPermissions = { ...permissions, [key]: checked };
    
    // If disabling view, also disable manage
    if (key.startsWith("can_view_") && !checked) {
      const manageKey = key.replace("can_view_", "can_manage_") as keyof UserPermissions;
      if (manageKey in newPermissions) {
        newPermissions[manageKey] = false;
      }
    }
    
    // If enabling manage, also enable view
    if (key.startsWith("can_manage_") && checked) {
      const viewKey = key.replace("can_manage_", "can_view_") as keyof UserPermissions;
      if (viewKey in newPermissions) {
        newPermissions[viewKey] = true;
      }
    }
    
    onChange(newPermissions);
  };

  const handleGroupToggle = (group: PermissionGroup, enable: boolean) => {
    const newPermissions = { ...permissions };
    group.items.forEach(item => {
      newPermissions[item.viewKey] = enable;
      if (item.manageKey) {
        newPermissions[item.manageKey] = enable;
      }
    });
    onChange(newPermissions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold">Permissões de Acesso</h3>
      </div>
      
      <Accordion type="multiple" className="w-full space-y-2">
        {permissionGroups.map((group, groupIndex) => (
          <AccordionItem 
            key={groupIndex} 
            value={`group-${groupIndex}`}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {group.icon}
                </div>
                <span className="font-medium">{group.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex items-center gap-4 mb-4 pb-3 border-b">
                <button
                  type="button"
                  onClick={() => handleGroupToggle(group, true)}
                  disabled={disabled}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={() => handleGroupToggle(group, false)}
                  disabled={disabled}
                  className="text-sm text-muted-foreground hover:underline disabled:opacity-50"
                >
                  Desmarcar todos
                </button>
              </div>
              
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <span>Módulo</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Visualizar
                  </span>
                  <span className="flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Gerenciar
                  </span>
                </div>
                
                {group.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="grid grid-cols-3 gap-4 items-center py-1">
                    <Label className="text-sm">{item.label}</Label>
                    <div className="flex items-center">
                      <Checkbox
                        checked={permissions[item.viewKey]}
                        onCheckedChange={(checked) => handleCheckboxChange(item.viewKey, !!checked)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex items-center">
                      {item.manageKey ? (
                        <Checkbox
                          checked={permissions[item.manageKey]}
                          onCheckedChange={(checked) => handleCheckboxChange(item.manageKey!, !!checked)}
                          disabled={disabled || !permissions[item.viewKey]}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
