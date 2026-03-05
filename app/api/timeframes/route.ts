import { NextResponse } from "next/server";
import { TIMEFRAMES } from "@/lib/config";

export function GET() {
  return NextResponse.json(TIMEFRAMES);
}
