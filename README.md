# MarketTick - Real-Time Level 2 Data Collector

A web application for fetching, collecting, and building historical Level 2 market data from AllTick.co API. The app provides automated data collection during Hong Kong market hours, helping you build your own historical tick database minute-by-minute. Features both manual data fetching and automated collection with market hours detection.

## Features

- 🔍 **Symbol Selection**: Choose from available stocks and crypto currencies
- 🤖 **Automated Data Collection**: Set-and-forget collection during market hours (24/7 for crypto)
- 📚 **Historical Data Building**: Automatically save minute-by-minute JSON files to build your own historical database
- ⏰ **Market Hours Detection**: Smart scheduling for stock markets (9:30-12:00, 13:00-16:00 HKT) and 24/7 crypto
- 📊 **Raw Data Preview**: View complete unprocessed API responses 
- 💾 **Multiple Export Formats**: Download data as CSV or JSON
- 📈 **Collection Statistics**: Track success rates and monitor collection performance
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Data**: Fetches current Level 2 market data
- 🚫 **No Mock Data**: Enforced real data policy with .cursorrules

## Technology Stack

### Backend
- Node.js with Express.js
- AllTick.co API integration
- Environment-based configuration
- Comprehensive error handling and rate limiting

### Frontend
- React 18 with TypeScript
- Raw API response display
- Clean, modern UI design
- TypeScript for type safety

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- AllTick.co API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/darkproduction721/MarketTick.git
   cd MarketTick
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # AllTick API Configuration
   ALLTICK_API_KEY=your_api_key_here
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 3001) and frontend development server (port 3000).

## API Configuration

The application uses the AllTick.co API to fetch real-time Level 2 market data. Make sure you have:

1. A valid API key from AllTick.co
2. Proper API access permissions for Level 2 data
3. Network access to AllTick.co endpoints

### API Endpoints Used
- `https://quote.alltick.io/quote-stock-b-api/depth-tick` - Real-time Level 2 data
- `https://quote.alltick.io/quote-stock-b-api/kline` - Fallback historical data

### Query Structure
```json
{
  "data": {
    "symbol_list": [{"code": "700.HK"}]
  },
  "trace": "unique-request-id"
}
```

## Usage

### Manual Data Fetching
1. **Select a Symbol**: Choose from available HKEX stocks (e.g., Tencent 700.HK)
2. **Fetch Data**: Click "Fetch Data (One-time)" to retrieve real-time market data
3. **View Raw Response**: Review the complete API response in JSON format
4. **Download**: Choose CSV or JSON format to download the data

### Automated Data Collection
1. **Select a Symbol**: Choose the stock symbol you want to collect data for
2. **Enable Auto-start**: Check "Auto-start during market hours" to automatically begin/end collection
3. **Start Collection**: Click "Start Collection" to begin minute-by-minute data collection
4. **Monitor Progress**: View real-time statistics including success rate and collection status
5. **Historical Data**: Files are automatically saved to your Downloads folder with timestamps

#### File Naming Convention
Automated collection saves files as: `{SYMBOL}_{TIMESTAMP}_tick.json`

Example: `700.HK_2024-01-15T09-31-00_tick.json`

#### Market Hours
- **Stock Markets**: 9:30 AM - 12:00 PM HKT (morning), 1:00 PM - 4:00 PM HKT (afternoon)
- **Crypto Markets**: 24/7 availability
- **Weekend**: Stock markets closed, crypto continues
- **Auto-collection**: Automatically starts/stops based on market hours when enabled

## Supported Symbols

### Hong Kong Exchange Stocks
- **700.HK** - Tencent Holdings
- **5.HK** - HSBC Holdings  
- **388.HK** - HK Exchanges & Clearing
- **941.HK** - China Mobile
- **175.HK** - Geely Automobile Holdings
- And many more...

### Crypto Currencies
- **BTCUSDT** - Bitcoin/USDT
- **ETHUSDT** - Ethereum/USDT  
- **BNBUSDT** - BNB/USDT
- **ADAUSDT** - Cardano/USDT
- And more popular trading pairs...

## Data Format

### Raw API Response
The application displays the complete unprocessed response from AllTick API, including:
- Success/error codes
- Raw market data
- API metadata
- Endpoint information

### CSV Export Format
- Timestamp (ISO format)
- Symbol
- Best Bid Price & Volume
- Best Ask Price & Volume
- Bid-Ask Spread

### JSON Export Format
- Complete raw API response
- Export metadata
- Timestamp information
- AllTick response structure

## Development

### Scripts

```bash
# Start development (both frontend and backend)
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build

# Start production server
npm start
```

### Development Rules

The project enforces strict data integrity through `.cursorrules`:
- ❌ No dummy, placeholder, or mock data
- ❌ No bypassing methods or workarounds  
- ✅ Real, production-like data only
- ✅ Actual API endpoints and responses
- ✅ Proper error handling for real scenarios

## API Limitations & Rate Limiting

- **Free Tier**: ~20 requests per minute
- **Rate Limiting**: 5-second delays between requests
- **Timeout**: 30-second request timeout
- **Error Handling**: Comprehensive 605 rate limit handling

### Rate Limit Help
- Wait 2-3 minutes between requests
- Consider upgrading your AllTick API plan
- Monitor console logs for rate limit warnings

## Error Handling

The application includes comprehensive error handling for:
- API connection issues
- Invalid symbols
- Network timeouts
- Rate limiting (HTTP 605)
- Data parsing errors
- AllTick API error codes

## File Structure

```
MarketTick/
├── server.js              # Express backend server
├── package.json           # Backend dependencies
├── nodemon.json           # Development server configuration
├── .env                   # Environment configuration
├── .cursorrules          # Development rules
└── client/               # React frontend
    ├── src/
    │   ├── App.tsx           # Main application
    │   ├── components/       # React components
    │   │   ├── SymbolSelector.tsx
    │   │   ├── DataPreview.tsx
    │   │   └── AutoDataCollector.tsx  # Automated collection
    │   ├── services/         # API services
    │   ├── types/           # TypeScript definitions
    │   └── utils/           # Export utilities
    └── package.json         # Frontend dependencies
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the `.cursorrules` development standards
4. Make your changes with real data only
5. Add tests if applicable
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues related to:
- **API Access**: Contact AllTick.co support
- **Application Bugs**: Create an issue in this repository
- **Feature Requests**: Submit a feature request issue

## Changelog

### v2.1.0 (Current Release)
- ✅ **Automated Data Collection**: Set-and-forget collection during market hours
- ✅ **Historical Data Building**: Minute-by-minute data collection to build your own database
- ✅ **Market Hours Detection**: Smart scheduling for stock markets and 24/7 crypto
- ✅ **High-Capacity Local Storage**: Store up to 10,000 records per symbol
- ✅ **Smart Bulk Export**: Optimized downloads with automatic chunking for large files
- ✅ **Collection Statistics**: Real-time monitoring of success rates and storage health
- ✅ **Enhanced Symbol Support**: HKEX stocks and crypto currencies
- ✅ **Improved Error Handling**: Comprehensive rate limiting and API error management

### v1.0.0 (Previous Release)
- Symbol selection with search functionality
- Date range picker with presets
- Data preview with table and chart views
- CSV and JSON export capabilities
- Responsive design