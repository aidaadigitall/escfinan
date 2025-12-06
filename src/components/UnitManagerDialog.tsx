import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Unit {
  sigla: string;
  descricao: string;
  padrao: boolean;
}

const DEFAULT_UNITS: Unit[] = [
  { sigla: "UN", descricao: "Unidade", padrao: true },
  { sigla: "PC", descricao: "Peça", padrao: true },
  { sigla: "CX", descricao: "Caixa", padrao: true },
  { sigla: "KG", descricao: "Quilograma", padrao: true },
  { sigla: "L", descricao: "Litro", padrao: true },
  { sigla: "M", descricao: "Metro", padrao: true },
  { sigla: "M²", descricao: "Metro Quadrado", padrao: true },
  { sigla: "M³", descricao: "Metro Cúbico", padrao: true },
];

const STORAGE_KEY = "product_units";

export const getUnits = (): Unit[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UNITS));
  return DEFAULT_UNITS;
};

export const saveUnits = (units: Unit[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
};

interface UnitManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnitsChange?: () => void;
}

export const UnitManagerDialog = ({ open, onOpenChange, onUnitsChange }: UnitManagerDialogProps) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [newSigla, setNewSigla] = useState("");
  const [newDescricao, setNewDescricao] = useState("");

  useEffect(() => {
    if (open) {
      setUnits(getUnits());
    }
  }, [open]);

  const handleAddUnit = () => {
    if (!newSigla.trim()) {
      toast.error("A sigla é obrigatória");
      return;
    }

    if (units.some(u => u.sigla.toLowerCase() === newSigla.toLowerCase())) {
      toast.error("Esta sigla já existe");
      return;
    }

    const newUnit: Unit = {
      sigla: newSigla.toUpperCase(),
      descricao: newDescricao || newSigla.toUpperCase(),
      padrao: false,
    };

    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);
    saveUnits(updatedUnits);
    setNewSigla("");
    setNewDescricao("");
    onUnitsChange?.();
    toast.success("Unidade adicionada com sucesso");
  };

  const handleDeleteUnit = (sigla: string) => {
    const unit = units.find(u => u.sigla === sigla);
    if (unit?.padrao) {
      toast.error("Não é possível excluir unidades padrão");
      return;
    }

    const updatedUnits = units.filter(u => u.sigla !== sigla);
    setUnits(updatedUnits);
    saveUnits(updatedUnits);
    onUnitsChange?.();
    toast.success("Unidade removida com sucesso");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Gerenciar Unidades de Medida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Sigla *</Label>
              <Input
                value={newSigla}
                onChange={(e) => setNewSigla(e.target.value.toUpperCase())}
                placeholder="Ex: PAR"
                maxLength={5}
              />
            </div>
            <div className="flex-1">
              <Label>Descrição</Label>
              <Input
                value={newDescricao}
                onChange={(e) => setNewDescricao(e.target.value)}
                placeholder="Ex: Par"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddUnit} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.sigla}>
                    <TableCell className="font-medium">{unit.sigla}</TableCell>
                    <TableCell>{unit.descricao}</TableCell>
                    <TableCell>
                      {unit.padrao ? (
                        <Badge variant="secondary">Padrão</Badge>
                      ) : (
                        <Badge variant="outline">Personalizada</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!unit.padrao && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUnit(unit.sigla)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
