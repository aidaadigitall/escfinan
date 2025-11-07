import { Bell, Calendar, User } from "lucide-react";
import { Button } from "./ui/button";

export const Header = () => {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-card border-b border-border px-6 flex items-center justify-between z-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {greeting()}, Usuário
        </h2>
        <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-expense rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <Calendar className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
