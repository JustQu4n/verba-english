import { connection } from "next/server";

import { getPoints } from "@/modules/points/application/get-points";
import { getCredits } from "@/modules/credits/application/get-credits";
import { getContainer } from "@/server/container";

import { CreditsSeed } from "./credits-context";

/** Reads the balance and points on the server. A failed read just leaves that navbar badge hidden. Wrap in <Suspense>. */
export async function CreditsLoader() {
  await connection();
  const { auth, credits, points } = await getContainer();
  const [balance, total] = await Promise.all([
    getCredits({ auth, credits }).catch(() => null),
    getPoints({ auth, points }).catch(() => null),
  ]);
  return <CreditsSeed credits={balance} points={total} />;
}
