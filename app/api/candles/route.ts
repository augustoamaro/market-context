import { NextRequest, NextResponse } from "next/server";
import { fetchOHLCV } from "@/lib/binance/client";
import { SYMBOLS, TIMEFRAMES } from "@/lib/config";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const symbol    = searchParams.get("symbol")?.toUpperCase();
  const timeframe = searchParams.get("timeframe");

  if (!symbol || !SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: `Invalid symbol. Valid: ${SYMBOLS.join(", ")}` }, { status: 400 });
  }
  if (!timeframe || !TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json({ error: `Invalid timeframe. Valid: ${TIMEFRAMES.join(", ")}` }, { status: 400 });
  }

  try {
    const candles = await fetchOHLCV(symbol, timeframe);
    // Return only what the chart needs — last 100 candles is enough to render
    const result = candles.slice(-100).map((c) => ({
      time: Math.floor(c.openTime / 1000) as number,
      open:  c.open,
      high:  c.high,
      low:   c.low,
      close: c.close,
    }));
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
