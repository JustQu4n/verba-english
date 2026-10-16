import { useFormatter, useTranslations } from "next-intl";

import type { AttemptRecord } from "@/modules/writing/domain/attempt";

/** One attempt: the sentence, what the learner wrote and the feedback they got. Used by the history and the profile. */
export function AttemptCard({ item }: { item: AttemptRecord }) {
  const t = useTranslations("Sentence.history");
  const format = useFormatter();
  return (
      <li className="rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <p className="flex flex-wrap items-center gap-2">
            <span>{t(`mode.${item.mode}`)}</span>
            {item.tries > 1 && <span>{t("tries", { count: item.tries })}</span>}
          </p>
          <time dateTime={item.createdAt.toISOString()}>{format.dateTime(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}</time>
        </div>

        <p lang="vi" className="mt-3 text-lg/snug font-semibold">
          {item.vietnamese ?? <span className="font-normal text-muted-foreground">{t("removed")}</span>}
        </p>

        <p className="mt-3 text-xs text-muted-foreground">{t("yourAnswer")}</p>
        <p lang="en" className="mt-0.5 whitespace-pre-wrap break-words">{item.answer}</p>

        {(item.suggestion || item.improvements.length > 0 || item.comment) && (
          <div className="mt-4 space-y-2 rounded-lg bg-muted px-4 py-3 text-sm">
            {item.suggestion && (
              <p>
                <span className="font-semibold">{t("suggestion")}:</span> <span lang="en">{item.suggestion}</span>
              </p>
            )}
            {item.improvements.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {item.improvements.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            )}
            {item.comment && <p className="text-muted-foreground">{item.comment}</p>}
          </div>
        )}
      </li>
  );
}
