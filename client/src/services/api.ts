import axios from 'axios';
import { Symbol, MarketDataRequest, MarketDataResponse, QuoteData } from '../types';

const API_BASE_URL = '/api';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Get available symbols
  async getSymbols(): Promise<Symbol[]> {
    try {
      const response = await api.get<Symbol[]>('/symbols');
      return response.data;
    } catch (error) {
      console.error('Error fetching symbols:', error);
      throw new Error('Failed to fetch symbols');
    }
  },

  // Get market data for a specific symbol and date range
  async getMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
    try {
      const response = await api.post<MarketDataResponse>('/market-data', request);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching market data:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch market data');
    }
  },

  // Get latest quote for a symbol
  async getQuote(symbol: string, market: string = 'stock'): Promise<QuoteData> {
    try {
      const response = await api.get<{ success: boolean; data: QuoteData }>(`/quote/${symbol}`, {
        params: { market }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw new Error('Failed to fetch quote');
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API health check failed');
    }
  }
};

export default apiService;
