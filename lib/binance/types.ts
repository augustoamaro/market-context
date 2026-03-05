// Raw kline array from Binance REST API
// Index: [openTime, open, high, low, close, volume, closeTime, ...]
export type RawKline = [
  number,  // 0: openTime
  string,  // 1: open
  string,  // 2: high
  string,  // 3: low
  string,  // 4: close
  string,  // 5: volume
  number,  // 6: closeTime
  string,  // 7: quoteAssetVolume
  number,  // 8: numberOfTrades
  string,  // 9: takerBuyBaseVolume
  string,  // 10: takerBuyQuoteVolume
  string   // 11: ignore
];

export interface OHLCV {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}
