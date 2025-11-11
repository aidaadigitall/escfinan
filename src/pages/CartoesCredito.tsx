import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreditCards, CreditCard } from "@/hooks/useCreditCards";
import { CreditCardDialog } from "@/components/CreditCardDialog";
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
import { Plus, CreditCard as CreditCardIcon, Edit, Trash2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CartoesCredito = () => {
  const { cards, isLoading, createCard, updateCard, deleteCard, syncCard } = useCreditCards();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const handleEdit = (card: CreditCard) => {
    setSelectedCard(card);
    setDialogOpen(true);
  };

  const handleDelete = (cardId: string) => {
    setCardToDelete(cardId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      deleteCard(cardToDelete);
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  const handleSync = (cardId: string) => {
    syncCard(cardId);
  };

  const handleSave = (data: any) => {
    if (selectedCard) {
      updateCard(data);
    } else {
      createCard(data);
    }
  };

  const formatCardNumber = (last4: string) => `•••• ${last4}`;
  
  const getUsagePercentage = (card: CreditCard) => {
    return ((card.credit_limit - card.available_credit) / card.credit_limit) * 100;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cartões de Crédito</h1>
          <Button
            onClick={() => {
              setSelectedCard(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cartão
          </Button>
        </div>

        {cards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCardIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cartão cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione seus cartões de crédito para gerenciar gastos e faturas
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cartão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{card.card_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{card.card_brand}</Badge>
                        {card.sync_enabled ? (
                          <Badge variant="default" className="gap-1">
                            <Wifi className="h-3 w-3" />
                            Sincronizado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <WifiOff className="h-3 w-3" />
                            Manual
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CreditCardIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-mono font-bold">
                      {formatCardNumber(card.card_number)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.cardholder_name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disponível</span>
                      <span className="font-semibold">
                        R$ {card.available_credit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Limite Total</span>
                      <span>
                        R$ {card.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${getUsagePercentage(card)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {getUsagePercentage(card).toFixed(1)}% utilizado
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Fechamento</p>
                      <p className="font-semibold">Dia {card.closing_day}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vencimento</p>
                      <p className="font-semibold">Dia {card.due_day}</p>
                    </div>
                  </div>

                  {card.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      Última sincronização: {new Date(card.last_sync_at).toLocaleString('pt-BR')}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {card.sync_enabled && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSync(card.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sincronizar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(card)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreditCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={selectedCard}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CartoesCredito;
