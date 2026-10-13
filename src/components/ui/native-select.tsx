import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** A styled native <select>: keeps platform behaviour (keyboard, mobile pickers) and looks like Input. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className="relative block w-full">
      <select
        data-slot="native-select"
        className={cn(
          "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-background py-1 pr-9 pl-3 text-base shadow-xs outline-none transition-[color,box-shadow] aria-invalid:border-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </span>
  );
}

export { NativeSelect };
