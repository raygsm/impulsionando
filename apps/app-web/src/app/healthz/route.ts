import { NextResponse } from "next/server";
import { healthPayload } from "@/lib/config/env";

export function GET() {
  return NextResponse.json(healthPayload());
}
