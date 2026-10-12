import { NextResponse, type NextRequest } from "next/server";

import { handle } from "@/lib/http";
import { signOut } from "@/modules/auth/application/sign-out";
import { getContainer } from "@/server/container";

export const POST = handle(async (request: NextRequest) => {
  const { auth } = await getContainer();
  await signOut(auth);
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
});
