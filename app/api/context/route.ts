import { NextRequest, NextResponse } from "next/server";
import { buildMarketContext } from "@/lib/services/marketContext";
import { SYMBOLS, TIMEFRAMES } from "@/lib/config";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const timeframe = searchParams.get("timeframe");

  if (!timeframe || !TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json(
      { error: `Invalid timeframe. Valid: ${TIMEFRAMES.join(", ")}` },
      { status: 400 }
    );
  }

  // Batch mode: ?symbols=BTCUSDT,ETHUSDT&timeframe=4h
  const symbolsParam = searchParams.get("symbols");
  if (symbolsParam) {
    const requested = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
    const invalid = requested.filter((s) => !SYMBOLS.includes(s));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid symbols: ${invalid.join(", ")}. Valid: ${SYMBOLS.join(", ")}` },
        { status: 400 }
      );
    }
    const settled = await Promise.allSettled(
      requested.map((s) => buildMarketContext(s, timeframe))
    );
    const results = settled
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof buildMarketContext>>> => r.status === "fulfilled")
      .map((r) => r.value);
    return NextResponse.json(results);
  }

  // Single mode: ?symbol=BTCUSDT&timeframe=4h
  const symbol = searchParams.get("symbol")?.toUpperCase();
  if (!symbol || !SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Invalid symbol. Valid: ${SYMBOLS.join(", ")}` },
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
