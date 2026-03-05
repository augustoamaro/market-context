import { NextRequest, NextResponse } from "next/server";
import { SYMBOLS, BINANCE_BASE_URL, BINANCE_API_KEY } from "@/lib/config";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const symbolsParam = req.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols param required" }, { status: 400 });
  }

  const requested = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
  const invalid = requested.filter((s) => !SYMBOLS.includes(s));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid symbols: ${invalid.join(", ")}` },
      { status: 400 }
    );
  }

  const url = new URL(`${BINANCE_BASE_URL}/api/v3/ticker/24hr`);
  url.searchParams.set("symbols", JSON.stringify(requested));

  const headers: Record<string, string> = {};
  if (BINANCE_API_KEY) headers["X-MBX-APIKEY"] = BINANCE_API_KEY;

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8_000),
      headers,
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Binance error: ${res.status}` }, { status: 502 });
    }

    const data: Record<string, string>[] = await res.json();
    const trimmed = data.map((d) => ({
      symbol: d.symbol,
      lastPrice: d.lastPrice,
      priceChange: d.priceChange,
      priceChangePercent: d.priceChangePercent,
    }));

    return NextResponse.json(trimmed);
  } catch {
    return NextResponse.json({ error: "Failed to fetch ticker" }, { status: 502 });
  }
}
