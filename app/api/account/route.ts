import { NextRequest, NextResponse } from "next/server";
import { fetchAccountBalances } from "@/lib/binance/signedClient";
import { BINANCE_API_KEY, BINANCE_SECRET } from "@/lib/config";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!BINANCE_API_KEY || !BINANCE_SECRET) {
    return NextResponse.json(
      { error: "Binance API credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const balances = await fetchAccountBalances();
    return NextResponse.json(balances);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
