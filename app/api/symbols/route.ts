import { NextResponse } from "next/server";
import { SYMBOLS } from "@/lib/config";

export function GET() {
  return NextResponse.json(SYMBOLS);
}
