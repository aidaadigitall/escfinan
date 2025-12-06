import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Percent, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscountInputProps {
  value: number;
  onChange: (value: number) => void;
  baseValue: number; // quantity * unit_price - used to calculate percentage
  className?: string;
}

export const DiscountInput = ({ value, onChange, baseValue, className }: DiscountInputProps) => {
  const [discountType, setDiscountType] = useState<"percent" | "value">("value");
  const [displayValue, setDisplayValue] = useState(value.toString());

  const handleTypeChange = (type: "percent" | "value") => {
    if (type === discountType) return;
    
    setDiscountType(type);
    if (type === "percent" && baseValue > 0) {
      // Convert value to percentage
      const percentage = (value / baseValue) * 100;
      setDisplayValue(percentage.toFixed(2));
    } else if (type === "value") {
      // Keep as is, it's already a value
      setDisplayValue(value.toString());
    }
  };

  const handleValueChange = (inputValue: string) => {
    setDisplayValue(inputValue);
    const numValue = parseFloat(inputValue) || 0;
    
    if (discountType === "percent") {
      // Calculate the actual discount value from percentage
      const discountValue = (numValue / 100) * baseValue;
      onChange(discountValue);
    } else {
      onChange(numValue);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex border rounded-md overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 rounded-none",
            discountType === "percent" && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => handleTypeChange("percent")}
        >
          <Percent className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 rounded-none",
            discountType === "value" && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => handleTypeChange("value")}
        >
          <DollarSign className="h-3 w-3" />
        </Button>
      </div>
      <Input
        type="number"
        value={displayValue}
        onChange={(e) => handleValueChange(e.target.value)}
        className="w-20"
        min="0"
        step="0.01"
      />
    </div>
  );
};

