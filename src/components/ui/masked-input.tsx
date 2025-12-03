import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MaskType = "cpf" | "cnpj" | "phone" | "cep" | "cpf_cnpj";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

const masks = {
  cpf: {
    apply: (value: string) => {
      return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    },
    maxLength: 14,
  },
  cnpj: {
    apply: (value: string) => {
      return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    },
    maxLength: 18,
  },
  phone: {
    apply: (value: string) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) {
        return digits
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2")
          .replace(/(-\d{4})\d+?$/, "$1");
      }
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})\d+?$/, "$1");
    },
    maxLength: 15,
  },
  cep: {
    apply: (value: string) => {
      return value
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{3})\d+?$/, "$1");
    },
    maxLength: 9,
  },
  cpf_cnpj: {
    apply: (value: string) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 11) {
        return masks.cpf.apply(value);
      }
      return masks.cnpj.apply(value);
    },
    maxLength: 18,
  },
};

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = masks[mask].apply(e.target.value);
      onChange(maskedValue);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        maxLength={masks[mask].maxLength}
        className={cn("rounded-xl", className)}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";
