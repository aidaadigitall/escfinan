import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  amount: string;
  variant: "income" | "expense" | "info";
  linkText?: string;
  onLinkClick?: () => void;
}

export const StatCard = ({
  title,
  amount,
  variant,
  linkText,
  onLinkClick,
}: StatCardProps) => {
  const variantClasses = {
    income: "bg-income text-income-foreground",
    expense: "bg-expense text-expense-foreground",
    info: "bg-primary text-primary-foreground",
  };

  return (
    <Card
      className={cn(
        "p-6 relative overflow-hidden transition-all hover:shadow-lg",
        variantClasses[variant]
      )}
    >
      <div className="relative z-10">
        <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
        <p className="text-3xl font-bold mb-4">{amount}</p>
        {linkText && (
          <button
            onClick={onLinkClick}
            className="flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
          >
            {linkText}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
    </Card>
  );
};
