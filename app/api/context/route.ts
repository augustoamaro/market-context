import { NextRequest, NextResponse } from "next/server";
import { buildMarketContext } from "@/lib/services/marketContext";
import { SYMBOLS, TIMEFRAMES } from "@/lib/config";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol    = searchParams.get("symbol")?.toUpperCase();
  const timeframe = searchParams.get("timeframe");

  if (!symbol || !SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Invalid symbol. Valid: ${SYMBOLS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!timeframe || !TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json(
      { error: `Invalid timeframe. Valid: ${TIMEFRAMES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const ctx = await buildMarketContext(symbol, timeframe);
    return NextResponse.json(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
