import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash } from "lucide-react";

const PaymentMethods = () => {
  const [methods, setMethods] = useState([
    { id: "1", name: "PIX" },
    { id: "2", name: "Boleto" },
    { id: "3", name: "Cartão de Crédito" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<{ id: string; name: string } | null>(null);
  const [methodName, setMethodName] = useState("");

  const handleSave = () => {
    if (currentMethod) {
      setMethods(methods.map(m => m.id === currentMethod.id ? { ...m, name: methodName } : m));
    } else {
      setMethods([...methods, { id: (methods.length + 1).toString(), name: methodName }]);
    }
    setDialogOpen(false);
    setCurrentMethod(null);
    setMethodName("");
  };

  const handleEdit = (method: { id: string; name: string }) => {
    setCurrentMethod(method);
    setMethodName(method.name);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Formas de Pagamento</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setCurrentMethod(null); setMethodName(""); }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentMethod ? "Editar" : "Adicionar"} Forma de Pagamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={methodName} onChange={(e) => setMethodName(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>{method.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(method)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethods;
