import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Brand mark: the "VERB" logo image (a black rounded square), shown at 36px by default. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a small fixed asset; no optimizer needed
    <img src="/logo.png" alt="" width={36} height={36} aria-hidden="true" className={cn("size-9 shrink-0 rounded-lg ring-1 ring-white/25", className)} />
  );
}

/** Mark plus the "Verba" wordmark. Pass a className to size the wordmark text. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight ${className}`}>
      <LogoMark />
      <span>VERBA</span>
    </Link>
  );
}
