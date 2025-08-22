import React, { useState, useEffect } from 'react';
import { Symbol } from '../types';
import apiService from '../services/api';
import './SymbolSelector.css';

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string, market: string) => void;
  disabled?: boolean;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedSymbol,
  onSymbolChange,
  disabled = false
}) => {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading symbols...');
      const symbolsData = await apiService.getSymbols();
      console.log('Symbols loaded:', symbolsData);
      setSymbols(symbolsData);
    } catch (err) {
      console.error('Error loading symbols:', err);
      setError(err instanceof Error ? err.message : 'Failed to load symbols');
    } finally {
      setLoading(false);
    }
  };

  const filteredSymbols = symbols.filter(symbol =>
    symbol.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    symbol.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSymbolSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = event.target.value;
    const selectedSymbol = symbols.find(s => s.code === selectedCode);
    if (selectedSymbol) {
      onSymbolChange(selectedCode, selectedSymbol.market);
    }
  };

  if (loading) {
    return (
      <div className="symbol-selector">
        <label>Symbol:</label>
        <div className="loading-spinner">Loading symbols...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="symbol-selector">
        <label>Symbol:</label>
        <div className="error-message">
          {error}
          <button onClick={loadSymbols} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="symbol-selector">
      <label htmlFor="symbol-select">Symbol:</label>
      <div className="symbol-input-container">
        <input
          type="text"
          placeholder="Search symbols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="symbol-search"
          disabled={disabled}
        />
        <select
          id="symbol-select"
          value={selectedSymbol}
          onChange={handleSymbolSelect}
          disabled={disabled}
          className="symbol-select"
        >
          <option value="">Select a symbol</option>
          {filteredSymbols.map((symbol) => (
            <option key={symbol.code} value={symbol.code}>
              {symbol.code} - {symbol.name} ({symbol.market})
            </option>
          ))}
        </select>
      </div>
      {selectedSymbol && (
        <div className="selected-symbol-info">
          Selected: {symbols.find(s => s.code === selectedSymbol)?.name}
        </div>
      )}
    </div>
  );
};

export default SymbolSelector;
