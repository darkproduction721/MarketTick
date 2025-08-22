import React, { useState } from 'react';
import SymbolSelector from './components/SymbolSelector';
import DateRangePicker from './components/DateRangePicker';
import DataPreview from './components/DataPreview';
import { MarketDataResponse, DepthData } from './types';
import { exportToCSV, exportToJSON, estimateDataSize } from './utils/dataExport';
import apiService from './services/api';
import './App.css';

function App() {
  // State management
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('stock');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [marketData, setMarketData] = useState<DepthData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchInfo, setLastFetchInfo] = useState<{
    symbol: string;
    startDate: string;
    endDate: string;
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
    return selectedSymbol && startDate && endDate && startDate <= endDate;
  };

  // Fetch market data
  const fetchMarketData = async () => {
    if (!isFormValid()) {
      setError('Please select a symbol and valid date range');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: MarketDataResponse = await apiService.getMarketData({
        symbol: selectedSymbol,
        startDate: startDate!.toISOString().split('T')[0],
        endDate: endDate!.toISOString().split('T')[0],
        market: selectedMarket
      });

      if (response.success && response.data) {
        setMarketData(response.data);
        setLastFetchInfo({
          symbol: response.symbol,
          startDate: response.startDate,
          endDate: response.endDate,
          recordCount: response.totalRecords
        });
        setError(null);
      } else {
        setError('No data received from API');
        setMarketData([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      setMarketData([]);
      setLastFetchInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle data download
  const handleDownload = (format: 'csv' | 'json') => {
    if (!marketData || marketData.length === 0) {
      alert('No data available to download');
      return;
    }

    const filename = `${selectedSymbol}_${startDate?.toISOString().split('T')[0]}_${endDate?.toISOString().split('T')[0]}_level2.${format}`;
    
    if (format === 'csv') {
      exportToCSV(marketData, filename);
    } else {
      exportToJSON(marketData, filename);
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

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
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
              </div>
            )}
          </div>

          {lastFetchInfo && marketData.length > 0 && (
            <div className="download-section">
              <h3>Download Data</h3>
              <div className="download-info">
                <p><strong>Symbol:</strong> {lastFetchInfo.symbol}</p>
                <p><strong>Date Range:</strong> {lastFetchInfo.startDate} to {lastFetchInfo.endDate}</p>
                <p><strong>Records:</strong> {lastFetchInfo.recordCount.toLocaleString()}</p>
                <p><strong>Estimated Size:</strong> {getEstimatedSize()}</p>
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
          )}
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