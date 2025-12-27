import { useCallback, useMemo } from "react";
import { useTransactions } from "./useTransactions";
import { useBankAccounts } from "./useBankAccounts";
import { useLeads } from "./useLeads";
import { useProjects, Project } from "./useProjects";
import { useServiceOrders } from "./useServiceOrders";
import { useSales } from "./useSales";
import { useQuotes } from "./useQuotes";
import { useClients } from "./useClients";
import { useProducts } from "./useProducts";
import { useEmployees } from "./useEmployees";
import { useTasks, Task } from "./useTasks";

export interface FinancialAnalysis {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingTransactions: number;
  accountsCount: number;
  incomeByCategory: { [key: string]: number };
  expenseByCategory: { [key: string]: number };
  monthlyTrend: { month: string; income: number; expense: number }[];
  topExpenses: { description: string; amount: number }[];
  topIncomes: { description: string; amount: number }[];
}

export interface CRMAnalysis {
  totalLeads: number;
  leadsByStatus: { [key: string]: number };
  leadsThisMonth: number;
  conversionRate: number;
  totalExpectedValue: number;
  hotLeads: number;
  coldLeads: number;
}

export interface ProjectsAnalysis {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalBudget: number;
  averageProgress: number;
}

export interface OperationsAnalysis {
  totalServiceOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
}

export interface SalesAnalysis {
  totalSales: number;
  salesThisMonth: number;
  totalSalesValue: number;
  pendingQuotes: number;
  quotesValue: number;
  conversionRate: number;
}

export interface HRAnalysis {
  totalEmployees: number;
  activeEmployees: number;
}

export interface TasksAnalysis {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
}

export interface ClientsAnalysis {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
}

export interface InventoryAnalysis {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalStockValue: number;
}

export interface SystemAnalysis {
  financial: FinancialAnalysis;
  crm: CRMAnalysis;
  projects: ProjectsAnalysis;
  operations: OperationsAnalysis;
  sales: SalesAnalysis;
  hr: HRAnalysis;
  tasks: TasksAnalysis;
  clients: ClientsAnalysis;
  inventory: InventoryAnalysis;
}

export const useAIAssistant = () => {
  const { transactions } = useTransactions();
  const { accounts } = useBankAccounts();
  const { leads } = useLeads();
  const projectsQuery = useProjects();
  const { serviceOrders } = useServiceOrders();
  const { sales } = useSales();
  const { quotes } = useQuotes();
  const { clients } = useClients();
  const { products } = useProducts();
  const { employees } = useEmployees();
  const { tasks } = useTasks();
  
  // Extract data from query result
  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);

  const analyzeFinancialData = useCallback((): FinancialAnalysis => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalIncome = transactions
      .filter((t) => t.type === "income" && t.status === "received")
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense" && t.status === "paid")
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const balance = accounts.reduce(
      (sum, acc) => sum + parseFloat(acc.current_balance.toString()),
      0
    );

    const pendingTransactions = transactions.filter(
      (t) => t.status === "pending"
    ).length;

    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};

    transactions.forEach((t) => {
      const category = "Geral";
      const amount = t.paid_amount || t.amount;
      if (t.type === "income") {
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
      } else {
        expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
      }
    });

    const monthlyTrend: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const month = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

      const monthIncome = transactions
        .filter((t) => t.type === "income" && new Date(t.due_date).getMonth() === date.getMonth() && new Date(t.due_date).getFullYear() === date.getFullYear())
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      const monthExpense = transactions
        .filter((t) => t.type === "expense" && new Date(t.due_date).getMonth() === date.getMonth() && new Date(t.due_date).getFullYear() === date.getFullYear())
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      monthlyTrend.push({ month, income: monthIncome, expense: monthExpense });
    }

    const topExpenses = transactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => (b.paid_amount || b.amount) - (a.paid_amount || a.amount))
      .slice(0, 5)
      .map((t) => ({ description: t.description, amount: t.paid_amount || t.amount }));

    const topIncomes = transactions
      .filter((t) => t.type === "income")
      .sort((a, b) => (b.paid_amount || b.amount) - (a.paid_amount || a.amount))
      .slice(0, 5)
      .map((t) => ({ description: t.description, amount: t.paid_amount || t.amount }));

    return {
      totalIncome,
      totalExpense,
      balance,
      pendingTransactions,
      accountsCount: accounts.length,
      incomeByCategory,
      expenseByCategory,
      monthlyTrend,
      topExpenses,
      topIncomes,
    };
  }, [transactions, accounts]);

  const analyzeCRMData = useCallback((): CRMAnalysis => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const leadsThisMonth = leads.filter((l) => {
      const created = new Date(l.created_at);
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;

    const leadsByStatus: { [key: string]: number } = {};
    leads.forEach((l) => {
      const status = l.status || "novo";
      leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
    });

    const convertedLeads = leads.filter((l) => l.converted_to_client).length;
    const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

    const totalExpectedValue = leads.reduce((sum, l) => sum + (l.expected_value || 0), 0);

    const hotLeads = leads.filter((l) => (l.score || 0) >= 70).length;
    const coldLeads = leads.filter((l) => (l.score || 0) < 30).length;

    return {
      totalLeads: leads.length,
      leadsByStatus,
      leadsThisMonth,
      conversionRate,
      totalExpectedValue,
      hotLeads,
      coldLeads,
    };
  }, [leads]);

  const analyzeProjectsData = useCallback((): ProjectsAnalysis => {
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter((p) => p.status === "completed").length;
    
    const now = new Date();
    const delayedProjects = projects.filter((p) => {
      if (!p.expected_end_date) return false;
      const endDate = new Date(p.expected_end_date);
      return endDate < now && p.status !== "completed" && p.status !== "cancelled";
    }).length;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget_amount || 0), 0);
    const averageProgress = projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length 
      : 0;

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      delayedProjects,
      totalBudget,
      averageProgress,
    };
  }, [projects]);

  const analyzeOperationsData = useCallback((): OperationsAnalysis => {
    const pendingOrders = serviceOrders.filter((o) => 
      o.status === "pendente" || o.status === "em_andamento" || o.status === "aguardando"
    ).length;
    
    const completedOrders = serviceOrders.filter((o) => 
      o.status === "concluido" || o.status === "entregue"
    ).length;

    const totalOrderValue = serviceOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const averageOrderValue = serviceOrders.length > 0 ? totalOrderValue / serviceOrders.length : 0;

    return {
      totalServiceOrders: serviceOrders.length,
      pendingOrders,
      completedOrders,
      totalOrderValue,
      averageOrderValue,
    };
  }, [serviceOrders]);

  const analyzeSalesData = useCallback((): SalesAnalysis => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const salesThisMonth = sales.filter((s) => {
      const saleDate = new Date(s.created_at);
      return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
    }).length;

    const totalSalesValue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

    const pendingQuotes = quotes.filter((q) => q.status === "pendente" || q.status === "enviado").length;
    const quotesValue = quotes.filter((q) => q.status === "pendente" || q.status === "enviado")
      .reduce((sum, q) => sum + (q.total_amount || 0), 0);

    const approvedQuotes = quotes.filter((q) => q.status === "aprovado").length;
    const conversionRate = quotes.length > 0 ? (approvedQuotes / quotes.length) * 100 : 0;

    return {
      totalSales: sales.length,
      salesThisMonth,
      totalSalesValue,
      pendingQuotes,
      quotesValue,
      conversionRate,
    };
  }, [sales, quotes]);

  const analyzeHRData = useCallback((): HRAnalysis => {
    const activeEmployees = employees.filter((e) => e.is_active).length;

    return {
      totalEmployees: employees.length,
      activeEmployees,
    };
  }, [employees]);

  const analyzeTasksData = useCallback((): TasksAnalysis => {
    const now = new Date();
    
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
    
    const overdueTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < now && t.status !== "completed" && t.status !== "cancelled";
    }).length;

    const highPriorityTasks = tasks.filter((t) => t.priority === "high" || t.priority === "urgent").length;

    return {
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      highPriorityTasks,
    };
  }, [tasks]);

  const analyzeClientsData = useCallback((): ClientsAnalysis => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const activeClients = clients.filter((c) => c.is_active).length;
    
    const newClientsThisMonth = clients.filter((c) => {
      const created = new Date(c.created_at);
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;

    return {
      totalClients: clients.length,
      activeClients,
      newClientsThisMonth,
    };
  }, [clients]);

  const analyzeInventoryData = useCallback((): InventoryAnalysis => {
    const activeProducts = products.filter((p) => p.is_active).length;
    
    const lowStockProducts = products.filter((p) => {
      const minStock = p.min_stock || 0;
      return p.stock_quantity <= minStock;
    }).length;

    const totalStockValue = products.reduce((sum, p) => 
      sum + (p.stock_quantity * p.cost_price), 0
    );

    return {
      totalProducts: products.length,
      activeProducts,
      lowStockProducts,
      totalStockValue,
    };
  }, [products]);

  const analyzeSystemData = useCallback((): SystemAnalysis => {
    return {
      financial: analyzeFinancialData(),
      crm: analyzeCRMData(),
      projects: analyzeProjectsData(),
      operations: analyzeOperationsData(),
      sales: analyzeSalesData(),
      hr: analyzeHRData(),
      tasks: analyzeTasksData(),
      clients: analyzeClientsData(),
      inventory: analyzeInventoryData(),
    };
  }, [
    analyzeFinancialData,
    analyzeCRMData,
    analyzeProjectsData,
    analyzeOperationsData,
    analyzeSalesData,
    analyzeHRData,
    analyzeTasksData,
    analyzeClientsData,
    analyzeInventoryData,
  ]);

  const generateSystemContext = useCallback((): string => {
    const analysis = analyzeSystemData();
    const f = analysis.financial;
    const crm = analysis.crm;
    const proj = analysis.projects;
    const ops = analysis.operations;
    const s = analysis.sales;
    const hr = analysis.hr;
    const t = analysis.tasks;
    const c = analysis.clients;
    const inv = analysis.inventory;

    return `
📊 CONTEXTO COMPLETO DO SISTEMA - VISÃO CEO

═══════════════════════════════════════════════════════════
💰 FINANCEIRO
═══════════════════════════════════════════════════════════
• Receita Total: R$ ${f.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Despesa Total: R$ ${f.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Saldo Atual: R$ ${f.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Transações Pendentes: ${f.pendingTransactions}
• Contas Bancárias: ${f.accountsCount}
• Top Despesas: ${f.topExpenses.map(e => `${e.description} (R$ ${e.amount.toLocaleString('pt-BR')})`).join(", ") || "Nenhuma"}
• Top Receitas: ${f.topIncomes.map(i => `${i.description} (R$ ${i.amount.toLocaleString('pt-BR')})`).join(", ") || "Nenhuma"}

═══════════════════════════════════════════════════════════
🎯 CRM - PIPELINE DE VENDAS
═══════════════════════════════════════════════════════════
• Total de Leads: ${crm.totalLeads}
• Leads Este Mês: ${crm.leadsThisMonth}
• Taxa de Conversão: ${crm.conversionRate.toFixed(1)}%
• Valor Esperado Total: R$ ${crm.totalExpectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Leads Quentes (score ≥70): ${crm.hotLeads}
• Leads Frios (score <30): ${crm.coldLeads}
• Por Status: ${Object.entries(crm.leadsByStatus).map(([k, v]) => `${k}: ${v}`).join(", ") || "Nenhum"}

═══════════════════════════════════════════════════════════
📋 PROJETOS
═══════════════════════════════════════════════════════════
• Total de Projetos: ${proj.totalProjects}
• Projetos Ativos: ${proj.activeProjects}
• Projetos Concluídos: ${proj.completedProjects}
• Projetos Atrasados: ${proj.delayedProjects}
• Orçamento Total: R$ ${proj.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Progresso Médio: ${proj.averageProgress.toFixed(1)}%

═══════════════════════════════════════════════════════════
🔧 OPERAÇÕES - ORDENS DE SERVIÇO
═══════════════════════════════════════════════════════════
• Total de OS: ${ops.totalServiceOrders}
• OS Pendentes: ${ops.pendingOrders}
• OS Concluídas: ${ops.completedOrders}
• Valor Total de OS: R$ ${ops.totalOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Ticket Médio: R$ ${ops.averageOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

═══════════════════════════════════════════════════════════
💼 VENDAS E ORÇAMENTOS
═══════════════════════════════════════════════════════════
• Total de Vendas: ${s.totalSales}
• Vendas Este Mês: ${s.salesThisMonth}
• Valor Total de Vendas: R$ ${s.totalSalesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Orçamentos Pendentes: ${s.pendingQuotes}
• Valor de Orçamentos: R$ ${s.quotesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Taxa de Conversão de Orçamentos: ${s.conversionRate.toFixed(1)}%

═══════════════════════════════════════════════════════════
👥 RECURSOS HUMANOS
═══════════════════════════════════════════════════════════
• Total de Funcionários: ${hr.totalEmployees}
• Funcionários Ativos: ${hr.activeEmployees}

═══════════════════════════════════════════════════════════
✅ TAREFAS
═══════════════════════════════════════════════════════════
• Total de Tarefas: ${t.totalTasks}
• Tarefas Concluídas: ${t.completedTasks}
• Tarefas Pendentes: ${t.pendingTasks}
• Tarefas Atrasadas: ${t.overdueTasks}
• Tarefas Alta Prioridade: ${t.highPriorityTasks}

═══════════════════════════════════════════════════════════
🏢 CLIENTES
═══════════════════════════════════════════════════════════
• Total de Clientes: ${c.totalClients}
• Clientes Ativos: ${c.activeClients}
• Novos Clientes Este Mês: ${c.newClientsThisMonth}

═══════════════════════════════════════════════════════════
📦 ESTOQUE
═══════════════════════════════════════════════════════════
• Total de Produtos: ${inv.totalProducts}
• Produtos Ativos: ${inv.activeProducts}
• Produtos com Estoque Baixo: ${inv.lowStockProducts}
• Valor Total em Estoque: R$ ${inv.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
`;
  }, [analyzeSystemData]);

  // Legacy compatibility - returns just financial for backward compatibility
  const analyzeSystemDataLegacy = useCallback(() => {
    return analyzeFinancialData();
  }, [analyzeFinancialData]);

  return {
    analyzeSystemData: analyzeSystemDataLegacy, // Keep backward compatibility
    analyzeFullSystemData: analyzeSystemData,
    generateSystemContext,
    analyzeFinancialData,
    analyzeCRMData,
    analyzeProjectsData,
    analyzeOperationsData,
    analyzeSalesData,
    analyzeHRData,
    analyzeTasksData,
    analyzeClientsData,
    analyzeInventoryData,
  };
};
