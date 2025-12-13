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

    const totalAmount = data.total_amount || items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const discountTotal = data.discount_total || data.discount_amount || 0;

    const client = data.client || {};
    const clientDocument = client.cnpj || client.cpf || client.document || "";

    const getSellerName = () => {
      if (!data.seller) return "";
      if (typeof data.seller === "string") return data.seller;
      return data.seller.name || "";
    };

    return (
      <div ref={ref} className="bg-white text-black max-w-[210mm] mx-auto font-sans text-[10px] leading-tight p-8">
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
        <div className="flex items-start mb-4 pb-2 border-b-2 border-black">
          {/* Logo */}
          <div className="w-28 mr-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="max-h-16 max-w-full object-contain" />
            ) : (
              <div className="h-16 flex items-center justify-center border border-gray-300 text-gray-400 text-xs">LOGO</div>
            )}
          </div>
          
          {/* Company Info */}
          <div className="flex-1 text-[10px]">
            <div className="font-bold text-base uppercase">{company.name || "EMPRESA"}</div>
            <div>CNPJ: {company.cnpj || ""}</div>
            <div>{company.address || ""}</div>
          </div>
          
          {/* Contact */}
          <div className="text-right text-[10px]">
            <div className="font-bold">{company.phone || ""}</div>
            <div className="text-blue-600">{company.website || ""}</div>
          </div>
        </div>

        {/* Document Title */}
        <div className="flex justify-between items-center bg-black text-white px-3 py-2 mb-4">
          <span className="font-bold text-sm">{titleMap[type]} Nº {docNumber}</span>
          <span className="text-sm">{docDate}</span>
        </div>

        {/* Client Data */}
        <div className="mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
            DADOS DO CLIENTE
          </div>
          <div className="border border-black text-[10px]">
            <div className="flex border-b border-black">
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">Razão social:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{client.company_name || client.name || ""}</div>
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">Nome fantasia:</div>
              <div className="flex-1 px-2 py-1">{client.fantasy_name || client.name || ""}</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">CNPJ/CPF:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{clientDocument}</div>
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">Endereço:</div>
              <div className="flex-1 px-2 py-1">{client.address || ""}</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">CEP:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{client.zipcode || client.zip_code || ""}</div>
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">Cidade/UF:</div>
              <div className="flex-1 px-2 py-1">{client.city || ""}{client.city && client.state ? "/" : ""}{client.state || ""}</div>
            </div>
            <div className="flex">
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">Telefone:</div>
              <div className="flex-1 px-2 py-1 border-r border-black">{client.phone || ""}</div>
              <div className="w-24 px-2 py-1 font-semibold bg-gray-50">E-mail:</div>
              <div className="flex-1 px-2 py-1">{client.email || ""}</div>
            </div>
          </div>
        </div>

        {/* Equipment (OS only) */}
        {type === "os" && (data.equipment_name || data.equipment_brand || data.equipment_model) && (
          <div className="mb-4">
            <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
              EQUIPAMENTO
            </div>
            <div className="border border-black text-[10px]">
              <div className="flex border-b border-black">
                <div className="w-24 px-2 py-1 font-semibold bg-gray-50">Equipamento:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{data.equipment_name || ""}</div>
                <div className="w-16 px-2 py-1 font-semibold bg-gray-50">Marca:</div>
                <div className="flex-1 px-2 py-1">{data.equipment_brand || ""}</div>
              </div>
              <div className="flex">
                <div className="w-24 px-2 py-1 font-semibold bg-gray-50">Modelo:</div>
                <div className="flex-1 px-2 py-1 border-r border-black">{data.equipment_model || ""}</div>
                <div className="w-16 px-2 py-1 font-semibold bg-gray-50">N/S:</div>
                <div className="flex-1 px-2 py-1">{data.equipment_serial || ""}</div>
              </div>
            </div>
          </div>
        )}

        {/* Defects (OS only) */}
        {type === "os" && data.defects && (
          <div className="mb-4">
            <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
              DEFEITO RELATADO
            </div>
            <div className="border border-black px-2 py-2 text-[10px] whitespace-pre-wrap">
              {data.defects}
            </div>
          </div>
        )}

        {/* Products / Services */}
        {items.length > 0 && (
          <div className="mb-4">
            <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
              PRODUTOS / SERVIÇOS
            </div>
            <table className="w-full border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border-r border-b border-black text-left w-12">ITEM</th>
                  <th className="px-2 py-1 border-r border-b border-black text-left">NOME</th>
                  <th className="px-2 py-1 border-r border-b border-black text-center w-14">UND.</th>
                  <th className="px-2 py-1 border-r border-b border-black text-center w-14">QTD.</th>
                  <th className="px-2 py-1 border-r border-b border-black text-right w-20">VR. UNIT.</th>
                  <th className="px-2 py-1 border-r border-b border-black text-right w-16">DESC.</th>
                  <th className="px-2 py-1 border-b border-black text-right w-20">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="px-2 py-1 border-r border-b border-black text-center">{idx + 1}</td>
                    <td className="px-2 py-1 border-r border-b border-black">{item.name}</td>
                    <td className="px-2 py-1 border-r border-b border-black text-center">{item.unit || "UN"}</td>
                    <td className="px-2 py-1 border-r border-b border-black text-center">{item.quantity}</td>
                    <td className="px-2 py-1 border-r border-b border-black text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-2 py-1 border-r border-b border-black text-right">{item.discount ? formatCurrency(item.discount) : ""}</td>
                    <td className="px-2 py-1 border-b border-black text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-end mb-4">
          <div className="text-right font-bold text-sm">
            TOTAL: R$ {formatCurrency(totalAmount)}
          </div>
        </div>

        {/* Technical Report (OS only) */}
        {type === "os" && data.solution && (
          <div className="mb-4">
            <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
              LAUDO TÉCNICO / SOLUÇÃO
            </div>
            <div className="border border-black px-2 py-2 text-[10px] whitespace-pre-wrap">
              {data.solution}
            </div>
          </div>
        )}

        {/* Payment Data */}
        <div className="mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
            DADOS DO PAGAMENTO
          </div>
          <table className="w-full border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border-r border-b border-black text-left w-28">VENCIMENTO</th>
                <th className="px-2 py-1 border-r border-b border-black text-left w-24">VALOR</th>
                <th className="px-2 py-1 border-r border-b border-black text-left">FORMA DE PAGAMENTO</th>
                <th className="px-2 py-1 border-b border-black text-left">OBSERVAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1 border-r border-black">
                  {data.delivery_date ? formatDate(data.delivery_date) : docDate}
                </td>
                <td className="px-2 py-1 border-r border-black">R$ {formatCurrency(totalAmount)}</td>
                <td className="px-2 py-1 border-r border-black">{data.payment_method || "A Combinar"}</td>
                <td className="px-2 py-1">{data.payment_terms || ""}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observations */}
        <div className="mb-6">
          <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
            OBSERVAÇÕES
          </div>
          <div className="border border-black px-2 py-2 text-[10px] min-h-[40px]">
            {data.notes || ""}
            {deliveryDate && (
              <div>Previsão de entrega: {deliveryDate}</div>
            )}
            {type === "budget" && data.validity_date && (
              <div>Validade da proposta: {formatDate(data.validity_date)}</div>
            )}
          </div>
        </div>

        {/* Warranty (OS only) */}
        {type === "os" && data.warranty_terms && (
          <div className="mb-6">
            <div className="bg-gray-200 px-2 py-1 font-bold text-[10px] border-t border-l border-r border-black">
              TERMOS DE GARANTIA
            </div>
            <div className="border border-black px-2 py-2 text-[10px] whitespace-pre-wrap">
              {data.warranty_terms}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="flex justify-between mt-10 mb-6">
          <div className="w-64 text-center">
            <div className="border-t border-black pt-1 text-[10px]">
              Assinatura do cliente
            </div>
          </div>
          <div className="w-64 text-center">
            <div className="border-t border-black pt-1 text-[10px]">
              Assinatura do vendedor
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-right text-[8px] text-gray-500 mt-4">
          {titleMap[type]} emitido no Esc Solutions – {company.website || "www.escsistemas.com.br"}
        </div>
      </div>
    );
  }
);

DocumentTemplate.displayName = "DocumentTemplate";
