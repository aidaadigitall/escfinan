import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "qrcode";

export type DocumentType = "quote" | "sale" | "service_order";
export type PrintFormat = "a4" | "coupon" | "label";

// Generate QR Code as base64 data URL
export const generateQRCodeDataURL = async (url: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(url, {
      width: 100,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Error generating QR Code:", error);
    return "";
  }
};

interface CompanyInfo {
  company_name?: string | null;
  trading_name?: string | null;
  cnpj?: string | null;
  ie?: string | null;
  im?: string | null;
  phone?: string | null;
  phone2?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  logo_header_url?: string | null;
}

interface ClientInfo {
  name?: string;
  company_name?: string | null;
  cnpj?: string | null;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
}

interface DocumentItem {
  name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  subtotal: number;
  item_type: "product" | "service";
}

interface DocumentData {
  id: string;
  number: number;
  type: DocumentType;
  status?: string;
  created_at?: string;
  entry_date?: string;
  exit_date?: string;
  sale_date?: string;
  delivery_date?: string;
  payment_method?: string;
  notes?: string;
  warranty_terms?: string;
  equipment_name?: string;
  equipment_brand?: string;
  equipment_model?: string;
  equipment_serial?: string;
  equipment_memory?: string;
  equipment_storage?: string;
  equipment_processor?: string;
  defects?: string;
  technical_report?: string;
  products_total?: number;
  services_total?: number;
  discount_total?: number;
  total_amount?: number;
  client?: ClientInfo;
  items?: DocumentItem[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const getDocumentTitle = (type: DocumentType) => {
  switch (type) {
    case "quote":
      return "ORÇAMENTO";
    case "sale":
      return "PEDIDO DE VENDA";
    case "service_order":
      return "ORDEM DE SERVIÇO";
    default:
      return "DOCUMENTO";
  }
};

const getDocumentNumberPrefix = (type: DocumentType) => {
  switch (type) {
    case "quote":
      return "ORC-";
    case "sale":
      return "PED-";
    case "service_order":
      return "OS-";
    default:
      return "DOC-";
  }
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  approved: "Aprovado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  in_progress: "Em Andamento",
  waiting_parts: "Aguardando Peças",
  completed: "Concluída",
  draft: "Rascunho",
  sent: "Enviado",
  rejected: "Rejeitado",
  expired: "Expirado",
};

export const generateServiceOrderPDF = (
  document: DocumentData,
  company: CompanyInfo,
  responsibleName?: string,
  technicianName?: string
): string => {
  const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
  const services = document.items?.filter(i => i.item_type === "service") || [];
  const products = document.items?.filter(i => i.item_type === "product") || [];
  const allItems = [...services, ...products];

  const formatNumber = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ORDEM DE SERVIÇO Nº ${document.number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; }
        .container { max-width: 210mm; margin: 0 auto; padding: 10mm; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 0; }
        .header-left { display: flex; align-items: flex-start; gap: 10px; }
        .logo { width: 70px; height: 70px; object-fit: contain; }
        .company-info { font-size: 10px; line-height: 1.4; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
        .header-right { text-align: right; font-size: 10px; line-height: 1.5; }
        .header-right a { color: #000; text-decoration: none; }
        
        /* Title Bar */
        .title-bar { background: #000; color: #fff; padding: 8px 15px; display: flex; justify-content: space-between; align-items: center; }
        .title-bar h1 { font-size: 14px; font-weight: bold; margin: 0; }
        .title-bar .date { font-size: 14px; font-weight: bold; }
        
        /* Section */
        .section { border: 1px solid #000; margin-bottom: -1px; }
        .section-header { background: #e0e0e0; padding: 4px 8px; font-weight: bold; font-size: 11px; border-bottom: 1px solid #000; }
        .section-content { padding: 8px; }
        
        /* Grid Layout */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; }
        .grid-item { padding: 4px 8px; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; }
        .grid-item:last-child { border-right: none; }
        .grid-item label { font-weight: bold; font-size: 10px; display: block; margin-bottom: 2px; }
        .grid-item span { font-size: 11px; }
        
        /* Equipment grid */
        .equip-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; }
        
        /* Text blocks */
        .text-block { padding: 8px; font-size: 11px; line-height: 1.5; white-space: pre-wrap; }
        .text-block-title { font-weight: bold; margin-bottom: 4px; }
        
        /* Table */
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 5px 8px; font-size: 10px; }
        th { background: #e0e0e0; font-weight: bold; text-align: center; }
        td.text-center { text-align: center; }
        td.text-right { text-align: right; }
        .total-row { background: #f5f5f5; font-weight: bold; }
        
        /* Totals */
        .totals-box { text-align: right; padding: 8px; border: 1px solid #000; border-top: none; }
        .totals-line { font-size: 12px; margin: 2px 0; }
        .totals-line.grand { font-size: 14px; font-weight: bold; }
        
        /* Payment section */
        .payment-table th, .payment-table td { border: 1px solid #000; }
        
        @media print { 
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
          .container { padding: 5mm; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            ${company.logo_header_url ? `<img src="${company.logo_header_url}" class="logo" alt="Logo">` : ''}
            <div class="company-info">
              <div class="company-name">${company.company_name || company.trading_name || 'Empresa'}</div>
              <div>CNPJ: ${company.cnpj || '-'}</div>
              <div>${company.address || ''}</div>
              <div>${company.city || ''}/${company.state || ''} - CEP: ${company.zipcode || ''}</div>
            </div>
          </div>
          <div class="header-right">
            <div>${company.phone || ''}${company.phone2 ? ' - ' + company.phone2 : ''}</div>
            <div>${company.email || ''}</div>
            <div>${company.website || ''}</div>
            <div style="margin-top: 5px;"><strong>Responsável:</strong> ${responsibleName || '-'}</div>
            <div><strong>Técnico:</strong> ${technicianName || '-'}</div>
          </div>
        </div>

        <!-- Title Bar -->
        <div class="title-bar">
          <h1>ORDEM DE SERVIÇO Nº ${document.number}</h1>
          <span class="date">${currentDate}</span>
        </div>

        <!-- Período de Execução -->
        <div class="section">
          <div class="section-header">PERÍODO DE EXECUÇÃO</div>
          <div class="section-content">
            <div class="grid-2">
              <div class="grid-item">
                <label>Entrada:</label>
                <span>${document.entry_date ? format(new Date(document.entry_date), "dd/MM/yyyy - HH:mm", { locale: ptBR }) : '-'}</span>
              </div>
              <div class="grid-item">
                <label>Saída:</label>
                <span>${document.exit_date ? format(new Date(document.exit_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
              </div>
            </div>
            <div class="grid-3" style="border-top: 1px solid #ccc;">
              <div class="grid-item">
                <label>Memória:</label>
                <span>${document.equipment_memory || '-'}</span>
              </div>
              <div class="grid-item">
                <label>HDD / SSD:</label>
                <span>${document.equipment_storage || '-'}</span>
              </div>
              <div class="grid-item">
                <label>SSD:</label>
                <span>-</span>
              </div>
            </div>
            <div style="padding: 4px 8px; border-top: 1px solid #ccc;">
              <label style="font-weight: bold; font-size: 10px;">Processador:</label>
              <span style="font-size: 11px; margin-left: 5px;">${document.equipment_processor || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Dados do Cliente -->
        <div class="section">
          <div class="section-header">DADOS DO CLIENTE</div>
          <div class="section-content" style="padding: 0;">
            <div class="grid-2">
              <div class="grid-item">
                <label>Razão social:</label>
                <span>${document.client?.company_name || document.client?.name || '-'}</span>
              </div>
              <div class="grid-item">
                <label>Nome fantasia:</label>
                <span>${document.client?.name || '-'}</span>
              </div>
            </div>
            <div class="grid-2">
              <div class="grid-item">
                <label>CNPJ/CPF:</label>
                <span>${document.client?.cnpj || document.client?.cpf || '-'}</span>
              </div>
              <div class="grid-item">
                <label>Endereço:</label>
                <span>${document.client?.address || '-'}</span>
              </div>
            </div>
            <div class="grid-2">
              <div class="grid-item">
                <label>CEP:</label>
                <span>${document.client?.zipcode || '-'}</span>
              </div>
              <div class="grid-item">
                <label>Cidade/UF:</label>
                <span>${document.client?.city || ''}/${document.client?.state || ''}</span>
              </div>
            </div>
            <div class="grid-2">
              <div class="grid-item">
                <label>Telefone:</label>
                <span>${document.client?.phone || '-'}</span>
              </div>
              <div class="grid-item">
                <label>E-mail:</label>
                <span>${document.client?.email || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipamento -->
        <div class="section">
          <div class="section-header">EQUIPAMENTO</div>
          <div class="section-content" style="padding: 0;">
            <div class="equip-grid">
              <div class="grid-item">
                <label>Nome do equipamento:</label>
                <span>${document.equipment_name || '-'}</span>
              </div>
              <div class="grid-item">
                <label>Marca:</label>
                <span>${document.equipment_brand || '-'}</span>
              </div>
              <div class="grid-item">
                <label>Modelo:</label>
                <span>${document.equipment_model || '-'}</span>
              </div>
              <div class="grid-item">
                <label>Série:</label>
                <span>${document.equipment_serial || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Defeitos -->
        ${document.defects ? `
        <div class="section">
          <div class="text-block">
            <div class="text-block-title">Defeitos</div>
            ${document.defects}
          </div>
        </div>
        ` : ''}

        <!-- Laudo Técnico -->
        ${document.technical_report ? `
        <div class="section">
          <div class="text-block">
            <div class="text-block-title">Laudo técnico</div>
            ${document.technical_report}
          </div>
        </div>
        ` : ''}

        <!-- Termos de Garantia -->
        ${document.warranty_terms ? `
        <div class="section">
          <div class="text-block">
            <div class="text-block-title">Termos de garantia</div>
            ${document.warranty_terms}
          </div>
        </div>
        ` : ''}

        <!-- Serviços Table -->
        ${allItems.length > 0 ? `
        <div class="section">
          <div class="section-header">SERVIÇOS</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">ITEM</th>
                <th>NOME</th>
                <th style="width: 60px;">QTD.</th>
                <th style="width: 80px;">VR. UNIT.</th>
                <th style="width: 60px;">DESC.</th>
                <th style="width: 90px;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${allItems.map((item, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${item.name}</td>
                  <td class="text-center">${formatNumber(item.quantity)}</td>
                  <td class="text-right">${formatNumber(item.unit_price)}</td>
                  <td class="text-right">${formatNumber(item.discount || 0)}</td>
                  <td class="text-right">${formatNumber(item.subtotal)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td class="text-center">${formatNumber(allItems.reduce((s, i) => s + i.quantity, 0))}</td>
                <td class="text-right">${formatNumber(allItems.reduce((s, i) => s + (i.unit_price * i.quantity), 0))}</td>
                <td class="text-right">${formatNumber(allItems.reduce((s, i) => s + (i.discount || 0), 0))}</td>
                <td class="text-right">${formatNumber(allItems.reduce((s, i) => s + i.subtotal, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Totals -->
        <div class="totals-box">
          <div class="totals-line"><strong>SERVIÇOS:</strong> ${formatNumber(document.services_total || 0)}</div>
          <div class="totals-line grand"><strong>TOTAL: R$ ${formatNumber(document.total_amount || 0)}</strong></div>
        </div>

        <!-- Dados do Pagamento -->
        <div class="section" style="margin-top: 15px;">
          <div class="section-header">DADOS DO PAGAMENTO</div>
          <table class="payment-table">
            <thead>
              <tr>
                <th>VENCIMENTO</th>
                <th>VALOR</th>
                <th>FORMA DE PAGAMENTO</th>
                <th>OBSERVAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${document.delivery_date ? format(new Date(document.delivery_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : '-'}</td>
                <td>${formatNumber(document.total_amount || 0)}</td>
                <td>${document.payment_method || '-'}</td>
                <td>${document.notes || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </body>
    </html>
  `;

  return html;
};

export const generateA4PDF = (
  document: DocumentData,
  company: CompanyInfo,
  qrCodeDataURL?: string
): string => {
  const title = getDocumentTitle(document.type);
  const prefix = getDocumentNumberPrefix(document.type);
  const docNumber = `${prefix}${document.number}`;
  const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
  const services = document.items?.filter(i => i.item_type === "service") || [];
  const products = document.items?.filter(i => i.item_type === "product") || [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} Nº ${document.number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 10px; }
        .logo { width: 80px; height: 80px; object-fit: contain; }
        .company-info { font-size: 11px; }
        .company-name { font-size: 16px; font-weight: bold; }
        .contact-info { text-align: right; font-size: 11px; }
        .title-bar { background: #000; color: #fff; padding: 8px 15px; margin-bottom: 15px; display: flex; justify-content: space-between; }
        .title { font-size: 14px; font-weight: bold; }
        .date { font-size: 12px; }
        .section { margin-bottom: 15px; }
        .section-title { background: #f0f0f0; padding: 5px 10px; font-weight: bold; margin-bottom: 8px; border-left: 3px solid #000; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 10px; }
        .info-item { display: flex; }
        .info-label { font-weight: bold; min-width: 100px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { background: #f9f9f9; padding: 10px; margin-top: 15px; }
        .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .totals-row.total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; margin-top: 5px; padding-top: 8px; }
        .signatures { display: flex; justify-content: space-around; margin-top: 50px; padding-top: 20px; }
        .signature { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-bottom: 5px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; }
        .badge-approved { background: #d4edda; color: #155724; }
        .badge-pending { background: #fff3cd; color: #856404; }
        .qr-section { text-align: center; margin-top: 20px; padding: 10px; border: 1px dashed #ccc; }
        .qr-code { width: 100px; height: 100px; }
        .qr-text { font-size: 10px; color: #666; margin-top: 5px; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            ${company.logo_header_url ? `<img src="${company.logo_header_url}" class="logo" alt="Logo">` : ''}
            <div class="company-info">
              <div class="company-name">${company.company_name || company.trading_name || 'Empresa'}</div>
              <div>CNPJ: ${company.cnpj || '-'}</div>
              <div>${company.address || ''}</div>
              <div>${company.city || ''}${company.state ? '/' + company.state : ''} - CEP: ${company.zipcode || ''}</div>
            </div>
          </div>
          <div class="contact-info">
            <div>📞 ${company.phone || ''}${company.phone2 ? ' / ' + company.phone2 : ''}</div>
            <div>✉ ${company.email || ''}</div>
            ${company.website ? `<div>🌐 ${company.website}</div>` : ''}
          </div>
        </div>

        <div class="title-bar">
          <span class="title">${title} Nº ${document.number}</span>
          <span class="date">${currentDate}</span>
        </div>

        ${document.type === "service_order" ? `
        <div class="section">
          <div class="section-title">📅 PERÍODO DE EXECUÇÃO</div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Entrada:</span> ${document.entry_date ? format(new Date(document.entry_date), "dd/MM/yyyy - HH:mm", { locale: ptBR }) : '-'}</div>
            <div class="info-item"><span class="info-label">Saída:</span> ${document.exit_date ? format(new Date(document.exit_date), "dd/MM/yyyy - HH:mm", { locale: ptBR }) : '-'}</div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">👤 DADOS DO CLIENTE</div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Razão social:</span> ${document.client?.company_name || document.client?.name || '-'}</div>
            <div class="info-item"><span class="info-label">Nome fantasia:</span> ${document.client?.name || '-'}</div>
            <div class="info-item"><span class="info-label">CNPJ/CPF:</span> ${document.client?.cnpj || document.client?.cpf || '-'}</div>
            <div class="info-item"><span class="info-label">Endereço:</span> ${document.client?.address || '-'}</div>
            <div class="info-item"><span class="info-label">CEP:</span> ${document.client?.zipcode || '-'}</div>
            <div class="info-item"><span class="info-label">Cidade/UF:</span> ${document.client?.city || ''}${document.client?.state ? '/' + document.client.state : ''}</div>
            <div class="info-item"><span class="info-label">Telefone:</span> ${document.client?.phone || '-'}</div>
            <div class="info-item"><span class="info-label">E-mail:</span> ${document.client?.email || '-'}</div>
          </div>
        </div>

        ${document.type === "service_order" && document.equipment_name ? `
        <div class="section">
          <div class="section-title">💻 EQUIPAMENTO</div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Equipamento:</span> ${document.equipment_name || '-'}</div>
            <div class="info-item"><span class="info-label">Marca:</span> ${document.equipment_brand || '-'}</div>
            <div class="info-item"><span class="info-label">Modelo:</span> ${document.equipment_model || '-'}</div>
            <div class="info-item"><span class="info-label">Serial:</span> ${document.equipment_serial || '-'}</div>
            ${document.equipment_memory ? `<div class="info-item"><span class="info-label">Memória:</span> ${document.equipment_memory}</div>` : ''}
            ${document.equipment_storage ? `<div class="info-item"><span class="info-label">Armazenamento:</span> ${document.equipment_storage}</div>` : ''}
            ${document.equipment_processor ? `<div class="info-item"><span class="info-label">Processador:</span> ${document.equipment_processor}</div>` : ''}
          </div>
          ${document.defects ? `<div style="padding: 10px;"><strong>Defeitos:</strong> ${document.defects}</div>` : ''}
        </div>
        ` : ''}

        ${services.length > 0 ? `
        <div class="section">
          <div class="section-title">🔧 SERVIÇOS</div>
          <table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>NOME</th>
                <th class="text-center">QTD.</th>
                <th class="text-right">VR. UNIT.</th>
                <th class="text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${services.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.name}</td>
                  <td class="text-center">${item.quantity.toFixed(2)}</td>
                  <td class="text-right">${formatCurrency(item.unit_price)}</td>
                  <td class="text-right">${formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="2"><strong>TOTAL</strong></td>
                <td class="text-center">${services.reduce((s, i) => s + i.quantity, 0).toFixed(2)}</td>
                <td></td>
                <td class="text-right"><strong>${formatCurrency(document.services_total || 0)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        ${products.length > 0 ? `
        <div class="section">
          <div class="section-title">📦 PRODUTOS</div>
          <table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>NOME</th>
                <th class="text-center">UND.</th>
                <th class="text-center">QTD.</th>
                <th class="text-right">VR. UNIT.</th>
                <th class="text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.name}</td>
                  <td class="text-center">${item.unit || 'UN'}</td>
                  <td class="text-center">${item.quantity.toFixed(2)}</td>
                  <td class="text-right">${formatCurrency(item.unit_price)}</td>
                  <td class="text-right">${formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3"><strong>TOTAL</strong></td>
                <td class="text-center">${products.reduce((s, i) => s + i.quantity, 0).toFixed(2)}</td>
                <td></td>
                <td class="text-right"><strong>${formatCurrency(document.products_total || 0)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        ${document.payment_method ? `
        <div class="section">
          <div class="section-title">💳 DADOS DO PAGAMENTO</div>
          <table>
            <thead>
              <tr>
                <th>VENCIMENTO</th>
                <th>VALOR</th>
                <th>FORMA DE PAGAMENTO</th>
                <th>OBSERVAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${document.delivery_date ? format(new Date(document.delivery_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : '-'}</td>
                <td>${formatCurrency(document.total_amount || 0)}</td>
                <td>${document.payment_method}</td>
                <td>${document.notes || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="totals">
          <div class="totals-row"><span>PRODUTOS:</span> <span>${formatCurrency(document.products_total || 0)}</span></div>
          <div class="totals-row"><span>SERVIÇOS:</span> <span>${formatCurrency(document.services_total || 0)}</span></div>
          ${document.discount_total ? `<div class="totals-row"><span>DESCONTO:</span> <span>-${formatCurrency(document.discount_total)}</span></div>` : ''}
          <div class="totals-row total"><span>TOTAL:</span> <span>R$ ${formatCurrency(document.total_amount || 0)}</span></div>
        </div>

        ${document.warranty_terms ? `
        <div class="section" style="margin-top: 20px;">
          <div class="section-title">📋 TERMOS DE GARANTIA</div>
          <div style="padding: 10px; font-size: 11px;">${document.warranty_terms}</div>
        </div>
        ` : ''}

        <div class="signatures">
          <div class="signature">
            <div class="signature-line"></div>
            <div>Assinatura do cliente</div>
          </div>
          ${qrCodeDataURL ? `
          <div class="qr-section">
            <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code">
            <div class="qr-text">Escaneie para acessar o documento online</div>
          </div>
          ` : ''}
          <div class="signature">
            <div class="signature-line"></div>
            <div>Assinatura do técnico</div>
          </div>
        </div>

        <div class="footer">
          Documento emitido por ${company.company_name || 'Sistema'} - ${company.website || ''}
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

export const generateCouponPDF = (
  document: DocumentData,
  company: CompanyInfo
): string => {
  const title = getDocumentTitle(document.type);
  const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
  const services = document.items?.filter(i => i.item_type === "service") || [];
  const products = document.items?.filter(i => i.item_type === "product") || [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} Nº ${document.number} - Cupom</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 10px; width: 80mm; margin: 0 auto; }
        .container { padding: 5mm; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        .header { margin-bottom: 10px; }
        .company-name { font-weight: bold; font-size: 12px; }
        .title { font-weight: bold; font-size: 11px; margin: 8px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .item-row { margin: 3px 0; }
        .item-name { font-weight: bold; }
        .item-details { display: flex; justify-content: space-between; padding-left: 10px; }
        .total-row { font-weight: bold; font-size: 11px; }
        .footer { margin-top: 15px; font-size: 9px; }
        @media print { 
          body { width: 80mm; } 
          @page { size: 80mm auto; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header center">
          ${company.logo_header_url ? `<img src="${company.logo_header_url}" style="width: 50px; height: 50px; object-fit: contain;">` : ''}
          <div class="company-name">${company.company_name || 'Empresa'}</div>
          <div>CNPJ: ${company.cnpj || '-'}</div>
          <div>${company.address || ''}</div>
          <div>${company.city || ''}${company.state ? ' - ' + company.state : ''}</div>
          <div>CEP: ${company.zipcode || ''}</div>
          <div>📞 ${company.phone || ''}${company.phone2 ? ' / ' + company.phone2 : ''}</div>
        </div>

        <div class="divider"></div>

        <div class="title center">${title} Nº ${document.number}</div>
        
        <div class="info-row"><span>Data:</span><span>${currentDate}</span></div>
        <div class="info-row"><span>Cliente:</span><span>${document.client?.name || '-'}</span></div>
        <div class="info-row"><span>CNPJ/CPF:</span><span>${document.client?.cnpj || document.client?.cpf || '-'}</span></div>

        ${document.type === "service_order" ? `
        <div class="divider"></div>
        <div class="title">📦 EQUIPAMENTO</div>
        <div class="info-row"><span>Equip.:</span><span>${document.equipment_name || '-'}</span></div>
        ` : ''}

        ${services.length > 0 ? `
        <div class="divider"></div>
        <div class="title">DETALHES DO SERVIÇO</div>
        <div class="info-row" style="font-weight: bold;"><span>NOME</span><span>QTD  VL.UNT. DESC  TOTAL</span></div>
        ${services.map(item => `
          <div class="item-row">
            <div class="item-name">${item.name}</div>
            <div class="item-details">
              <span>${item.quantity.toFixed(2)}</span>
              <span>${formatCurrency(item.unit_price)}</span>
              <span>${formatCurrency(item.discount || 0)}</span>
              <span>${formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        `).join('')}
        ` : ''}

        ${products.length > 0 ? `
        <div class="divider"></div>
        <div class="title">DETALHES DA VENDA</div>
        <div class="info-row" style="font-weight: bold;"><span>NOME</span><span>QTD  VL.UNT. DESC  TOTAL</span></div>
        ${products.map(item => `
          <div class="item-row">
            <div class="item-name">${item.name}</div>
            <div class="item-details">
              <span>${item.quantity.toFixed(2)}</span>
              <span>${formatCurrency(item.unit_price)}</span>
              <span>${formatCurrency(item.discount || 0)}</span>
              <span>${formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        `).join('')}
        ` : ''}

        <div class="divider"></div>
        <div class="info-row"><span>Total do ${document.type === 'service_order' ? 'serviço' : 'documento'}:</span><span>${formatCurrency(document.total_amount || 0)}</span></div>

        ${document.payment_method ? `
        <div class="divider"></div>
        <div class="title">PAGAMENTO</div>
        <div class="info-row"><span>Vencimento</span><span>Valor</span><span>Forma de pag.</span><span>Obs.</span></div>
        <div class="info-row">
          <span>${document.delivery_date ? format(new Date(document.delivery_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
          <span>${formatCurrency(document.total_amount || 0)}</span>
          <span>${document.payment_method}</span>
        </div>
        ` : ''}

        <div class="divider"></div>
        <div class="center" style="font-size: 9px; margin-top: 5px;">
          *** Este cupom não é documento fiscal ***
        </div>

        ${document.type === "service_order" && document.entry_date ? `
        <div class="info-row" style="margin-top: 10px;">
          <span>Ent: ${format(new Date(document.entry_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          <span>Saída: ${document.exit_date ? format(new Date(document.exit_date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</span>
        </div>
        ` : ''}

        <div class="divider"></div>
        <div style="margin-top: 20px;">
          <div style="border-top: 1px solid #000; width: 60%; margin: 0 auto;"></div>
          <div class="center">Assinatura do cliente</div>
        </div>
        <div style="margin-top: 15px;">
          <div style="border-top: 1px solid #000; width: 60%; margin: 0 auto;"></div>
          <div class="center">Assinatura do técnico</div>
        </div>

        <div class="footer center">
          Software ${company.company_name || ''} - ${company.website || ''}
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

export const openPrintWindow = (html: string, format: PrintFormat = "a4") => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

export const openViewWindow = (html: string) => {
  const viewWindow = window.open('', '_blank');
  if (viewWindow) {
    viewWindow.document.write(html);
    viewWindow.document.close();
  }
};

export const generateWhatsAppMessage = (
  document: DocumentData,
  company: CompanyInfo,
  linkUrl?: string
): string => {
  const title = getDocumentTitle(document.type);
  const prefix = getDocumentNumberPrefix(document.type);
  
  let message = `*${title} Nº ${document.number}*\n\n`;
  message += `📋 *${company.company_name || 'Empresa'}*\n`;
  message += `Cliente: ${document.client?.name || '-'}\n`;
  message += `Valor: ${formatCurrency(document.total_amount || 0)}\n`;
  
  if (document.status) {
    message += `Status: ${statusLabels[document.status] || document.status}\n`;
  }
  
  if (linkUrl) {
    message += `\n🔗 Visualizar documento:\n${linkUrl}`;
  }
  
  message += `\n\n---\nEnviado por ${company.company_name || 'Sistema'}`;
  
  return encodeURIComponent(message);
};

export const generateEmailContent = (
  document: DocumentData,
  company: CompanyInfo
): { subject: string; body: string } => {
  const title = getDocumentTitle(document.type);
  
  const subject = `${title} Nº ${document.number} - ${company.company_name || 'Empresa'}`;
  
  let body = `Prezado(a) ${document.client?.name || 'Cliente'},\n\n`;
  body += `Segue ${title.toLowerCase()} nº ${document.number} conforme solicitado.\n\n`;
  body += `Valor Total: ${formatCurrency(document.total_amount || 0)}\n`;
  
  if (document.status) {
    body += `Status: ${statusLabels[document.status] || document.status}\n`;
  }
  
  body += `\n\nQualquer dúvida, estamos à disposição.\n\n`;
  body += `Atenciosamente,\n${company.company_name || 'Empresa'}\n`;
  body += `${company.phone || ''}\n${company.email || ''}`;
  
  return { subject, body };
};
