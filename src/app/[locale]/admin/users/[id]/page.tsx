import { ArrowLeft } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AccountAvatar } from "@/components/admin/account-avatar";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/core/errors";
import { Link } from "@/i18n/navigation";
import { getUser } from "@/modules/admin/application/manage-user";
import { getContainer } from "@/server/container";

import { updateUserAction } from "../actions";
import { displayName, RoleBadge } from "../account-list";
import { UserForm } from "../user-form";

export const instant = false;

export default async function AdminUserPage({ params }: PageProps<"/[locale]/admin/users/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tCommon = await getTranslations("Dashboard");
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <Suspense fallback={<p className="text-muted-foreground">{tCommon("loading")}</p>}>
        <UserDetail id={id} />
      </Suspense>
    </div>
  );
}

async function UserDetail({ id }: { id: string }) {
  await connection();
  const [t, tCommon, format] = await Promise.all([getTranslations("Admin.users"), getTranslations("Admin.common"), getFormatter()]);
  const { auth, roles, users } = await getContainer();
  let account;
  try {
    account = await getUser({ auth, roles, users }, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) return null;
    throw error;
  }
  const me = await auth.getCurrentUser();
  const name = displayName(account);
  const facts = [
    { label: t("columns.joined"), value: format.dateTime(account.createdAt, { dateStyle: "long" }) },
    { label: t("columns.lastSignIn"), value: account.lastSignInAt ? format.dateTime(account.lastSignInAt, { dateStyle: "long", timeStyle: "short" }) : tCommon("never") },
    { label: t("detail.rank"), value: account.rank ? tCommon("rank", { rank: account.rank }) : tCommon("unranked") },
  ];

  return (
    <>
      <Link href="/admin/users" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("form.back")}
      </Link>
      <AdminPageHeader title={t("detail.title")} subtitle={t("detail.subtitle")} />
      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <section aria-labelledby="account-name" className="h-fit rounded-2xl border p-6">
          <AccountAvatar name={name} avatarUrl={account.avatarUrl} className="size-16 text-xl" />
          <h2 id="account-name" className="mt-4 text-lg font-semibold tracking-tight break-words">{name}</h2>
          {account.email && <p className="text-sm break-all text-muted-foreground">{account.email}</p>}
          <div className="mt-3"><RoleBadge role={account.role} label={tCommon(`roles.${account.role}`)} /></div>
          <dl className="mt-5 flex flex-col gap-3 border-t pt-5 text-sm">
            {facts.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="account-edit" className="rounded-2xl border p-6">
          <h2 id="account-edit" className="mb-6 text-lg font-semibold tracking-tight">{t("detail.edit")}</h2>
          <UserForm
            action={updateUserAction.bind(null, account.id)}
            initial={{ role: account.role, credits: account.credits, points: account.points }}
            isSelf={me?.id === account.id}
          />
        </section>
      </div>
    </>
  );
}
