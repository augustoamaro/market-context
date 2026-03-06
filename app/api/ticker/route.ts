import { NextRequest, NextResponse } from "next/server";
import { SYMBOLS } from "@/lib/config";
import { fetchTicker24h } from "@/lib/binance/client";
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

  try {
    const data = await fetchTicker24h(requested);
    return NextResponse.json(requested.map((symbol) => data[symbol]).filter(Boolean));
  } catch {
    return NextResponse.json({ error: "Failed to fetch ticker" }, { status: 502 });
  }
}
