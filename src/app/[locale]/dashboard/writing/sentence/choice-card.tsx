import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ChoiceCardProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  className?: string;
  children: ReactNode;
}

/** A radio option drawn as a card. The native input stays for keyboard and screen readers; the selected card inverts to black. */
export function ChoiceCard({ name, value, checked, onSelect, className, children }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer select-none rounded-xl border bg-background transition-colors hover:border-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
        checked && "border-transparent bg-solid text-on-solid",
        className
      )}
    >
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
      />
      {children}
      {checked && <Check className="absolute top-3 right-3 size-4" aria-hidden="true" />}
    </label>
  );
}
