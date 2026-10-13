import type { ReactNode } from "react";

/** Label, control and message for one form field; the message is linked with aria-describedby. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": hasMessage ? messageId : undefined })}
      {hasMessage && (
        <p id={messageId} className={error ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
