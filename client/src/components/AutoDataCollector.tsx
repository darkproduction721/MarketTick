import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MarketDataResponse } from '../types';
import apiService from '../services/api';
import { exportRawDataToJSON, exportStoredData, getStoredDataCount, clearStoredData, getStorageStats, checkStorageHealth } from '../utils/dataExport';
import './AutoDataCollector.css';

interface AutoDataCollectorProps {
  selectedSymbol: string;
  selectedMarket: string;
  disabled?: boolean;
}

interface CollectionStats {
  totalCollections: number;
  successfulCollections: number;
  failedCollections: number;
  lastCollectionTime: Date | null;
  collectionErrors: string[];
}

interface MarketHours {
  isOpen: boolean;
  nextOpen: Date | null;
  nextClose: Date | null;
  sessionType: 'morning' | 'afternoon' | 'closed';
}

const AutoDataCollector: React.FC<AutoDataCollectorProps> = ({
  selectedSymbol,
  selectedMarket,
  disabled = false
}) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    totalCollections: 0,
    successfulCollections: 0,
    failedCollections: 0,
    lastCollectionTime: null,
    collectionErrors: []
  });
  const [marketHours, setMarketHours] = useState<MarketHours>({
    isOpen: false,
    nextOpen: null,
    nextClose: null,
    sessionType: 'closed'
  });
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('Stopped');
  const [storedCount, setStoredCount] = useState<number>(0);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [storageHealth, setStorageHealth] = useState<any>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const marketCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Market hours based on selected market type
  const getMarketHours = useCallback((): MarketHours => {
    const now = new Date();
    
    // Crypto markets are open 24/7
    if (selectedMarket === 'crypto') {
      return {
        isOpen: true,
        nextOpen: null,
        nextClose: null,
        sessionType: 'morning' // Use 'morning' as default for crypto
      };
    }
    
    // For stock markets, use Hong Kong time (HKT/UTC+8)
    const hkTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Convert to HKT
    const day = hkTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = hkTime.getHours();
    const minute = hkTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Stock market closed on weekends
    if (day === 0 || day === 6) {
      const nextMonday = new Date(hkTime);
      nextMonday.setDate(hkTime.getDate() + (1 + (7 - day)) % 7);
      nextMonday.setHours(9, 30, 0, 0);
      
      return {
        isOpen: false,
        nextOpen: new Date(nextMonday.getTime() - (8 * 60 * 60 * 1000)), // Convert back to local time
        nextClose: null,
        sessionType: 'closed'
      };
    }

    // Morning session: 9:30 AM - 12:00 PM HKT
    const morningStart = 9 * 60 + 30; // 9:30 AM
    const morningEnd = 12 * 60; // 12:00 PM
    
    // Afternoon session: 1:00 PM - 4:00 PM HKT
    const afternoonStart = 13 * 60; // 1:00 PM
    const afternoonEnd = 16 * 60; // 4:00 PM

    let isOpen = false;
    let sessionType: 'morning' | 'afternoon' | 'closed' = 'closed';
    let nextOpen: Date | null = null;
    let nextClose: Date | null = null;

    if (timeInMinutes >= morningStart && timeInMinutes < morningEnd) {
      isOpen = true;
      sessionType = 'morning';
      nextClose = new Date(hkTime);
      nextClose.setHours(12, 0, 0, 0);
      nextClose = new Date(nextClose.getTime() - (8 * 60 * 60 * 1000));
    } else if (timeInMinutes >= afternoonStart && timeInMinutes < afternoonEnd) {
      isOpen = true;
      sessionType = 'afternoon';
      nextClose = new Date(hkTime);
      nextClose.setHours(16, 0, 0, 0);
      nextClose = new Date(nextClose.getTime() - (8 * 60 * 60 * 1000));
    } else {
      // Market is closed, find next opening
      if (timeInMinutes < morningStart) {
        // Before morning session
        nextOpen = new Date(hkTime);
        nextOpen.setHours(9, 30, 0, 0);
        nextOpen = new Date(nextOpen.getTime() - (8 * 60 * 60 * 1000));
      } else if (timeInMinutes >= morningEnd && timeInMinutes < afternoonStart) {
        // Lunch break
        nextOpen = new Date(hkTime);
        nextOpen.setHours(13, 0, 0, 0);
        nextOpen = new Date(nextOpen.getTime() - (8 * 60 * 60 * 1000));
      } else {
        // After market close, next opening is tomorrow morning
        nextOpen = new Date(hkTime);
        nextOpen.setDate(hkTime.getDate() + 1);
        nextOpen.setHours(9, 30, 0, 0);
        nextOpen = new Date(nextOpen.getTime() - (8 * 60 * 60 * 1000));
      }
    }

    return { isOpen, nextOpen, nextClose, sessionType };
  }, [selectedMarket]);

  // Update market hours every minute
  useEffect(() => {
    const updateMarketHours = () => {
      setMarketHours(getMarketHours());
    };

    updateMarketHours();
    marketCheckRef.current = setInterval(updateMarketHours, 60000); // Check every minute

    return () => {
      if (marketCheckRef.current) {
        clearInterval(marketCheckRef.current);
      }
    };
  }, [getMarketHours]); // Depend on getMarketHours function

  const collectData = useCallback(async () => {
    if (!selectedSymbol) {
      console.warn('No symbol selected for data collection');
      return;
    }

    try {
      setCurrentStatus('Fetching data...');
      
      const response: MarketDataResponse = await apiService.getMarketData({
        symbol: selectedSymbol,
        market: selectedMarket
      });

      if (response.success && response.data) {
        // Create timestamped filename
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${selectedSymbol}_${timestamp}_tick.json`;

        // Save the data automatically
        const downloadSuccess = exportRawDataToJSON(response, filename);

        // Update stats based on download success
        if (downloadSuccess) {
          setCollectionStats(prev => ({
            ...prev,
            totalCollections: prev.totalCollections + 1,
            successfulCollections: prev.successfulCollections + 1,
            lastCollectionTime: now,
            collectionErrors: prev.collectionErrors.slice(-4) // Keep last 5 errors
          }));

          // Update stored count and stats
          const newCount = getStoredDataCount(selectedSymbol);
          setStoredCount(newCount);
          setStorageStats(getStorageStats(selectedSymbol));
          setStorageHealth(checkStorageHealth());

          setCurrentStatus(`✅ Stored locally: ${filename} (${newCount} total)`);
          console.log(`✅ Data collected and stored locally: ${filename}`);
        } else {
          setCollectionStats(prev => ({
            ...prev,
            totalCollections: prev.totalCollections + 1,
            failedCollections: prev.failedCollections + 1,
            collectionErrors: [...prev.collectionErrors.slice(-4), `Storage failed: ${filename}`]
          }));

          setCurrentStatus(`❌ Storage failed: ${filename}`);
          console.error(`❌ Data collected but storage failed: ${filename}`);
        }
      } else {
        throw new Error('No data received from API');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Data collection error:', errorMessage);

      setCollectionStats(prev => ({
        ...prev,
        totalCollections: prev.totalCollections + 1,
        failedCollections: prev.failedCollections + 1,
        collectionErrors: [...prev.collectionErrors.slice(-4), errorMessage]
      }));

      setCurrentStatus(`Error: ${errorMessage}`);
    }
  }, [selectedSymbol, selectedMarket]);

  const startCollection = useCallback(() => {
    if (!selectedSymbol) {
      alert('Please select a symbol first');
      return;
    }

    setIsCollecting(true);
    setCurrentStatus('Starting collection...');
    
    // Collect immediately
    collectData();
    
    // Then collect every minute
    intervalRef.current = setInterval(() => {
      collectData();
    }, 60000); // 60 seconds
  }, [selectedSymbol, collectData]);

  const stopCollection = useCallback(() => {
    setIsCollecting(false);
    setCurrentStatus('Stopped');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetStats = () => {
    setCollectionStats({
      totalCollections: 0,
      successfulCollections: 0,
      failedCollections: 0,
      lastCollectionTime: null,
      collectionErrors: []
    });
  };

  const handleExportStored = () => {
    if (!selectedSymbol) {
      alert('Please select a symbol first');
      return;
    }
    
    const stats = getStorageStats(selectedSymbol);
    if (stats.count === 0) {
      setCurrentStatus(`❌ No stored data found for ${selectedSymbol}`);
      return;
    }
    
    // Show confirmation for large datasets
    if (stats.count > 5000) {
      const proceed = window.confirm(
        `You're about to download ${stats.count} records (${stats.sizeMB} MB) spanning ${stats.timeSpan}.\n\n` +
        `This is a large dataset. Continue with download?`
      );
      if (!proceed) return;
    }
    
    setCurrentStatus(`📤 Preparing download: ${stats.count} records (${stats.sizeMB} MB)...`);
    
    const success = exportStoredData(selectedSymbol);
    if (success) {
      setCurrentStatus(`✅ Downloaded: ${stats.count} records (${stats.sizeMB} MB) for ${selectedSymbol}`);
    } else {
      setCurrentStatus(`❌ Download failed for ${selectedSymbol}`);
    }
  };

  const handleClearStored = () => {
    if (!selectedSymbol) {
      alert('Please select a symbol first');
      return;
    }
    
    if (window.confirm(`Clear all stored data for ${selectedSymbol}? This cannot be undone.`)) {
      const success = clearStoredData(selectedSymbol);
      if (success) {
        setStoredCount(0);
        setCurrentStatus(`🗑️ Cleared stored data for ${selectedSymbol}`);
      }
    }
  };

  // Update stored count and stats when symbol changes
  useEffect(() => {
    if (selectedSymbol) {
      setStoredCount(getStoredDataCount(selectedSymbol));
      setStorageStats(getStorageStats(selectedSymbol));
      setStorageHealth(checkStorageHealth());
    }
  }, [selectedSymbol]);

  // Auto-start/stop based on market hours
  useEffect(() => {
    if (!autoStartEnabled) return;

    if (marketHours.isOpen && !isCollecting && selectedSymbol) {
      startCollection();
    } else if (!marketHours.isOpen && isCollecting) {
      stopCollection();
    }
  }, [marketHours.isOpen, autoStartEnabled, selectedSymbol, isCollecting, startCollection, stopCollection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (marketCheckRef.current) {
        clearInterval(marketCheckRef.current);
      }
    };
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString();
  };

  const getSuccessRate = () => {
    if (collectionStats.totalCollections === 0) return 0;
    return Math.round((collectionStats.successfulCollections / collectionStats.totalCollections) * 100);
  };

  return (
    <div className="auto-data-collector">
      <div className="collector-header">
        <h3>Automated Data Collection</h3>
        <div className="market-status">
          <span className={`status-indicator ${marketHours.isOpen ? 'open' : 'closed'}`}>
            {marketHours.isOpen ? '🟢' : '🔴'}
          </span>
          <span className="market-info">
            {selectedMarket === 'crypto' ? 'Crypto Market: Open 24/7' : 
             `Stock Market: ${marketHours.isOpen ? `Open (${marketHours.sessionType})` : 'Closed'}`}
            {marketHours.nextOpen && selectedMarket !== 'crypto' && (
              <span className="next-event">
                {marketHours.isOpen ? ` | Closes: ${formatTime(marketHours.nextClose)}` 
                                    : ` | Opens: ${formatTime(marketHours.nextOpen)}`}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="collector-controls">
        <div className="control-row">
          <div className="auto-toggle">
            <label>
              <input
                type="checkbox"
                checked={autoStartEnabled}
                onChange={(e) => setAutoStartEnabled(e.target.checked)}
                disabled={disabled}
              />
              Auto-start during market hours
            </label>
          </div>
        </div>

        <div className="control-row">
          <button
            onClick={startCollection}
            disabled={disabled || isCollecting || !selectedSymbol}
            className="collector-button start-button"
          >
            Start Collection
          </button>
          <button
            onClick={stopCollection}
            disabled={!isCollecting}
            className="collector-button stop-button"
          >
            Stop Collection
          </button>
          <button
            onClick={resetStats}
            disabled={isCollecting}
            className="collector-button reset-button"
          >
            Reset Stats
          </button>
        </div>
      </div>

      <div className="collection-status">
        <div className="status-row">
          <span className="status-label">Status:</span>
          <span className={`status-value ${isCollecting ? 'active' : 'inactive'}`}>
            {currentStatus}
          </span>
        </div>
        
        <div className="status-row">
          <span className="status-label">Symbol:</span>
          <span className="status-value">{selectedSymbol || 'None selected'}</span>
        </div>

        <div className="status-row">
          <span className="status-label">Interval:</span>
          <span className="status-value">Every 1 minute</span>
        </div>
        
        <div className="status-row">
          <span className="status-label">Stored Records:</span>
          <span className="status-value">
            {storedCount} records
            {storageStats && storageStats.sizeMB > 0 && ` (${storageStats.sizeMB} MB)`}
          </span>
        </div>
        
        {storageStats && storageStats.capacityUsed > 0 && (
          <div className="status-row">
            <span className="status-label">Storage Capacity:</span>
            <span className={`status-value ${storageStats.capacityUsed > 80 ? 'warning' : ''}`}>
              {storageStats.capacityUsed}% used ({storageStats.count}/10,000)
            </span>
          </div>
        )}
      </div>

      {/* Storage Health Warnings */}
      {storageHealth && !storageHealth.isHealthy && (
        <div className="storage-warnings">
          <h4>⚠️ Storage Warnings</h4>
          {storageHealth.warnings.map((warning: string, index: number) => (
            <div key={index} className="warning-item">{warning}</div>
          ))}
        </div>
      )}

      {selectedSymbol && storedCount > 0 && (
        <div className="storage-controls">
          <h4>💾 Local Storage - {selectedSymbol}</h4>
          
          {storageStats && (
            <div className="storage-details">
              <div className="detail-row">
                <span>📊 Records:</span>
                <span>{storageStats.count} items</span>
              </div>
              <div className="detail-row">
                <span>💽 Size:</span>
                <span>{storageStats.sizeMB} MB</span>
              </div>
              <div className="detail-row">
                <span>📅 Time Span:</span>
                <span>{storageStats.timeSpan}</span>
              </div>
              <div className="detail-row">
                <span>🗄️ Capacity:</span>
                <span className={storageStats.capacityUsed > 80 ? 'capacity-warning' : ''}>
                  {storageStats.capacityUsed}% of 10,000 max
                </span>
              </div>
            </div>
          )}
          
          <div className="storage-buttons">
            <button
              onClick={handleExportStored}
              className="collector-button download-button"
              title={`Download all ${storedCount} records as optimized JSON file${storageStats && storageStats.sizeMB > 50 ? ' (Large file - may use chunked export)' : ''}`}
            >
              📥 Download All Data
              {storageStats && storageStats.sizeMB > 0 && ` (${storageStats.sizeMB} MB)`}
            </button>
            <button
              onClick={handleClearStored}
              className="collector-button clear-button"
              title="Clear all stored data for this symbol"
            >
              🗑️ Clear Data
            </button>
          </div>
          
          <div className="storage-note">
            <small>
              💡 <strong>Smart Export:</strong> 
              {storageStats && storageStats.sizeMB > 50 
                ? ` Large dataset (${storageStats.sizeMB} MB) will use optimized export. Files >100MB will be split into chunks.`
                : ` All ${storedCount} records will be exported as a single organized JSON file.`
              }
            </small>
          </div>
        </div>
      )}

      <div className="collection-stats">
        <h4>Collection Statistics</h4>
        
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{collectionStats.totalCollections}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Successful:</span>
            <span className="stat-value success">{collectionStats.successfulCollections}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Failed:</span>
            <span className="stat-value error">{collectionStats.failedCollections}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Success Rate:</span>
            <span className="stat-value">{getSuccessRate()}%</span>
          </div>
        </div>

        {collectionStats.lastCollectionTime && (
          <div className="last-collection">
            <span className="stat-label">Last Collection:</span>
            <span className="stat-value">
              {collectionStats.lastCollectionTime.toLocaleString()}
            </span>
          </div>
        )}

        {collectionStats.collectionErrors.length > 0 && (
          <div className="recent-errors">
            <h5>Recent Errors:</h5>
            <ul>
              {collectionStats.collectionErrors.slice(-3).map((error, index) => (
                <li key={index} className="error-item">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="collection-info">
        <h4>How it works:</h4>
        <ul>
          <li>Collects real-time Level 2 data every minute</li>
          <li>💾 <strong>High-capacity storage</strong> - up to 10,000 records per symbol (no prompts!)</li>
          <li>📥 <strong>Smart bulk export</strong> - optimized downloads with automatic chunking for large files</li>
          <li>📊 <strong>Storage monitoring</strong> - capacity tracking and health warnings</li>
          <li>🔄 <strong>Memory management</strong> - automatic cleanup when limits reached</li>
          <li>Stock Market hours: 9:30-12:00 (morning), 13:00-16:00 (afternoon) HKT</li>
          <li>Crypto Markets: Available 24/7</li>
          <li>Enable auto-start to automatically begin/end with market hours</li>
        </ul>
        <div className="download-note">
          <small>💡 <strong>Maximum Capacity System:</strong> Store up to 10,000 records per symbol (≈7 days of minute data). Large datasets are automatically optimized for download with chunking for files &gt;100MB. Monitor your storage capacity in real-time!</small>
        </div>
      </div>
    </div>
  );
};

export default AutoDataCollector;
