# MarketTick - Level 2 Data Downloader

A web application for downloading historical Level 2 market data from AllTick.co API. The app provides a simple interface to select symbols, date ranges, preview data, and download it in CSV or JSON format.

## Features

- 🔍 **Symbol Search**: Search and select from available market symbols
- 📅 **Date Range Selection**: Choose custom date ranges or use preset options
- 📊 **Data Preview**: View data in table or chart format before downloading
- 💾 **Multiple Export Formats**: Download data as CSV or JSON
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Statistics**: View data statistics and estimated file sizes

## Technology Stack

### Backend
- Node.js with Express.js
- AllTick.co API integration
- Environment-based configuration
- Error handling and validation

### Frontend
- React 18 with TypeScript
- Recharts for data visualization
- React DatePicker for date selection
- Responsive CSS with modern design

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- AllTick.co API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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
   ALLTICK_API_KEY=your_api_key_here
   PORT=5000
   NODE_ENV=development
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## API Configuration

The application uses the AllTick.co API to fetch market data. Make sure you have:

1. A valid API key from AllTick.co
2. Proper API access permissions for Level 2 data
3. Network access to AllTick.co endpoints

### API Endpoints Used
- `https://quote.alltick.io/quote-stock-b-api/depth-tick` - Stock market data
- `https://quote.alltick.io/quote-b-api/depth-tick` - Other market data (forex, crypto, etc.)

## Usage

1. **Select a Symbol**: Use the symbol selector to choose a financial instrument
2. **Choose Date Range**: Select start and end dates for the historical data
3. **Fetch Data**: Click "Fetch Data" to retrieve the market data
4. **Preview Data**: Review the data in table or chart view
5. **Download**: Choose CSV or JSON format to download the complete dataset

## Data Format

### Level 2 Data Structure
```typescript
interface DepthData {
  timestamp: number;           // Unix timestamp
  asks: Array<[number, number]>; // [price, volume] pairs
  bids: Array<[number, number]>; // [price, volume] pairs
  symbol: string;              // Symbol code
}
```

### CSV Export Format
- Timestamp (ISO format)
- Symbol
- Best Bid Price & Volume
- Best Ask Price & Volume
- Second level Bid & Ask data

### JSON Export Format
- Raw API response with formatted timestamps
- Complete order book data
- Metadata included

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

## API Limitations

- Rate limits may apply based on your AllTick.co subscription
- Historical data availability depends on your API access level
- Large date ranges may result in timeout errors

## Error Handling

The application includes comprehensive error handling for:
- API connection issues
- Invalid symbols or date ranges
- Network timeouts
- Data parsing errors
- Rate limiting

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues related to:
- **API Access**: Contact AllTick.co support
- **Application Bugs**: Create an issue in this repository
- **Feature Requests**: Submit a feature request issue

## Changelog

### v1.0.0 (Initial Release)
- Symbol selection with search functionality
- Date range picker with presets
- Data preview with table and chart views
- CSV and JSON export capabilities
- Responsive design
- Error handling and loading states
