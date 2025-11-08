import { Card } from "@/components/ui/card";

export const DemonstrativoTab = () => {
  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Demonstrativo Financeiro</h2>
        <p className="text-muted-foreground">
          Esta aba permite visualizar um demonstrativo detalhado das movimentações financeiras.
        </p>
        <p className="text-muted-foreground">
          Em desenvolvimento...
        </p>
      </div>
    </Card>
  );
};
