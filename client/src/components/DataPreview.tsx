import React, { useState } from 'react';
import { DepthData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './DataPreview.css';

interface DataPreviewProps {
  data: DepthData[];
  loading: boolean;
  error: string | null;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, loading, error }) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [showRawData, setShowRawData] = useState(false);

  if (loading) {
    return (
      <div className="data-preview">
        <div className="preview-header">
          <h3>Data Preview</h3>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-preview">
        <div className="preview-header">
          <h3>Data Preview</h3>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-preview">
        <div className="preview-header">
          <h3>Data Preview</h3>
        </div>
        <div className="no-data-container">
          <p>No data available. Please select a symbol and date range to fetch data.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.slice(0, 100).map((item, index) => ({
    index,
    timestamp: new Date(item.timestamp * 1000).toLocaleTimeString(),
    bestBid: item.bids?.[0]?.[0] || 0,
    bestAsk: item.asks?.[0]?.[0] || 0,
    bidVolume: item.bids?.[0]?.[1] || 0,
    askVolume: item.asks?.[0]?.[1] || 0,
    spread: (item.asks?.[0]?.[0] || 0) - (item.bids?.[0]?.[0] || 0)
  }));

  // Calculate some basic statistics
  const stats = {
    totalRecords: data.length,
    avgSpread: chartData.reduce((sum, item) => sum + item.spread, 0) / chartData.length,
    maxBid: Math.max(...chartData.map(item => item.bestBid)),
    minBid: Math.min(...chartData.map(item => item.bestBid)),
    maxAsk: Math.max(...chartData.map(item => item.bestAsk)),
    minAsk: Math.min(...chartData.map(item => item.bestAsk)),
  };

  const formatNumber = (num: number) => {
    return num.toFixed(4);
  };

  return (
    <div className="data-preview">
      <div className="preview-header">
        <h3>Data Preview</h3>
        <div className="view-controls">
          <button
            className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            className={`view-button ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => setViewMode('chart')}
          >
            Chart View
          </button>
        </div>
      </div>

      <div className="data-stats">
        <div className="stat-item">
          <span className="stat-label">Total Records:</span>
          <span className="stat-value">{stats.totalRecords.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Spread:</span>
          <span className="stat-value">{formatNumber(stats.avgSpread)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Bid Range:</span>
          <span className="stat-value">{formatNumber(stats.minBid)} - {formatNumber(stats.maxBid)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ask Range:</span>
          <span className="stat-value">{formatNumber(stats.minAsk)} - {formatNumber(stats.maxAsk)}</span>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="table-container">
          <div className="table-controls">
            <label>
              <input
                type="checkbox"
                checked={showRawData}
                onChange={(e) => setShowRawData(e.target.checked)}
              />
              Show raw order book data
            </label>
          </div>
          
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Best Bid</th>
                  <th>Best Ask</th>
                  <th>Spread</th>
                  <th>Bid Volume</th>
                  <th>Ask Volume</th>
                  {showRawData && <th>Raw Data</th>}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 20).map((item, index) => {
                  const bestBid = item.bids?.[0];
                  const bestAsk = item.asks?.[0];
                  const spread = bestAsk && bestBid ? bestAsk[0] - bestBid[0] : 0;
                  
                  return (
                    <tr key={index}>
                      <td>{new Date(item.timestamp * 1000).toLocaleString()}</td>
                      <td className="price-cell">{bestBid ? formatNumber(bestBid[0]) : 'N/A'}</td>
                      <td className="price-cell">{bestAsk ? formatNumber(bestAsk[0]) : 'N/A'}</td>
                      <td className="spread-cell">{formatNumber(spread)}</td>
                      <td className="volume-cell">{bestBid ? bestBid[1].toLocaleString() : 'N/A'}</td>
                      <td className="volume-cell">{bestAsk ? bestAsk[1].toLocaleString() : 'N/A'}</td>
                      {showRawData && (
                        <td className="raw-data-cell">
                          <details>
                            <summary>View</summary>
                            <pre>{JSON.stringify(item, null, 2)}</pre>
                          </details>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {data.length > 20 && (
            <div className="table-info">
              Showing first 20 records of {data.length.toLocaleString()} total records.
            </div>
          )}
        </div>
      )}

      {viewMode === 'chart' && (
        <div className="chart-container">
          <div className="chart-wrapper">
            <h4>Price Movement (First 100 Records)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="index" 
                  label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Price', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  labelFormatter={(label) => `Point ${label}`}
                  formatter={(value: any, name: string) => [formatNumber(Number(value)), name]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bestBid" 
                  stroke="#dc3545" 
                  strokeWidth={2}
                  name="Best Bid"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="bestAsk" 
                  stroke="#28a745" 
                  strokeWidth={2}
                  name="Best Ask"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper">
            <h4>Bid-Ask Spread</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatNumber(Number(value)), 'Spread']}
                />
                <Line 
                  type="monotone" 
                  dataKey="spread" 
                  stroke="#007bff" 
                  strokeWidth={2}
                  name="Spread"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreview;
