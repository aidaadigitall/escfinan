import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EditRecurringChoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoice: (choice: "single" | "future") => void;
};

export const EditRecurringChoiceDialog = ({
  open,
  onOpenChange,
  onChoice,
}: EditRecurringChoiceDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar Conta Fixa</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Você deseja editar:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li><strong>Apenas essa ocorrência:</strong> Altera somente este lançamento específico</li>
              <li><strong>Essa e as futuras:</strong> Altera a conta fixa e todos os lançamentos futuros</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onChoice("single");
              onOpenChange(false);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Apenas essa
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => {
              onChoice("future");
              onOpenChange(false);
            }}
            className="bg-warning hover:bg-warning/90 text-warning-foreground"
          >
            Essa e as futuras
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
