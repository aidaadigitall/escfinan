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
  delivery_date?: string;
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
  warranty_terms?: string;
  payment_method?: string;
  payment_terms?: string;
  total_amount?: number;
  products_total?: number;
  services_total?: number;
  discount_total?: number;
  discount_amount?: number;
  notes?: string;
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
}

interface CompanySettings {
  name?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
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
      sale: "PEDIDO DE VENDA",
    };

    const docNumber = data.number || data.order_number || data.quote_number || data.sale_number || data.id || 0;
    const docDate = data.created_at ? format(new Date(data.created_at), "dd/MM/yyyy", { locale: ptBR }) : "";
    
    const deliveryDate = data.delivery_date 
      ? format(new Date(data.delivery_date), "dd/MM/yyyy", { locale: ptBR }) 
      : data.exit_date 
        ? format(new Date(data.exit_date), "dd/MM/yyyy", { locale: ptBR })
        : "";

    const formatDate = (dateString?: string) => {
      if (!dateString) return "";
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    };

    const formatDateTime = (dateString?: string) => {
      if (!dateString) return "___/___/_____ - __:__";
      return format(new Date(dateString), "dd/MM/yyyy - HH:mm", { locale: ptBR });
    };

    const products = items.filter(item => item.item_type === "product");
    const services = items.filter(item => item.item_type === "service");

    const productsTotal = products.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const servicesTotal = services.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const totalAmount = data.total_amount || (productsTotal + servicesTotal);
    const discountTotal = data.discount_total || data.discount_amount || 0;

    const client = data.client || {};
    const clientDocument = client.cnpj || client.cpf || client.document || "";

    const getTechnicianName = () => {
      if (!data.technician) return "";
      if (typeof data.technician === "string") return data.technician;
      return data.technician.name || "";
    };

    const getSellerName = () => {
      if (!data.seller) return "";
      if (typeof data.seller === "string") return data.seller;
      return data.seller.name || "";
    };

    return (
      <div ref={ref} className="bg-white text-black max-w-[210mm] mx-auto font-sans text-[9px] leading-tight p-6">
        <style>{`
          @media print {
            @page { size: A4; margin: 10mm; }
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
        <div className="flex border border-black mb-3">
          {/* Logo */}
          <div className="w-24 p-2 flex items-center justify-center border-r border-black bg-black">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="max-h-14 max-w-full object-contain" />
            ) : (
              <div className="text-white text-[8px] text-center font-bold">LOGO</div>
            )}
          </div>
          
          {/* Company Info */}
          <div className="flex-1 p-2 text-[8px] border-r border-black">
            <div className="font-bold text-sm mb-1">{company.name || "EMPRESA"}</div>
            <div>CNPJ: {company.cnpj || ""}</div>
            <div>{company.address || ""}</div>
          </div>
          
          {/* Contact */}
          <div className="w-44 p-2 text-[8px] text-right">
            <div className="font-bold">{company.phone || ""}</div>
            <div className="text-blue-600">{company.email || ""}</div>
            <div className="text-blue-600">{company.website || ""}</div>
            {getSellerName() && <div className="mt-1">Vendedor: {getSellerName()}</div>}
          </div>
        </div>

        {/* Document Title Bar */}
        <div className="flex bg-black text-white mb-3">
          <div className="flex-1 p-2 font-bold text-[11px]">
            {titleMap[type]} Nº {docNumber}
          </div>
          <div className="p-2 text-[11px]">{docDate}</div>
        </div>

        {/* Delivery Date */}
        {deliveryDate && (
          <div className="bg-gray-200 p-1 mb-3 text-[9px] font-bold border border-black">
            PREVISÃO DE ENTREGA: {deliveryDate}
          </div>
        )}

        {/* OS Specific: Execution Period */}
        {type === "os" && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold border-b border-black text-[9px]">PERÍODO DE EXECUÇÃO</div>
            <div className="flex p-1 text-[8px]">
              <div className="w-1/2 border-r border-black pr-2">
                Entrada: {formatDateTime(data.entry_date)}
              </div>
              <div className="w-1/2 pl-2">
                Saída: {data.exit_date ? formatDateTime(data.exit_date) : "___/___/_____ - __:__"}
              </div>
            </div>
          </div>
        )}

        {/* Client Data */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
            DADOS DO CLIENTE
          </div>
          <table className="w-full text-[8px]">
            <tbody>
              <tr>
                <td className="p-1 border-r border-b border-black w-20 font-bold bg-gray-50">Razão social:</td>
                <td className="p-1 border-r border-b border-black">{client.company_name || client.name || ""}</td>
                <td className="p-1 border-r border-b border-black w-24 font-bold bg-gray-50">Nome fantasia:</td>
                <td className="p-1 border-b border-black">{client.fantasy_name || client.name || ""}</td>
              </tr>
              <tr>
                <td className="p-1 border-r border-b border-black font-bold bg-gray-50">CNPJ/CPF:</td>
                <td className="p-1 border-r border-b border-black">{clientDocument}</td>
                <td className="p-1 border-r border-b border-black font-bold bg-gray-50">Endereço:</td>
                <td className="p-1 border-b border-black">{client.address || ""}</td>
              </tr>
              <tr>
                <td className="p-1 border-r border-b border-black font-bold bg-gray-50">CEP:</td>
                <td className="p-1 border-r border-b border-black">{client.zipcode || client.zip_code || ""}</td>
                <td className="p-1 border-r border-b border-black font-bold bg-gray-50">Cidade/UF:</td>
                <td className="p-1 border-b border-black">{client.city || ""}{client.city && client.state ? "/" : ""}{client.state || ""}</td>
              </tr>
              <tr>
                <td className="p-1 border-r border-black font-bold bg-gray-50">Telefone:</td>
                <td className="p-1 border-r border-black">{client.phone || ""}</td>
                <td className="p-1 border-r border-black font-bold bg-gray-50">E-mail:</td>
                <td className="p-1">{client.email || ""}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Equipment (OS only) */}
        {type === "os" && (data.equipment_name || data.equipment_brand || data.equipment_model) && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
              EQUIPAMENTO
            </div>
            <table className="w-full text-[8px]">
              <tbody>
                <tr>
                  <td className="p-1 border-r border-b border-black w-24 font-bold bg-gray-50">Equipamento:</td>
                  <td className="p-1 border-r border-b border-black">{data.equipment_name || ""}</td>
                  <td className="p-1 border-r border-b border-black w-16 font-bold bg-gray-50">Marca:</td>
                  <td className="p-1 border-b border-black">{data.equipment_brand || ""}</td>
                </tr>
                <tr>
                  <td className="p-1 border-r border-black font-bold bg-gray-50">Modelo:</td>
                  <td className="p-1 border-r border-black">{data.equipment_model || ""}</td>
                  <td className="p-1 border-r border-black font-bold bg-gray-50">N/S:</td>
                  <td className="p-1">{data.equipment_serial || ""}</td>
                </tr>
              </tbody>
            </table>
            {data.equipment_memory || data.equipment_storage || data.equipment_processor ? (
              <table className="w-full text-[8px] border-t border-black">
                <tbody>
                  <tr>
                    <td className="p-1 border-r border-black w-20 font-bold bg-gray-50">Memória:</td>
                    <td className="p-1 border-r border-black">{data.equipment_memory || ""}</td>
                    <td className="p-1 border-r border-black w-20 font-bold bg-gray-50">HDD/SSD:</td>
                    <td className="p-1 border-r border-black">{data.equipment_storage || ""}</td>
                    <td className="p-1 border-r border-black w-20 font-bold bg-gray-50">Processador:</td>
                    <td className="p-1">{data.equipment_processor || ""}</td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </div>
        )}

        {/* Defects (OS only) */}
        {type === "os" && data.defects && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
              DEFEITO RELATADO
            </div>
            <div className="p-2 text-[8px] whitespace-pre-wrap">{data.defects}</div>
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
              PRODUTOS
            </div>
            <table className="w-full text-[8px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 border-r border-b border-black w-8 text-left">ITEM</th>
                  <th className="p-1 border-r border-b border-black text-left">NOME</th>
                  <th className="p-1 border-r border-b border-black w-12 text-center">UND.</th>
                  <th className="p-1 border-r border-b border-black w-12 text-center">QTD.</th>
                  <th className="p-1 border-r border-b border-black w-16 text-right">VR. UNIT.</th>
                  <th className="p-1 border-b border-black w-16 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-1 border-r border-b border-black text-center">{idx + 1}</td>
                    <td className="p-1 border-r border-b border-black">{item.name}</td>
                    <td className="p-1 border-r border-b border-black text-center">{item.unit || "UN"}</td>
                    <td className="p-1 border-r border-b border-black text-center">{item.quantity}</td>
                    <td className="p-1 border-r border-b border-black text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-1 border-b border-black text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100">
                  <td colSpan={3} className="p-1 border-r border-black font-bold text-right">TOTAL</td>
                  <td className="p-1 border-r border-black text-center font-bold">{products.reduce((a, b) => a + b.quantity, 0)}</td>
                  <td className="p-1 border-r border-black"></td>
                  <td className="p-1 border-black text-right font-bold">{formatCurrency(productsTotal)}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-right p-1 bg-gray-200 font-bold text-[9px] border-t border-black">
              PRODUTOS: {formatCurrency(productsTotal)}
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
              SERVIÇOS
            </div>
            <table className="w-full text-[8px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 border-r border-b border-black w-8 text-left">ITEM</th>
                  <th className="p-1 border-r border-b border-black text-left">NOME</th>
                  <th className="p-1 border-r border-b border-black w-12 text-center">QTD.</th>
                  <th className="p-1 border-r border-b border-black w-16 text-right">VR. UNIT.</th>
                  <th className="p-1 border-b border-black w-16 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {services.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-1 border-r border-b border-black text-center">{idx + 1}</td>
                    <td className="p-1 border-r border-b border-black">{item.name}</td>
                    <td className="p-1 border-r border-b border-black text-center">{item.quantity}</td>
                    <td className="p-1 border-r border-b border-black text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-1 border-b border-black text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right p-1 bg-gray-200 font-bold text-[9px] border-t border-black">
              SERVIÇOS: {formatCurrency(servicesTotal)}
            </div>
          </div>
        )}

        {/* Technical Report (OS only) */}
        {type === "os" && data.solution && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
              LAUDO TÉCNICO / SOLUÇÃO
            </div>
            <div className="p-2 text-[8px] whitespace-pre-wrap">{data.solution}</div>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-3">
          <div className="w-52 border border-black">
            {discountTotal > 0 && (
              <div className="flex justify-between p-1 border-b border-black text-[8px] bg-gray-50">
                <span>DESCONTO:</span>
                <span className="text-red-600">-{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between p-2 bg-gray-200 font-bold text-[11px]">
              <span>TOTAL: </span>
              <span>R$ {formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Data */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
            DADOS DO PAGAMENTO
          </div>
          <table className="w-full text-[8px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-1 border-r border-b border-black text-left w-24">VENCIMENTO</th>
                <th className="p-1 border-r border-b border-black text-left w-20">VALOR</th>
                <th className="p-1 border-r border-b border-black text-left">FORMA DE PAGAMENTO</th>
                <th className="p-1 border-b border-black text-left">OBSERVAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1 border-r border-black">
                  {data.delivery_date ? formatDate(data.delivery_date) : docDate}
                </td>
                <td className="p-1 border-r border-black">{formatCurrency(totalAmount)}</td>
                <td className="p-1 border-r border-black">{data.payment_method || "A Combinar"}</td>
                <td className="p-1">{data.payment_terms || ""}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observations */}
        {data.notes && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
              OBSERVAÇÕES
            </div>
            <div className="p-2 text-[8px] whitespace-pre-wrap">
              {data.notes}
              {type === "budget" && data.validity_date && (
                <div className="mt-1 font-bold">Validade da proposta: {formatDate(data.validity_date)}</div>
              )}
              {deliveryDate && (
                <div className="font-bold">Previsão de entrega: {deliveryDate}</div>
              )}
            </div>
          </div>
        )}

        {/* Warranty (OS only) */}
        {type === "os" && data.warranty_terms && (
          <div className="border border-black mb-3">
            <div className="bg-gray-200 p-1 font-bold text-[9px] border-b border-black">
              TERMOS DE GARANTIA
            </div>
            <div className="p-2 text-[8px] whitespace-pre-wrap">{data.warranty_terms}</div>
          </div>
        )}

        {/* Signature */}
        <div className="border border-black mb-4 p-6 mt-4">
          <div className="flex justify-center">
            <div className="w-72 text-center">
              <div className="border-t border-black mt-10 pt-1 text-[8px]">
                Assinatura do cliente
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-right text-[7px] text-gray-500">
          {titleMap[type]} emitido no Esc Solutions - {company.website || "www.escsistemas.com"}
        </div>
      </div>
    );
  }
);

DocumentTemplate.displayName = "DocumentTemplate";
