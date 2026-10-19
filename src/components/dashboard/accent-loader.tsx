import { connection } from "next/server";

import { getMyProfile } from "@/modules/profile/application/get-my-profile";
import { getContainer } from "@/server/container";

import { AccentSeed } from "./accent-seed";

/** Reads the saved accent colour on the server. A failed read leaves the browser as it is. Wrap in <Suspense>. */
export async function AccentLoader() {
  await connection();
  const { auth, profiles } = await getContainer();
  let color: string | null;
  try {
    const { profile } = await getMyProfile({ auth, profiles });
    color = profile?.accentColor ?? null;
  } catch {
    return null;
  }
  return <AccentSeed color={color} />;
}
