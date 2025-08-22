export interface Symbol {
  code: string;
  name: string;
  market: string;
}

export interface MarketDataRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  market?: string;
}

export interface DepthData {
  timestamp: number;
  asks: Array<[number, number]>; // [price, volume]
  bids: Array<[number, number]>; // [price, volume]
  symbol: string;
}

export interface MarketDataResponse {
  success: boolean;
  data: DepthData[];
  symbol: string;
  startDate: string;
  endDate: string;
  totalRecords: number;
}

export interface QuoteData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
}

export interface APIError {
  error: string;
  details?: any;
}
