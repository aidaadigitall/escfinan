import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyData {
  month: string;
  fullMonth: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface Totals {
  currentIncome: number;
  currentExpenses: number;
  currentBalance: number;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
}

interface ExportData {
  monthlyEvolution: MonthlyData[];
  expensesByCategory: CategoryData[];
  incomeByCategory: CategoryData[];
  totals: Totals;
  periodLabel: string;
}

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export const exportToExcel = (data: ExportData) => {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['RELATÓRIO FINANCEIRO'],
    ['Período:', data.periodLabel],
    ['Data de Geração:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
    [],
    ['RESUMO DO MÊS ATUAL'],
    ['Receitas:', formatCurrency(data.totals.currentIncome)],
    ['Despesas:', formatCurrency(data.totals.currentExpenses)],
    ['Saldo:', formatCurrency(data.totals.currentBalance)],
    [],
    ['VARIAÇÃO vs MÊS ANTERIOR'],
    ['Receitas:', `${data.totals.incomeChange.toFixed(1)}%`],
    ['Despesas:', `${data.totals.expenseChange.toFixed(1)}%`],
    ['Saldo:', formatCurrency(data.totals.balanceChange)],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Monthly evolution sheet
  const monthlyHeaders = ['Mês', 'Receitas', 'Despesas', 'Saldo'];
  const monthlyRows = data.monthlyEvolution.map(m => [
    m.fullMonth,
    formatCurrency(m.receitas),
    formatCurrency(m.despesas),
    formatCurrency(m.saldo),
  ]);
  const monthlySheet = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyRows]);
  monthlySheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Evolução Mensal');

  // Expenses by category sheet
  const expenseHeaders = ['Categoria', 'Valor', '% do Total'];
  const totalExpenses = data.expensesByCategory.reduce((sum, c) => sum + c.value, 0);
  const expenseRows = data.expensesByCategory.map(c => [
    c.name,
    formatCurrency(c.value),
    `${((c.value / totalExpenses) * 100).toFixed(1)}%`,
  ]);
  const expenseSheet = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
  expenseSheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Despesas por Categoria');

  // Income by category sheet
  const incomeHeaders = ['Categoria', 'Valor', '% do Total'];
  const totalIncome = data.incomeByCategory.reduce((sum, c) => sum + c.value, 0);
  const incomeRows = data.incomeByCategory.map(c => [
    c.name,
    formatCurrency(c.value),
    `${((c.value / totalIncome) * 100).toFixed(1)}%`,
  ]);
  const incomeSheet = XLSX.utils.aoa_to_sheet([incomeHeaders, ...incomeRows]);
  incomeSheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Receitas por Categoria');

  // Download
  const fileName = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportToPDF = (data: ExportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
        .header h1 { color: #4f46e5; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; color: #4f46e5; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .kpi-card { background: #f9fafb; border-radius: 8px; padding: 15px; border-left: 4px solid #4f46e5; }
        .kpi-card.income { border-left-color: #16a34a; }
        .kpi-card.expense { border-left-color: #dc2626; }
        .kpi-card.balance { border-left-color: #2563eb; }
        .kpi-label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .kpi-value { font-size: 20px; font-weight: bold; }
        .kpi-value.positive { color: #16a34a; }
        .kpi-value.negative { color: #dc2626; }
        .kpi-change { font-size: 11px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #4f46e5; color: white; padding: 10px; text-align: left; font-size: 13px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        tr:nth-child(even) { background: #f9fafb; }
        .category-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
        .category-section { }
        .category-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .category-name { display: flex; align-items: center; gap: 8px; }
        .category-dot { width: 10px; height: 10px; border-radius: 50%; }
        .category-value { font-weight: 500; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório Financeiro</h1>
        <p>${data.periodLabel} • Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>

      <div class="section">
        <div class="section-title">Resumo do Mês Atual</div>
        <div class="kpi-grid">
          <div class="kpi-card income">
            <div class="kpi-label">Receitas</div>
            <div class="kpi-value positive">${formatCurrency(data.totals.currentIncome)}</div>
            <div class="kpi-change">${data.totals.incomeChange >= 0 ? '↑' : '↓'} ${Math.abs(data.totals.incomeChange).toFixed(1)}% vs mês anterior</div>
          </div>
          <div class="kpi-card expense">
            <div class="kpi-label">Despesas</div>
            <div class="kpi-value negative">${formatCurrency(data.totals.currentExpenses)}</div>
            <div class="kpi-change">${data.totals.expenseChange <= 0 ? '↓' : '↑'} ${Math.abs(data.totals.expenseChange).toFixed(1)}% vs mês anterior</div>
          </div>
          <div class="kpi-card balance">
            <div class="kpi-label">Saldo</div>
            <div class="kpi-value ${data.totals.currentBalance >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.totals.currentBalance)}</div>
            <div class="kpi-change">${data.totals.balanceChange >= 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(data.totals.balanceChange))} vs mês anterior</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Evolução Mensal</div>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Receitas</th>
              <th>Despesas</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyEvolution.map(m => `
              <tr>
                <td>${m.fullMonth}</td>
                <td style="color: #16a34a;">${formatCurrency(m.receitas)}</td>
                <td style="color: #dc2626;">${formatCurrency(m.despesas)}</td>
                <td style="color: ${m.saldo >= 0 ? '#16a34a' : '#dc2626'}; font-weight: 500;">${formatCurrency(m.saldo)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Análise por Categoria</div>
        <div class="category-grid">
          <div class="category-section">
            <h4 style="margin-bottom: 12px; color: #dc2626;">Despesas</h4>
            ${data.expensesByCategory.map((c, i) => {
              const colors = ['#16a34a', '#dc2626', '#2563eb', '#eab308', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'];
              const total = data.expensesByCategory.reduce((s, x) => s + x.value, 0);
              return `
                <div class="category-item">
                  <span class="category-name">
                    <span class="category-dot" style="background: ${colors[i % colors.length]};"></span>
                    ${c.name}
                  </span>
                  <span class="category-value">${formatCurrency(c.value)} (${((c.value / total) * 100).toFixed(0)}%)</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="category-section">
            <h4 style="margin-bottom: 12px; color: #16a34a;">Receitas</h4>
            ${data.incomeByCategory.map((c, i) => {
              const colors = ['#16a34a', '#dc2626', '#2563eb', '#eab308', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'];
              const total = data.incomeByCategory.reduce((s, x) => s + x.value, 0);
              return `
                <div class="category-item">
                  <span class="category-name">
                    <span class="category-dot" style="background: ${colors[i % colors.length]};"></span>
                    ${c.name}
                  </span>
                  <span class="category-value">${formatCurrency(c.value)} (${((c.value / total) * 100).toFixed(0)}%)</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="footer">
        Relatório gerado automaticamente pelo Sistema Financeiro
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
