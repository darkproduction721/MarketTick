import React, { useState } from 'react';
import SymbolSelector from './components/SymbolSelector';
import DataPreview from './components/DataPreview';
import { MarketDataResponse, DepthData } from './types';
import { exportToCSV, exportToJSON, exportRawDataToJSON, estimateDataSize } from './utils/dataExport';
import apiService from './services/api';
import './App.css';

function App() {
  // State management
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('stock');
  const [marketData, setMarketData] = useState<DepthData[]>([]);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchInfo, setLastFetchInfo] = useState<{
    symbol: string;
    recordCount: number;
  } | null>(null);

  // Handle symbol selection
  const handleSymbolChange = (symbol: string, market: string) => {
    setSelectedSymbol(symbol);
    setSelectedMarket(market);
    setError(null);
  };

  // Validate form inputs
  const isFormValid = () => {
    return selectedSymbol;
  };

  // Fetch market data
  const fetchMarketData = async () => {
    if (!isFormValid()) {
      setError('Please select a symbol');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: MarketDataResponse = await apiService.getMarketData({
        symbol: selectedSymbol,
        market: selectedMarket
      });

      if (response.success && response.data) {
        setMarketData(response.data);
        setRawApiResponse(response); // Store the complete API response for raw download
        setLastFetchInfo({
          symbol: response.symbol,
          recordCount: response.totalRecords
        });
        setError(null);
      } else {
        setError('No data received from API');
        setMarketData([]);
        setRawApiResponse(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      setMarketData([]);
      setRawApiResponse(null);
      setLastFetchInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle data download
  const handleDownload = (format: 'csv' | 'json') => {
    if (format === 'csv' && (!marketData || marketData.length === 0)) {
      alert('No data available for CSV download');
      return;
    }
    
    if (format === 'json' && !rawApiResponse && (!marketData || marketData.length === 0)) {
      alert('No data available for JSON download');
      return;
    }

    const filename = `${selectedSymbol}_level2.${format}`;
    
    if (format === 'csv') {
      exportToCSV(marketData, filename);
    } else {
      // For JSON, download the raw API response data
      if (rawApiResponse) {
        exportRawDataToJSON(rawApiResponse, filename);
      } else {
        // Fallback to processed data if raw response not available
        exportToJSON(marketData, filename);
      }
    }
  };

  // Calculate estimated data size
  const getEstimatedSize = () => {
    if (!lastFetchInfo) return null;
    return estimateDataSize(lastFetchInfo.recordCount);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>MarketTick - Level 2 Data Downloader</h1>
        <p>Download historical Level 2 market data from AllTick.co</p>
      </header>

      <main className="app-main">
        <div className="data-form-container">
          <div className="form-section">
            <h2>Select Data Parameters</h2>
            
            <SymbolSelector
              selectedSymbol={selectedSymbol}
              onSymbolChange={handleSymbolChange}
              disabled={loading}
            />

            <div className="action-buttons">
              <button
                onClick={fetchMarketData}
                disabled={!isFormValid() || loading}
                className="fetch-button primary-button"
              >
                {loading ? 'Fetching Data...' : 'Fetch Data'}
              </button>
            </div>

            {error && (
              <div className="error-alert">
                <strong>Error:</strong> {error}
                {error.includes('rate limit') && (
                  <div className="rate-limit-help">
                    <p><strong>Rate Limit Help:</strong></p>
                    <ul>
                      <li>AllTick free accounts have strict limits (~20 requests/minute)</li>
                      <li>Wait 2-3 minutes between requests</li>
                      <li>Consider upgrading your AllTick API plan for higher limits</li>
                      <li>Use smaller date ranges to reduce data volume</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {(lastFetchInfo && marketData.length > 0) || (lastFetchInfo && rawApiResponse) ? (
            <div className="download-section">
              <h3>Download Data</h3>
              <div className="download-info">
                <p><strong>Symbol:</strong> {lastFetchInfo.symbol}</p>
                <p><strong>Records:</strong> {lastFetchInfo.recordCount.toLocaleString()}</p>
                <p><strong>Estimated Size:</strong> {getEstimatedSize()}</p>
                <p><strong>Data Status:</strong> 
                  {marketData.length > 0 ? `${marketData.length} processed records` : 'Raw API data available'}
                  {rawApiResponse ? ' | Raw response available' : ' | No raw response'}
                </p>
              </div>
              
              <div className="download-buttons">
                <button
                  onClick={() => handleDownload('csv')}
                  className="download-button csv-button"
                  disabled={loading}
                >
                  Download CSV
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  className="download-button json-button"
                  disabled={loading}
                >
                  Download JSON
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <DataPreview
          data={marketData}
          loading={loading}
          error={error}
        />
      </main>

      <footer className="app-footer">
        <p>Powered by AllTick.co API | Built with React & TypeScript</p>
      </footer>
    </div>
  );
}

export default App;