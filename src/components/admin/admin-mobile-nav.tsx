"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";

import { AdminNav } from "./admin-nav";

/** The menu for narrow screens: a button in the top bar that opens the same links under it. */
export function AdminMobileNav() {
  const t = useTranslations("Admin");
  const id = useId();
  const [open, setOpen] = useState(false);

  // Choosing a link closes the menu (onNavigate); Escape closes it too.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? t("menu.close") : t("menu.open")}
        onClick={() => setOpen((value) => !value)}
        className="lg:hidden"
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </Button>
      {open && (
        <div id={id} className="absolute inset-x-0 top-full z-20 border-b bg-inverse p-3 text-inverse-foreground shadow-xl lg:hidden">
          <AdminNav onNavigate={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
