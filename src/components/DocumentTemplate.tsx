import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface DocumentItem {
  name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  subtotal: number;
  item_type?: "product" | "service";
}

interface DocumentData {
  id: string | number;
  number?: number;
  created_at: string;
  entry_date?: string;
  exit_date?: string;
  validity_date?: string; // For budgets
  delivery_date?: string; // For sales/budgets
  status?: string;
  
  // Equipment (OS only)
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
  
  // Payment
  payment_method?: string;
  payment_terms?: string; // e.g. "30 days"
  total_amount: number;
  discount_amount?: number;
  
  notes?: string;
  
  // Relations
  client?: {
    name: string;
    fantasy_name?: string;
    document?: string; // CPF/CNPJ
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    email?: string;
  };
  
  technician?: {
    name: string;
  };
  
  seller?: {
    name: string;
  };
}

interface CompanySettings {
  name: string;
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
      sale: "PEDIDO / VENDA",
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return "___/___/_____";
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    };

    const formatDateTime = (dateString?: string) => {
      if (!dateString) return "___/___/_____ - __:__";
      return format(new Date(dateString), "dd/MM/yyyy - HH:mm", { locale: ptBR });
    };

    const totalServices = items
      .filter((i) => i.item_type === "service" || !i.item_type) // Default to service if undefined in some contexts, or check logic
      .reduce((acc, item) => acc + item.subtotal, 0);

    const totalProducts = items
      .filter((i) => i.item_type === "product")
      .reduce((acc, item) => acc + item.subtotal, 0);

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-[210mm] mx-auto min-h-[297mm] text-[10px] leading-tight font-sans print:p-0 print:max-w-none">
        {/* Header */}
        <div className="flex border border-gray-300 mb-2">
          <div className="w-32 p-2 flex items-center justify-center border-r border-gray-300 bg-black text-white">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="max-w-full max-h-16 object-contain" />
            ) : (
              <div className="text-center font-bold">
                <div className="text-2xl">LOGO</div>
                <div className="text-[8px]">{company.name}</div>
              </div>
            )}
          </div>
          <div className="flex-1 p-2 border-r border-gray-300">
            <h1 className="font-bold text-sm uppercase mb-1">{company.name}</h1>
            <p>CNPJ: {company.cnpj}</p>
            <p>{company.address}</p>
          </div>
          <div className="w-64 p-2 text-right">
            <p className="font-bold">{company.phone}</p>
            <p>{company.email}</p>
            <p>{company.website}</p>
            {data.seller && <p className="mt-1">Vendedor: {data.seller.name}</p>}
            {data.technician && <p className="mt-1">Responsável: {data.technician.name}</p>}
          </div>
        </div>

        {/* Title Bar */}
        <div className="bg-gray-200 border border-gray-300 p-1 flex justify-between items-center mb-2 font-bold">
          <span className="text-sm uppercase ml-2">
            {titleMap[type]} Nº {data.number || data.id}
          </span>
          <span className="mr-2">{formatDate(data.created_at)}</span>
        </div>

        {/* OS Specific: Execution Period */}
        {type === "os" && (
          <div className="border border-gray-300 mb-2">
            <div className="bg-gray-200 p-1 font-bold border-b border-gray-300">PERÍODO DE EXECUÇÃO</div>
            <div className="flex p-1">
              <div className="w-1/2 border-r border-gray-300 pr-2">
                Entrada: {formatDateTime(data.entry_date)}
              </div>
              <div className="w-1/2 pl-2">
                Saída: {data.exit_date ? formatDateTime(data.exit_date) : "___/___/_____ - __:__"}
              </div>
            </div>
          </div>
        )}

        {/* OS Specific: Hardware Info */}
        {type === "os" && (
          <div className="border border-gray-300 mb-2">
            <div className="flex border-b border-gray-300">
              <div className="w-24 bg-gray-100 p-1 font-bold border-r border-gray-300">Memória:</div>
              <div className="flex-1 p-1">{data.equipment_memory}</div>
              <div className="w-24 bg-gray-100 p-1 font-bold border-l border-r border-gray-300">HDD / SSD:</div>
              <div className="flex-1 p-1">{data.equipment_storage}</div>
            </div>
            <div className="flex">
              <div className="w-24 bg-gray-100 p-1 font-bold border-r border-gray-300">Processador:</div>
              <div className="flex-1 p-1">{data.equipment_processor}</div>
            </div>
          </div>
        )}

        {/* Client Data */}
        <div className="border border-gray-300 mb-2">
          <div className="bg-gray-200 p-1 font-bold border-b border-gray-300">DADOS DO CLIENTE</div>
          <div className="grid grid-cols-2 gap-0">
            <div className="flex border-b border-gray-300 border-r">
              <span className="w-24 bg-gray-50 p-1 font-bold">Razão social:</span>
              <span className="flex-1 p-1 truncate">{data.client?.name}</span>
            </div>
            <div className="flex border-b border-gray-300">
              <span className="w-24 bg-gray-50 p-1 font-bold">Nome fantasia:</span>
              <span className="flex-1 p-1 truncate">{data.client?.fantasy_name || data.client?.name}</span>
            </div>
            <div className="flex border-b border-gray-300 border-r">
              <span className="w-24 bg-gray-50 p-1 font-bold">CNPJ/CPF:</span>
              <span className="flex-1 p-1">{data.client?.document}</span>
            </div>
            <div className="flex border-b border-gray-300">
              <span className="w-24 bg-gray-50 p-1 font-bold">Endereço:</span>
              <span className="flex-1 p-1 truncate">{data.client?.address}</span>
            </div>
            <div className="flex border-b border-gray-300 border-r">
              <span className="w-24 bg-gray-50 p-1 font-bold">CEP:</span>
              <span className="flex-1 p-1">{data.client?.zip_code}</span>
            </div>
            <div className="flex border-b border-gray-300">
              <span className="w-24 bg-gray-50 p-1 font-bold">Cidade/UF:</span>
              <span className="flex-1 p-1">{data.client?.city}/{data.client?.state}</span>
            </div>
            <div className="flex border-r border-gray-300">
              <span className="w-24 bg-gray-50 p-1 font-bold">Telefone:</span>
              <span className="flex-1 p-1">{data.client?.phone}</span>
            </div>
            <div className="flex">
              <span className="w-24 bg-gray-50 p-1 font-bold">E-mail:</span>
              <span className="flex-1 p-1 truncate">{data.client?.email}</span>
            </div>
          </div>
        </div>

        {/* OS Specific: Equipment Details */}
        {type === "os" && (
          <div className="border border-gray-300 mb-2">
            <div className="bg-gray-200 p-1 font-bold border-b border-gray-300">EQUIPAMENTO</div>
            <div className="flex border-b border-gray-300">
              <div className="flex-1 flex border-r border-gray-300">
                <span className="w-32 bg-gray-50 p-1 font-bold">Nome do equipamento</span>
                <span className="flex-1 p-1">{data.equipment_name}</span>
              </div>
              <div className="w-48 flex border-r border-gray-300">
                <span className="w-12 bg-gray-50 p-1 font-bold">Marca</span>
                <span className="flex-1 p-1">{data.equipment_brand}</span>
              </div>
              <div className="w-48 flex border-r border-gray-300">
                <span className="w-12 bg-gray-50 p-1 font-bold">Modelo</span>
                <span className="flex-1 p-1">{data.equipment_model}</span>
              </div>
              <div className="w-48 flex">
                <span className="w-12 bg-gray-50 p-1 font-bold">Série</span>
                <span className="flex-1 p-1">{data.equipment_serial}</span>
              </div>
            </div>
            
            <div className="p-1 border-b border-gray-300">
              <span className="font-bold block mb-1">Condições</span>
              <p className="whitespace-pre-wrap">{data.conditions}</p>
            </div>
            <div className="p-1 border-b border-gray-300">
              <span className="font-bold block mb-1">Defeitos</span>
              <p className="whitespace-pre-wrap">{data.defects}</p>
            </div>
            <div className="p-1 border-b border-gray-300">
              <span className="font-bold block mb-1">Solução</span>
              <p className="whitespace-pre-wrap">{data.solution}</p>
            </div>
            {data.warranty_terms && (
              <div className="p-1">
                <span className="font-bold block mb-1">Termos de garantia</span>
                <p className="whitespace-pre-wrap text-[9px]">{data.warranty_terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Items Table */}
        <div className="border border-gray-300 mb-2">
          <div className="bg-gray-200 p-1 font-bold border-b border-gray-300 uppercase">
            {type === "os" ? "SERVIÇOS / PEÇAS" : "PRODUTOS / SERVIÇOS"}
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="p-1 border-r border-gray-300 w-10 text-center">ITEM</th>
                <th className="p-1 border-r border-gray-300">NOME</th>
                <th className="p-1 border-r border-gray-300 w-12 text-center">UND.</th>
                <th className="p-1 border-r border-gray-300 w-16 text-right">QTD.</th>
                <th className="p-1 border-r border-gray-300 w-24 text-right">VR. UNIT.</th>
                <th className="p-1 border-r border-gray-300 w-24 text-right">DESC.</th>
                <th className="p-1 w-24 text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 last:border-0">
                  <td className="p-1 border-r border-gray-300 text-center">{index + 1}</td>
                  <td className="p-1 border-r border-gray-300">{item.name}</td>
                  <td className="p-1 border-r border-gray-300 text-center">{item.unit || "UN"}</td>
                  <td className="p-1 border-r border-gray-300 text-right">{item.quantity.toFixed(2)}</td>
                  <td className="p-1 border-r border-gray-300 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-1 border-r border-gray-300 text-right">{formatCurrency(item.discount || 0)}</td>
                  <td className="p-1 text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
              {/* Fill empty rows if needed to look like the paper form, or just leave dynamic */}
            </tbody>
          </table>
          
          {/* Totals */}
          <div className="bg-gray-100 border-t border-gray-300">
            {type === "os" && totalProducts > 0 && (
              <div className="flex justify-end p-1 border-b border-gray-300">
                <span className="font-bold mr-2">PEÇAS/PRODUTOS:</span>
                <span>{formatCurrency(totalProducts)}</span>
              </div>
            )}
            {type === "os" && totalServices > 0 && (
              <div className="flex justify-end p-1 border-b border-gray-300">
                <span className="font-bold mr-2">SERVIÇOS:</span>
                <span>{formatCurrency(totalServices)}</span>
              </div>
            )}
            <div className="flex justify-end p-1 bg-gray-200 font-bold text-sm">
              <span className="mr-2">TOTAL:</span>
              <span>{formatCurrency(data.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Data */}
        <div className="border border-gray-300 mb-2">
          <div className="bg-gray-200 p-1 font-bold border-b border-gray-300">DADOS DO PAGAMENTO</div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="p-1 border-r border-gray-300 w-32">VENCIMENTO</th>
                <th className="p-1 border-r border-gray-300 w-32">VALOR</th>
                <th className="p-1 border-r border-gray-300 w-48">FORMA DE PAGAMENTO</th>
                <th className="p-1">OBSERVAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1 border-r border-gray-300">
                  {data.delivery_date ? formatDate(data.delivery_date) : formatDate(data.created_at)}
                </td>
                <td className="p-1 border-r border-gray-300">{formatCurrency(data.total_amount)}</td>
                <td className="p-1 border-r border-gray-300">{data.payment_method || "A Combinar"}</td>
                <td className="p-1">{data.payment_terms}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observations */}
        {(data.notes || type === "budget") && (
          <div className="border border-gray-300 mb-4">
            <div className="bg-gray-200 p-1 font-bold border-b border-gray-300">OBSERVAÇÕES</div>
            <div className="p-1 min-h-[40px] whitespace-pre-wrap">
              {data.notes}
              {type === "budget" && data.validity_date && (
                <p className="mt-2 font-bold">Validade da proposta: {formatDate(data.validity_date)}</p>
              )}
              {type === "budget" && data.delivery_date && (
                <p className="font-bold">Previsão de entrega: {formatDate(data.delivery_date)}</p>
              )}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-12 flex justify-between gap-8">
          <div className="flex-1 text-center">
            <div className="border-t border-black pt-1">Assinatura do cliente</div>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t border-black pt-1">
              {type === "os" ? "Assinatura do técnico" : "Assinatura do vendedor"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-right text-[8px] text-gray-500 italic">
          {titleMap[type]} emitida no Esc Solutions – www.escinformaticago.com.br
        </div>
      </div>
    );
  }
);

DocumentTemplate.displayName = "DocumentTemplate";
