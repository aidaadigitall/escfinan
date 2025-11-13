import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Produtos = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info("Funcionalidade de Produtos está em desenvolvimento e estará disponível em breve.", {
      duration: 5000,
    });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>

      <Card className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full">
          <AlertCircle className="w-12 h-12 text-yellow-600" />
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-800">
            Funcionalidade em Desenvolvimento
          </h2>
          <p className="text-gray-600 max-w-md">
            A funcionalidade de gerenciamento de produtos está sendo desenvolvida e estará disponível em breve. 
            Obrigado pela paciência!
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <p className="text-sm text-blue-800">
            <strong>Em breve você poderá:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Cadastrar novos produtos</li>
            <li>Gerenciar estoque</li>
            <li>Definir preços e categorias</li>
            <li>Acompanhar movimentações</li>
          </ul>
        </div>

        <Button onClick={() => navigate(-1)} className="mt-4">
          Voltar para o Menu
        </Button>
      </Card>
    </div>
  );
};

export default Produtos;
