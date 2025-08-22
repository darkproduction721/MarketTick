import React from 'react';
import './DataPreview.css';

interface DataPreviewProps {
  data: any; // Changed to any since we're displaying raw response
  loading: boolean;
  error: string | null;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="data-preview">
        <div className="preview-header">
          <h3>Raw API Response</h3>
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
          <h3>Raw API Response</h3>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="data-preview">
        <div className="preview-header">
          <h3>Raw API Response</h3>
        </div>
        <div className="no-data-container">
          <p>No data available. Please select a symbol and date range to fetch data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-preview">
      <div className="preview-header">
        <h3>Raw API Response</h3>
        <div className="response-info">
          <span className="data-type">
            Type: {Array.isArray(data) ? `Array (${data.length} items)` : typeof data}
          </span>
        </div>
      </div>

      <div className="raw-response-container">
        <div className="raw-response-wrapper">
          <pre className="raw-response">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;