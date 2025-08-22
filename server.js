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

// Helper function to format query data for Alltick API
function formatQuery(symbol, startTime, endTime, market = 'stock') {
  // AllTick API expects specific format
  return {
    code: symbol,
    begin_time: startTime.toString(),
    end_time: endTime.toString()
  };
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
        // Try various formats that might work
        { code: 'BTC-USD', name: 'Bitcoin/USD (Dash)', market: 'crypto' },
        { code: 'BTC/USD', name: 'Bitcoin/USD (Slash)', market: 'crypto' },
        { code: 'BTCUSD', name: 'Bitcoin/USD (Simple)', market: 'crypto' },
        { code: 'BTC_USD', name: 'Bitcoin/USD (Underscore)', market: 'crypto' },
        
        { code: 'EUR-USD', name: 'EUR/USD (Dash)', market: 'forex' },
        { code: 'EUR/USD', name: 'EUR/USD (Slash)', market: 'forex' },
        { code: 'EURUSD', name: 'EUR/USD (Simple)', market: 'forex' },
        
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
    const { symbol, startDate, endDate, market = 'stock' } = req.body;
    
    if (!symbol || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: symbol, startDate, endDate' 
      });
    }

    // Convert dates to timestamps (Alltick expects Unix timestamps)
    // ALWAYS use historical dates for testing
    const now = new Date();
    const requestStartDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
    const requestEndDate = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000));   // 1 day ago
    
    console.log('Using historical dates:');
    console.log('- Original start:', startDate);
    console.log('- Original end:', endDate);
    console.log('- Adjusted start:', requestStartDate.toISOString());
    console.log('- Adjusted end:', requestEndDate.toISOString());
    
    const startTime = Math.floor(requestStartDate.getTime() / 1000);
    const endTime = Math.floor(requestEndDate.getTime() / 1000);
    
    // Choose the appropriate base URL based on market type
    const baseUrl = market === 'stock' ? ALLTICK_BASE_URLS.stock : ALLTICK_BASE_URLS.general;
    
    // Prepare the query
    const query = formatQuery(symbol, startTime, endTime, market);
    const queryString = JSON.stringify(query);
    
    console.log('AllTick API Request:');
    console.log('- URL:', `${baseUrl}/depth-tick`);
    console.log('- Symbol:', symbol);
    console.log('- Query:', queryString);
    console.log('- Start Time:', new Date(startTime * 1000).toISOString());
    console.log('- End Time:', new Date(endTime * 1000).toISOString());
    
    // Add delay to avoid rate limiting
    console.log('Waiting 3 seconds to avoid rate limit...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try different AllTick endpoints based on data availability
    let response;
    let endpoint = '/depth-tick';
    
    try {
      // First try depth-tick (Level 2 data)
      response = await axios.get(`${baseUrl}${endpoint}`, {
        params: {
          token: ALLTICK_API_KEY,
          query: queryString
        },
        timeout: 30000
      });
    } catch (error) {
      console.log('depth-tick failed, trying kline endpoint...');
      // If depth-tick fails, try kline (OHLCV data) as fallback
      endpoint = '/kline';
      response = await axios.get(`${baseUrl}${endpoint}`, {
        params: {
          token: ALLTICK_API_KEY,
          query: queryString
        },
        timeout: 30000
      });
    }

    console.log('AllTick API Response:', response.data);
    
    if (response.data && response.data.ret === 0) {
      res.json({
        success: true,
        data: response.data.data,
        symbol,
        startDate,
        endDate,
        totalRecords: response.data.data ? response.data.data.length : 0
      });
    } else if (response.data?.ret === 605) {
      // Rate limit hit - return proper error
      console.error('Rate limit exceeded');
      res.status(429).json({
        error: 'AllTick API rate limit exceeded. Please wait a few minutes and try again.',
        apiCode: 605,
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
