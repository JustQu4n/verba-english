import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Href = ComponentProps<typeof Link>["href"];

/** Previous / next with "Page x of y". A button that cannot be used is dimmed and skipped by the keyboard. */
export async function AdminPagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => Href }) {
  if (pageCount <= 1) return null;
  const t = await getTranslations("Admin.common");
  const atStart = page <= 1;
  const atEnd = page >= pageCount;
  return (
    <nav aria-label={t("pagination")} className="mt-6 flex items-center justify-between gap-4">
      <Button asChild variant="outline" size="sm" aria-disabled={atStart} className={atStart ? "pointer-events-none opacity-50" : ""}>
        <Link href={hrefFor(page - 1)} tabIndex={atStart ? -1 : undefined}>
          <ChevronLeft aria-hidden="true" />
          {t("previous")}
        </Link>
      </Button>
      <p className="text-sm tabular-nums text-muted-foreground">{t("page", { page, pageCount })}</p>
      <Button asChild variant="outline" size="sm" aria-disabled={atEnd} className={atEnd ? "pointer-events-none opacity-50" : ""}>
        <Link href={hrefFor(page + 1)} tabIndex={atEnd ? -1 : undefined}>
          {t("next")}
          <ChevronRight aria-hidden="true" />
        </Link>
      </Button>
    </nav>
  );
}
