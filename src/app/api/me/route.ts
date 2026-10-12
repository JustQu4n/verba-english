import { NextResponse } from "next/server";

import { handle } from "@/lib/http";
import { getMyProfile } from "@/modules/profile/application/get-my-profile";
import { getContainer } from "@/server/container";

export const GET = handle(async () => {
  const { auth, profiles } = await getContainer();
  return NextResponse.json(await getMyProfile({ auth, profiles }));
});
