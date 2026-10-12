import { Link } from "@/i18n/navigation";

/** Brand mark: the word "VERB" in white on a black rounded square. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid size-9 shrink-0 place-items-center rounded-lg bg-black text-[0.68rem] font-extrabold italic leading-none tracking-tighter text-white ring-1 ring-white/25 ${className}`}
    >
      VERB
    </span>
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
