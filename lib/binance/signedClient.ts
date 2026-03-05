import { createHmac } from "crypto";
import { BINANCE_BASE_URL, BINANCE_API_KEY, BINANCE_SECRET } from "@/lib/config";

function sign(queryString: string): string {
  return createHmac("sha256", BINANCE_SECRET).update(queryString).digest("hex");
}

async function signedGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const timestamp = Date.now().toString();
  const queryParams = new URLSearchParams({ ...params, timestamp });
  const signature = sign(queryParams.toString());
  queryParams.set("signature", signature);

  const url = `${BINANCE_BASE_URL}${path}?${queryParams.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10_000),
    headers: { "X-MBX-APIKEY": BINANCE_API_KEY },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Binance API error ${res.status}: ${body.msg ?? res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BinanceAccountResponse {
  balances: BinanceBalance[];
}

const RELEVANT_ASSETS = new Set(["USDT", "BTC", "ETH", "SOL", "BNB"]);

export async function fetchAccountBalances(): Promise<BinanceBalance[]> {
  const data = await signedGet<BinanceAccountResponse>("/api/v3/account");
  return data.balances.filter(
    (b) => RELEVANT_ASSETS.has(b.asset) && (parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
  );
}
