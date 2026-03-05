import { NextResponse } from "next/server";
import { fetchAccountBalances } from "@/lib/binance/signedClient";
import { BINANCE_API_KEY, BINANCE_SECRET } from "@/lib/config";

export async function GET() {
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
