const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// Alltick API configuration
const ALLTICK_API_KEY = process.env.ALLTICK_API_KEY;
const ALLTICK_BASE_URLS = {
  stock: 'https://quote.alltick.io/quote-stock-b-api',
  general: 'https://quote.alltick.io/quote-b-api'
};

// Simple rate limiting tracker
let lastApiCall = 0;
const MIN_API_INTERVAL = 10000; // 10 seconds between calls to be safe

// Helper function to format query data for Alltick API
function formatQuery(symbol, startTime, endTime, market = 'stock') {
  // AllTick API expects specific format for real-time data queries
  // Based on AllTick documentation: https://en.apis.alltick.co/
  const queryData = {
    symbol_list: [{ code: symbol }]
  };

  // Only add time parameters if provided (for historical data)
  if (startTime && endTime) {
    queryData.start_time = startTime;
    queryData.end_time = endTime;
    queryData.limit = 1000;
  }

  return {
    data: queryData,
    trace: generateTraceId()
  };
}

// Generate a trace ID for AllTick API requests
function generateTraceId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}



// API Routes

// Get available symbols/instruments
app.get('/api/symbols', async (req, res) => {
  try {
    // Try to fetch actual symbols from AllTick if available
    let symbols = [];
    
    try {
      // Try the symbols endpoint if it exists
      const response = await axios.get('https://quote.alltick.io/quote-b-api/symbols', {
        params: { token: ALLTICK_API_KEY },
        timeout: 10000
      });
      
      if (response.data && response.data.ret === 0) {
        console.log('Successfully fetched symbols from AllTick');
        symbols = response.data.data.slice(0, 20).map(item => ({
          code: item.code || item.symbol,
          name: item.name || item.code,
          market: item.market || 'unknown'
        }));
      }
    } catch (error) {
      console.log('AllTick symbols endpoint not available, using fallback list');
    }
    
    // Fallback to manual list if API doesn't work
    if (symbols.length === 0) {
      symbols = [
        // Hong Kong Exchange (HKEX) Stocks - Using AllTick format (no leading zeros)
        { code: '5.HK', name: 'HSBC Holdings', market: 'hkex' },
        { code: '27.HK', name: 'Galaxy Entertainment Group', market: 'hkex' },
        { code: '175.HK', name: 'Geely Automobile Holdings', market: 'hkex' },
        { code: '291.HK', name: 'China Resources Beer Holdings', market: 'hkex' },
        { code: '386.HK', name: 'Sinopec Corp', market: 'hkex' },
        { code: '388.HK', name: 'HK Exchanges & Clearing', market: 'hkex' },
        { code: '700.HK', name: 'Tencent Holdings', market: 'hkex' },
        { code: '857.HK', name: 'PetroChina', market: 'hkex' },
        { code: '883.HK', name: 'China National Offshore Oil Corporation', market: 'hkex' },
        { code: '939.HK', name: 'China Construction Bank', market: 'hkex' },
        { code: '941.HK', name: 'China Mobile', market: 'hkex' },
        { code: '998.HK', name: 'CITIC Bank International', market: 'hkex' },
        { code: '1093.HK', name: 'CSPC Pharmaceutical Group', market: 'hkex' },
        { code: '1177.HK', name: 'Sino Biopharmaceutical', market: 'hkex' },
        { code: '1288.HK', name: 'Agricultural Bank of China', market: 'hkex' },
        { code: '1299.HK', name: 'AIA', market: 'hkex' },
        { code: '1398.HK', name: 'Industrial and Commercial Bank of China', market: 'hkex' },
        { code: '1810.HK', name: 'Xiaomi Corp', market: 'hkex' },
        { code: '1918.HK', name: 'Sunac China Holdings', market: 'hkex' },
        { code: '2007.HK', name: 'Country Garden Holdings', market: 'hkex' },
        { code: '2018.HK', name: 'AAC Technologies Holdings', market: 'hkex' },
        { code: '2318.HK', name: 'Ping An Insurance', market: 'hkex' },
        { code: '2388.HK', name: 'BOC Hong Kong (Holdings)', market: 'hkex' },
        { code: '2628.HK', name: 'China Life Insurance Company', market: 'hkex' },
        { code: '3333.HK', name: 'China Evergrande Group', market: 'hkex' },
        { code: '3968.HK', name: 'China Merchants Bank', market: 'hkex' },
        { code: '3988.HK', name: 'Bank of China', market: 'hkex' },
        
        // Crypto currencies
        { code: 'BTC-USD', name: 'Bitcoin/USD (Dash)', market: 'crypto' },
        { code: 'BTC/USD', name: 'Bitcoin/USD (Slash)', market: 'crypto' },
        { code: 'BTCUSD', name: 'Bitcoin/USD (Simple)', market: 'crypto' },
        { code: 'BTC_USD', name: 'Bitcoin/USD (Underscore)', market: 'crypto' },
        
        // Forex
        { code: 'EUR-USD', name: 'EUR/USD (Dash)', market: 'forex' },
        { code: 'EUR/USD', name: 'EUR/USD (Slash)', market: 'forex' },
        { code: 'EURUSD', name: 'EUR/USD (Simple)', market: 'forex' },
        
        // Commodities
        { code: 'XAUUSD', name: 'Gold/USD', market: 'commodity' },
        { code: 'CRUDE', name: 'Crude Oil', market: 'commodity' }
      ];
    }
    
    res.json(symbols);
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({ error: 'Failed to fetch symbols' });
  }
});

// Get Level 2 market data (depth/order book)
app.post('/api/market-data', async (req, res) => {
  try {
    const { symbol, market = 'stock' } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Missing required parameter: symbol' 
      });
    }

    // Use real-time data (no date range needed for real-time quotes)
    console.log('Fetching real-time data for symbol:', symbol);
    
    // Use symbol as-is since our symbol list now provides the correct AllTick format
    let apiSymbol = symbol;
    console.log('Using symbol:', apiSymbol, 'for market:', market);
    
    // Choose the appropriate base URL based on market type
    const baseUrl = (market === 'hkex' || market === 'stock') ? ALLTICK_BASE_URLS.stock : ALLTICK_BASE_URLS.general;
    
    // Prepare the query for real-time data
    const query = formatQuery(apiSymbol, null, null, market);
    const queryString = JSON.stringify(query);
    
    const fullUrl = `${baseUrl}/depth-tick?token=${ALLTICK_API_KEY}&query=${encodeURIComponent(queryString)}`;
    
    console.log('AllTick API Request:');
    console.log('- URL:', `${baseUrl}/depth-tick`);
    console.log('- Symbol:', apiSymbol);
    console.log('- Market:', market);
    console.log('- Query Object:', JSON.stringify(query, null, 2));
    console.log('- Query String:', queryString);
    console.log('- Full URL:', fullUrl);
    
    // Add longer delay to avoid rate limiting (AllTick has strict limits)
    console.log('Waiting 5 seconds to avoid rate limit...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try different AllTick endpoints for historical data
    let response;
    let endpoint = '/depth-tick';
    let endpointTried = [];
    
    try {
      // First try depth-tick (Level 2 real-time/recent data)
      console.log(`Trying ${endpoint} endpoint...`);
      response = await axios.get(`${baseUrl}${endpoint}`, {
        params: {
          token: ALLTICK_API_KEY,
          query: queryString
        },
        timeout: 30000
      });
      endpointTried.push(endpoint);
    } catch (error) {
      console.log(`${endpoint} failed:`, error.response?.data || error.message);
      endpointTried.push(`${endpoint} (failed)`);
      
      // If depth-tick fails, try kline (OHLCV historical data) as fallback
      endpoint = '/kline';
      console.log(`Trying ${endpoint} endpoint for historical data...`);
      
      // Create kline-specific query
      const klineQuery = {
        trace: generateTraceId(),
        data: {
          code: apiSymbol,
          kline_type: 1,          // 1 minute bars
          kline_timestamp_end: endTime,  // End timestamp
          query_kline_num: Math.min(1000, Math.floor((endTime - startTime) / 60)), // Number of records
          adjust_type: 0          // No adjustment
        }
      };
      const klineQueryString = JSON.stringify(klineQuery);
      
      console.log('- Kline Query:', JSON.stringify(klineQuery, null, 2));
      
      response = await axios.get(`${baseUrl}${endpoint}`, {
        params: {
          token: ALLTICK_API_KEY,
          query: klineQueryString
        },
        timeout: 30000
      });
      endpointTried.push(endpoint);
    }

    console.log('AllTick API Response:', response.data);
    
    // AllTick API uses different response codes - 200 means success, not 0
    if (response.data && (response.data.ret === 0 || response.data.ret === 200)) {
      console.log(`Success response from AllTick API via ${endpoint}`);
      res.json({
        success: true,
        data: response.data.data || response.data,
        symbol,
        totalRecords: response.data.data ? (Array.isArray(response.data.data) ? response.data.data.length : 1) : 0,
        note: `Data retrieved successfully from AllTick ${endpoint} API`,
        endpoint: endpoint,
        endpointsTried: endpointTried,
        queryType: endpoint === '/kline' ? 'Historical OHLCV' : 'Level 2 Depth'
      });
    } else if (response.data?.ret === 605) {
      // Rate limit hit - return proper error
      console.error('Rate limit exceeded');
      res.status(429).json({
        error: 'AllTick API rate limit exceeded. Please wait 1-2 minutes before trying again. Free accounts have limited requests per minute.',
        apiCode: 605,
        suggestion: 'Try again in a few minutes, or consider upgrading your AllTick API plan for higher limits.',
        details: response.data
      });
    } else {
      console.error('AllTick API Error:', response.data);
      res.status(400).json({
        error: `AllTick API Error: ${response.data?.msg || 'Unknown error'}`,
        details: response.data,
        apiCode: response.data?.ret
      });
    }
    
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Request timeout - please try a smaller date range' });
    } else if (error.response) {
      res.status(error.response.status).json({ 
        error: 'API request failed', 
        details: error.response.data 
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get latest quote for a symbol (for preview)
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { market = 'stock' } = req.query;
    
    const baseUrl = market === 'stock' ? ALLTICK_BASE_URLS.stock : ALLTICK_BASE_URLS.general;
    
    const response = await axios.get(`${baseUrl}/realtime`, {
      params: {
        token: ALLTICK_API_KEY,
        query: JSON.stringify({ code: symbol })
      },
      timeout: 10000
    });

    if (response.data && response.data.code === 0) {
      res.json({
        success: true,
        data: response.data.data
      });
    } else {
      res.status(400).json({
        error: 'Invalid response from Alltick API',
        details: response.data
      });
    }
    
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Catch all handler for React routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Key configured: ${ALLTICK_API_KEY ? 'Yes' : 'No'}`);
});
