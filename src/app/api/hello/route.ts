import { NextResponse, type NextRequest } from "next/server";

import { handle } from "@/lib/http";
import { greet } from "@/modules/greeting/application/greet";

export const POST = handle(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  return NextResponse.json({ message: greet(body) });
});
