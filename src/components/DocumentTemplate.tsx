import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface DocumentItem {
  id?: string;
  name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  subtotal: number;
  item_type?: "product" | "service";
}

interface DocumentData {
  id?: string | number;
  number?: number;
  order_number?: number;
  quote_number?: number;
  sale_number?: number;
  created_at?: string;
  entry_date?: string;
  exit_date?: string;
  validity_date?: string;
  validity_days?: number;
  delivery_date?: string;
  sale_date?: string;
  status?: string;
  equipment_name?: string;
  equipment_brand?: string;
  equipment_model?: string;
  equipment_serial?: string;
  equipment_memory?: string;
  equipment_storage?: string;
  equipment_processor?: string;
  conditions?: string;
  defects?: string;
  solution?: string;
  technical_report?: string;
  warranty_terms?: string;
  payment_method?: string;
  payment_terms?: string;
  total_amount?: number;
  products_total?: number;
  services_total?: number;
  discount_total?: number;
  discount_amount?: number;
  notes?: string;
  internal_notes?: string;
  client?: {
    name?: string;
    fantasy_name?: string;
    company_name?: string;
    document?: string;
    cnpj?: string;
    cpf?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    zipcode?: string;
    phone?: string;
    email?: string;
  };
  technician?: { name?: string } | string;
  seller?: { name?: string } | string;
  responsible?: { name?: string } | string;
}

interface CompanySettings {
  name?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  responsible?: string;
  technician?: string;
}

interface DocumentTemplateProps {
  type: "os" | "budget" | "sale";
  data: DocumentData;
  items: DocumentItem[];
  company: CompanySettings;
}

export const DocumentTemplate = React.forwardRef<HTMLDivElement, DocumentTemplateProps>(
  ({ type, data, items, company }, ref) => {
    const titleMap = {
      os: "ORDEM DE SERVIÇO",
      budget: "ORÇAMENTO",
      sale: "PEDIDO",
    };

    const docNumber = data.number || data.order_number || data.quote_number || data.sale_number || data.id || 0;
    const docDate = data.created_at ? format(new Date(data.created_at), "dd/MM/yyyy", { locale: ptBR }) : "";

    const formatDate = (dateString?: string) => {
      if (!dateString) return "";
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    };

    const formatDateTime = (dateString?: string) => {
      if (!dateString) return "___/___/_____ - __:__";
      return format(new Date(dateString), "dd/MM/yyyy - HH:mm", { locale: ptBR });
    };

    // Separate items by type
    const serviceItems = items.filter(item => item.item_type === "service");
    const productItems = items.filter(item => item.item_type === "product");
    
    // If no item_type, treat all as products (for backwards compatibility)
    const hasTypedItems = items.some(item => item.item_type);
    const displayServiceItems = hasTypedItems ? serviceItems : [];
    const displayProductItems = hasTypedItems ? productItems : items;

    const productsTotal = data.products_total || displayProductItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const servicesTotal = data.services_total || displayServiceItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const totalAmount = data.total_amount || productsTotal + servicesTotal;

    const client = data.client || {};
    const clientDocument = client.cnpj || client.cpf || client.document || "";

    const getPersonName = (person?: { name?: string } | string) => {
      if (!person) return "";
      if (typeof person === "string") return person;
      return person.name || "";
    };

    // Determine delivery/validity label and date
    const getDeliveryInfo = () => {
      if (type === "budget") {
        return { label: "PREVISÃO DE ENTREGA:", date: formatDate(data.delivery_date) };
      } else if (type === "sale") {
        return { label: "PRAZO DE ENTREGA:", date: formatDate(data.delivery_date) };
      }
      return null;
    };

    const deliveryInfo = getDeliveryInfo();

    return (
      <div ref={ref} className="bg-white text-black max-w-[210mm] mx-auto font-sans text-[10px] leading-tight p-6">
        <style>{`
          @media print {
            @page { size: A4; margin: 8mm; }
            html, body { 
              height: auto !important; 
              min-height: auto !important; 
              background: white !important;
            }
            * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
          @media screen {
            body { background: white !important; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-start mb-3 pb-2 border-b-2 border-black">
          {/* Logo */}
          <div className="w-24 mr-3 flex-shrink-0">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="max-h-14 max-w-full object-contain" />
            ) : (
              <div className="h-14 flex items-center justify-center border border-gray-300 text-gray-400 text-[8px]">LOGO</div>
            )}
          </div>
          
          {/* Company Info */}
          <div className="flex-1 text-[9px]">
            <div className="font-bold text-sm uppercase">{company.name || "EMPRESA"}</div>
            <div>CNPJ: {company.cnpj || ""}</div>
            <div>{company.address || ""}</div>
          </div>
          
          {/* Contact */}
          <div className="text-right text-[9px] flex-shrink-0">
            <div className="font-bold">{company.phone || ""}{company.phone2 ? ` - ${company.phone2}` : ""}</div>
            <div className="text-blue-600">{company.email || ""}</div>
            <div className="text-blue-600">{company.website || ""}</div>
            {type === "os" && company.responsible && <div>Responsável: <span className="font-semibold">{company.responsible}</span></div>}
            {type === "os" && company.technician && <div>Técnico: <span className="font-semibold">{company.technician}</span></div>}
            {type !== "os" && getPersonName(data.seller) && <div>Vendedor: <span className="font-semibold">{getPersonName(data.seller)}</span></div>}
          </div>
        </div>

        {/* Document Title */}
        <div className="flex justify-between items-center bg-black text-white px-3 py-1.5 mb-3">
          <span className="font-bold text-xs">{titleMap[type]} Nº {docNumber}</span>
          <span className="text-xs font-bold">{docDate}</span>
        </div>

        {/* Delivery/Validity Info for Budget and Sale */}
        {deliveryInfo && deliveryInfo.date && (
          <div className="mb-3 text-[10px] font-bold border border-black px-2 py-1">
            {deliveryInfo.label} {deliveryInfo.date}
          </div>
        )}

        {/* Período de Execução (OS only) */}
        {type === "os" && (
          <div className="mb-3">
            <div className="bg-amber-400 text-black px-2 py-0.5 font-bold text-[9px]">
              PERÍODO DE EXECUÇÃO
            </div>
            <div className="border border-black text-[9px]">
              <div className="flex border-b border-black">
                <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Entrada:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{formatDateTime(data.entry_date)}</div>
                <div className="w-16 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Saída:</div>
                <div className="flex-1 px-2 py-1">{formatDateTime(data.exit_date)}</div>
              </div>
              <div className="flex">
                <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Memória:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{data.equipment_memory || ""}</div>
                <div className="w-24 px-2 py-1 font-semibold bg-gray-100 border-r border-black">HDD / SSD:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{data.equipment_storage || ""}</div>
                <div className="w-24 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Processador:</div>
                <div className="flex-1 px-2 py-1">{data.equipment_processor || ""}</div>
              </div>
            </div>
          </div>
        )}

        {/* Client Data */}
        <div className="mb-3">
          <div className="bg-gray-800 text-white px-2 py-0.5 font-bold text-[9px]">
            DADOS DO CLIENTE
          </div>
          <div className="border border-black text-[9px]">
            <div className="flex border-b border-black">
              <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Razão social:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{client.company_name || client.name || ""}</div>
              <div className="w-24 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Nome fantasia:</div>
              <div className="flex-1 px-2 py-1">{client.fantasy_name || client.name || ""}</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">CNPJ/CPF:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{clientDocument}</div>
              <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Endereço:</div>
              <div className="flex-1 px-2 py-1">{client.address || ""}</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">CEP:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{client.zipcode || client.zip_code || ""}</div>
              <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Cidade/UF:</div>
              <div className="flex-1 px-2 py-1">{client.city || ""}/{client.state || ""}</div>
            </div>
            <div className="flex">
              <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Telefone:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{client.phone || ""}</div>
              <div className="w-20 px-2 py-1 font-semibold bg-gray-100 border-r border-black">E-mail:</div>
              <div className="flex-1 px-2 py-1">{client.email || ""}</div>
            </div>
          </div>
        </div>

        {/* Equipment (OS only) */}
        {type === "os" && (
          <div className="mb-3">
            <div className="bg-gray-800 text-white px-2 py-0.5 font-bold text-[9px]">
              EQUIPAMENTO
            </div>
            <div className="border border-black text-[9px]">
              <div className="flex">
                <div className="w-32 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Nome do equipamento:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{data.equipment_name || ""}</div>
                <div className="w-14 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Marca:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{data.equipment_brand || ""}</div>
                <div className="w-16 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Modelo:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{data.equipment_model || ""}</div>
                <div className="w-12 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Série:</div>
                <div className="w-28 px-2 py-1">{data.equipment_serial || ""}</div>
              </div>
            </div>
          </div>
        )}

        {/* Defects (OS only) */}
        {type === "os" && (
          <div className="mb-3">
            <div className="border border-black text-[9px]">
              <div className="flex">
                <div className="w-16 px-2 py-1 font-semibold bg-gray-100 border-r border-black">Defeitos:</div>
                <div className="flex-1 px-2 py-1 whitespace-pre-wrap">{data.defects || ""}</div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Report (OS only) */}
        {type === "os" && (
          <div className="mb-3">
            <div className="border border-black text-[9px]">
              <div className="px-2 py-0.5 font-semibold bg-gray-100 border-b border-black text-red-600 underline">Laudo técnico</div>
              <div className="px-2 py-1 whitespace-pre-wrap min-h-[20px]">{data.technical_report || data.solution || ""}</div>
            </div>
          </div>
        )}

        {/* Warranty Terms (OS only) */}
        {type === "os" && data.warranty_terms && (
          <div className="mb-3">
            <div className="border border-black text-[9px]">
              <div className="px-2 py-0.5 font-semibold bg-gray-100 border-b border-black text-red-600 underline">Termos de garantia</div>
              <div className="px-2 py-1 whitespace-pre-wrap min-h-[20px] text-red-600">{data.warranty_terms || ""}</div>
            </div>
          </div>
        )}

        {/* Services Table (OS only or when there are services) */}
        {displayServiceItems.length > 0 && (
          <div className="mb-3">
            <div className="bg-gray-800 text-white px-2 py-0.5 font-bold text-[9px]">
              SERVIÇOS
            </div>
            <table className="w-full border border-black text-[9px] border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-1 py-0.5 border border-black text-left w-10 font-bold">ITEM</th>
                  <th className="px-1 py-0.5 border border-black text-left font-bold">NOME</th>
                  <th className="px-1 py-0.5 border border-black text-center w-12 font-bold">QTD.</th>
                  <th className="px-1 py-0.5 border border-black text-right w-20 font-bold">VR. UNIT.</th>
                  <th className="px-1 py-0.5 border border-black text-right w-16 font-bold">DESC.</th>
                  <th className="px-1 py-0.5 border border-black text-right w-20 font-bold">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {displayServiceItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="px-1 py-0.5 border border-black text-center">{idx + 1}</td>
                    <td className="px-1 py-0.5 border border-black">{item.name}</td>
                    <td className="px-1 py-0.5 border border-black text-center">{item.quantity.toFixed(2).replace(".", ",")}</td>
                    <td className="px-1 py-0.5 border border-black text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-1 py-0.5 border border-black text-right">{item.discount ? formatCurrency(item.discount) : "-----"}</td>
                    <td className="px-1 py-0.5 border border-black text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td className="px-1 py-0.5 border border-black text-left" colSpan={2}>TOTAL</td>
                  <td className="px-1 py-0.5 border border-black text-center">
                    {displayServiceItems.reduce((acc, item) => acc + item.quantity, 0).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-1 py-0.5 border border-black text-right">
                    {formatCurrency(displayServiceItems.reduce((acc, item) => acc + item.unit_price, 0))}
                  </td>
                  <td className="px-1 py-0.5 border border-black text-right">
                    {formatCurrency(displayServiceItems.reduce((acc, item) => acc + (item.discount || 0), 0))}
                  </td>
                  <td className="px-1 py-0.5 border border-black text-right">{formatCurrency(servicesTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Products Table */}
        {displayProductItems.length > 0 && (
          <div className="mb-3">
            <div className="bg-gray-800 text-white px-2 py-0.5 font-bold text-[9px]">
              PRODUTOS
            </div>
            <table className="w-full border border-black text-[9px] border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-1 py-0.5 border border-black text-left w-10 font-bold">ITEM</th>
                  <th className="px-1 py-0.5 border border-black text-left font-bold">NOME</th>
                  <th className="px-1 py-0.5 border border-black text-center w-12 font-bold">UND.</th>
                  <th className="px-1 py-0.5 border border-black text-center w-12 font-bold">QTD.</th>
                  <th className="px-1 py-0.5 border border-black text-right w-20 font-bold">VR. UNIT.</th>
                  <th className="px-1 py-0.5 border border-black text-right w-16 font-bold">DESC.</th>
                  <th className="px-1 py-0.5 border border-black text-right w-20 font-bold">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {displayProductItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="px-1 py-0.5 border border-black text-center">{idx + 1}</td>
                    <td className="px-1 py-0.5 border border-black">{item.name}</td>
                    <td className="px-1 py-0.5 border border-black text-center">{item.unit || "UN"}</td>
                    <td className="px-1 py-0.5 border border-black text-center">{item.quantity.toFixed(2).replace(".", ",")}</td>
                    <td className="px-1 py-0.5 border border-black text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-1 py-0.5 border border-black text-right">{item.discount ? formatCurrency(item.discount) : "-----"}</td>
                    <td className="px-1 py-0.5 border border-black text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td className="px-1 py-0.5 border border-black text-left" colSpan={3}>TOTAL</td>
                  <td className="px-1 py-0.5 border border-black text-center">
                    {displayProductItems.reduce((acc, item) => acc + item.quantity, 0).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-1 py-0.5 border border-black text-right">
                    {formatCurrency(displayProductItems.reduce((acc, item) => acc + item.unit_price, 0))}
                  </td>
                  <td className="px-1 py-0.5 border border-black text-right">
                    {formatCurrency(displayProductItems.reduce((acc, item) => acc + (item.discount || 0), 0))}
                  </td>
                  <td className="px-1 py-0.5 border border-black text-right">{formatCurrency(productsTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Totals */}
        <div className="flex justify-end mb-3">
          <div className="text-[9px] text-right">
            {displayProductItems.length > 0 && (
              <div className="flex justify-end">
                <span className="font-semibold mr-2">PRODUTOS:</span>
                <span className="w-24 text-right">{formatCurrency(productsTotal)}</span>
              </div>
            )}
            {displayServiceItems.length > 0 && (
              <div className="flex justify-end">
                <span className="font-semibold mr-2">SERVIÇOS:</span>
                <span className="w-24 text-right">{formatCurrency(servicesTotal)}</span>
              </div>
            )}
            <div className="flex justify-end font-bold">
              <span className="mr-2">TOTAL: R$</span>
              <span className="w-24 text-right">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Data */}
        <div className="mb-3">
          <div className="bg-gray-800 text-white px-2 py-0.5 font-bold text-[9px]">
            DADOS DO PAGAMENTO
          </div>
          <table className="w-full border border-black text-[9px] border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-1 py-0.5 border border-black text-left w-24 font-bold">VENCIMENTO</th>
                <th className="px-1 py-0.5 border border-black text-left w-24 font-bold">VALOR</th>
                <th className="px-1 py-0.5 border border-black text-left font-bold">FORMA DE PAGAMENTO</th>
                <th className="px-1 py-0.5 border border-black text-left font-bold">OBSERVAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-1 py-0.5 border border-black">
                  {formatDate(data.delivery_date) || docDate}
                </td>
                <td className="px-1 py-0.5 border border-black">{formatCurrency(totalAmount)}</td>
                <td className="px-1 py-0.5 border border-black">{data.payment_method || "A Combinar"}</td>
                <td className="px-1 py-0.5 border border-black"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observations (for budget and sale - warranty/notes section) */}
        {type !== "os" && (data.warranty_terms || data.notes) && (
          <div className="mb-3">
            <div className="bg-gray-800 text-white px-2 py-0.5 font-bold text-[9px]">
              OBSERVAÇÕES
            </div>
            <div className="border border-black px-2 py-1 text-[9px] min-h-[30px] whitespace-pre-wrap">
              {data.warranty_terms || data.notes}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="border border-black p-4 mt-6 mb-4">
          <div className="flex justify-between">
            <div className="w-56 text-center">
              <div className="border-t border-black pt-1 text-[9px]">
                Assinatura do cliente
              </div>
            </div>
            {type === "os" && (
              <div className="w-56 text-center">
                <div className="border-t border-black pt-1 text-[9px]">
                  Assinatura do técnico
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[8px] text-gray-500 mt-4">
          {titleMap[type]} emitido no Esc Solutions – {company.website || "www.escinformaticago.com.br"}
        </div>
      </div>
    );
  }
);

DocumentTemplate.displayName = "DocumentTemplate";
