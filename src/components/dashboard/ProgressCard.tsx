import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";

interface ProgressCardProps {
  title: string;
  subtitle: string;
  completed: string;
  pending: string;
  expected: string;
  percentage: number;
  linkText?: string;
  onLinkClick?: () => void;
  hideValues?: boolean;
}

export const ProgressCard = ({
  title,
  subtitle,
  completed,
  pending,
  expected,
  percentage,
  linkText,
  onLinkClick,
  hideValues = false,
}: ProgressCardProps) => {
  return (
    <Card className="p-6 bg-primary text-primary-foreground hover:shadow-lg transition-all min-h-[280px] flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-base font-medium opacity-90">{title}</h3>
          <p className="text-xs opacity-75 mt-1">{subtitle}</p>
        </div>
        <div className="relative">
          <svg className="w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="opacity-20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - (hideValues ? 0 : percentage) / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            {hideValues ? "••" : `${Math.round(percentage)}%`}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="opacity-90">Realizado:</span>
          <span className="font-semibold">{hideValues ? "••••••" : completed}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-90">Falta:</span>
          <span className="font-semibold">{hideValues ? "••••••" : pending}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-90">Previsto:</span>
          <span className="font-semibold">{hideValues ? "••••••" : expected}</span>
        </div>
      </div>

      {linkText && (
        <button
          onClick={onLinkClick}
          className="flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
        >
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </Card>
  );
};
