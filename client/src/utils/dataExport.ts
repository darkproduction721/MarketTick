import { DepthData } from '../types';

export const exportToCSV = (data: DepthData[], filename: string = 'market_data.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV headers
  const headers = ['Timestamp', 'Symbol', 'Bid_Price_1', 'Bid_Volume_1', 'Ask_Price_1', 'Ask_Volume_1', 'Bid_Price_2', 'Bid_Volume_2', 'Ask_Price_2', 'Ask_Volume_2'];
  
  // Convert data to CSV rows
  const csvRows = data.map(item => {
    const timestamp = new Date(item.timestamp * 1000).toISOString();
    const bid1 = item.bids?.[0] || [0, 0];
    const bid2 = item.bids?.[1] || [0, 0];
    const ask1 = item.asks?.[0] || [0, 0];
    const ask2 = item.asks?.[1] || [0, 0];
    
    return [
      timestamp,
      item.symbol,
      bid1[0], bid1[1],
      ask1[0], ask1[1],
      bid2[0], bid2[1],
      ask2[0], ask2[1]
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...csvRows].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: DepthData[], filename: string = 'market_data.json') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Export raw data as received from AllTick API
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalRecords: data.length,
      filename: filename,
      source: 'AllTick API'
    },
    rawData: data // Export the raw data exactly as received from AllTick
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Store data locally without download prompts
export const storeDataLocally = (data: any, filename: string = 'raw_market_data.json') => {
  if (!data) {
    console.warn('No raw data available to store');
    return false;
  }

  try {
    // Prepare the data for storage
    const exportData = {
      metadata: {
        collectedAt: new Date().toISOString(),
        filename: filename,
        source: 'AllTick API - Raw Response',
        note: 'This is the complete unprocessed response from AllTick API',
        collectionType: 'automated',
        symbol: data.symbol || 'unknown',
        market: data.market || 'unknown'
      },
      rawApiResponse: data
    };

    // Get existing stored data
    const storedDataKey = `marketTick_${data.symbol || 'unknown'}_data`;
    const existingData = JSON.parse(localStorage.getItem(storedDataKey) || '[]');
    
    // Add new data
    existingData.push(exportData);
    
    // Keep only last 10000 entries per symbol (maximum storage capacity)
    if (existingData.length > 10000) {
      existingData.splice(0, existingData.length - 10000);
    }
    
    // Store back to localStorage
    localStorage.setItem(storedDataKey, JSON.stringify(existingData));
    
    // Update collection history
    const downloadHistory = JSON.parse(localStorage.getItem('marketTickCollections') || '[]');
    downloadHistory.push({
      filename,
      timestamp: new Date().toISOString(),
      symbol: data.symbol || 'unknown',
      market: data.market || 'unknown',
      stored: true
    });
    
    // Keep only last 100 collection records
    if (downloadHistory.length > 100) {
      downloadHistory.splice(0, downloadHistory.length - 100);
    }
    
    localStorage.setItem('marketTickCollections', JSON.stringify(downloadHistory));
    
    console.log(`✅ Data stored locally: ${filename} (${existingData.length} total records for ${data.symbol})`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to store data locally:', error);
    return false;
  }
};

// Export all stored data for a symbol when user explicitly requests download
export const exportStoredData = (symbol: string, format: 'json' | 'compressed' = 'json') => {
  try {
    const storedDataKey = `marketTick_${symbol}_data`;
    const storedData = JSON.parse(localStorage.getItem(storedDataKey) || '[]');
    
    if (storedData.length === 0) {
      console.warn(`No stored data found for symbol: ${symbol}`);
      return false;
    }
    
    // Calculate data size
    const dataSize = new Blob([JSON.stringify(storedData)]).size;
    const dataSizeMB = (dataSize / (1024 * 1024)).toFixed(2);
    
    console.log(`📊 Preparing export: ${storedData.length} records (${dataSizeMB} MB) for ${symbol}`);
    
    const exportPackage = {
      metadata: {
        exportedAt: new Date().toISOString(),
        symbol: symbol,
        totalRecords: storedData.length,
        dataSizeMB: parseFloat(dataSizeMB),
        firstRecord: storedData[0]?.metadata?.collectedAt || 'unknown',
        lastRecord: storedData[storedData.length - 1]?.metadata?.collectedAt || 'unknown',
        timeSpan: calculateTimeSpan(storedData),
        source: 'MarketTick - Complete Historical Collection',
        exportFormat: format,
        note: 'This file contains all collected real-time Level 2 market data for the specified symbol'
      },
      data: storedData
    };
    
    // For large datasets, use streaming approach
    let jsonContent: string;
    let filename: string;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (format === 'compressed' || dataSize > 50 * 1024 * 1024) { // > 50MB
      // Use minimal JSON for large files
      jsonContent = JSON.stringify(exportPackage);
      filename = `${symbol}_collection_${timestamp}_${storedData.length}records.json`;
    } else {
      // Pretty formatted JSON for smaller files
      jsonContent = JSON.stringify(exportPackage, null, 2);
      filename = `${symbol}_collection_${timestamp}_${storedData.length}records.json`;
    }
    
    // Create blob with appropriate MIME type
    const blob = new Blob([jsonContent], { 
      type: 'application/json;charset=utf-8;' 
    });
    
    // Verify blob creation succeeded
    if (blob.size === 0) {
      throw new Error('Failed to create data blob - file would be empty');
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set download attributes
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    link.setAttribute('type', 'application/json');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup with delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
    
    console.log(`✅ Exported ${storedData.length} records (${dataSizeMB} MB) for ${symbol}: ${filename}`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to export stored data:', error);
    
    // Try alternative export method for very large files
    if (error instanceof Error && (error.message?.includes('memory') || error.message?.includes('size'))) {
      console.log('🔄 Attempting chunked export for large dataset...');
      return exportStoredDataChunked(symbol);
    }
    
    return false;
  }
};

// Helper function to calculate time span
const calculateTimeSpan = (data: any[]): string => {
  if (data.length === 0) return 'No data';
  
  const firstTime = new Date(data[0]?.metadata?.collectedAt || '');
  const lastTime = new Date(data[data.length - 1]?.metadata?.collectedAt || '');
  
  if (isNaN(firstTime.getTime()) || isNaN(lastTime.getTime())) {
    return 'Invalid timestamps';
  }
  
  const diffHours = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    return `${Math.round(diffHours * 60)} minutes`;
  } else if (diffHours < 24) {
    return `${diffHours.toFixed(1)} hours`;
  } else {
    return `${(diffHours / 24).toFixed(1)} days`;
  }
};

// Chunked export for very large datasets
const exportStoredDataChunked = (symbol: string): boolean => {
  try {
    const storedDataKey = `marketTick_${symbol}_data`;
    const storedData = JSON.parse(localStorage.getItem(storedDataKey) || '[]');
    
    if (storedData.length === 0) return false;
    
    // Split into chunks of 1000 records each
    const chunkSize = 1000;
    const chunks = [];
    
    for (let i = 0; i < storedData.length; i += chunkSize) {
      chunks.push(storedData.slice(i, i + chunkSize));
    }
    
    console.log(`📦 Exporting ${storedData.length} records in ${chunks.length} chunks...`);
    
    // Export each chunk as separate file
    chunks.forEach((chunk, index) => {
      const chunkPackage = {
        metadata: {
          exportedAt: new Date().toISOString(),
          symbol: symbol,
          chunkNumber: index + 1,
          totalChunks: chunks.length,
          recordsInChunk: chunk.length,
          totalRecords: storedData.length,
          source: 'MarketTick - Chunked Export'
        },
        data: chunk
      };
      
      const jsonContent = JSON.stringify(chunkPackage);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${symbol}_chunk_${index + 1}_of_${chunks.length}_${timestamp}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with staggered timing to avoid overwhelming browser
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500 * (index + 1));
    });
    
    console.log(`✅ Chunked export completed: ${chunks.length} files for ${storedData.length} total records`);
    return true;
    
  } catch (error) {
    console.error('❌ Chunked export failed:', error);
    return false;
  }
};

// Get stored data count for a symbol
export const getStoredDataCount = (symbol: string): number => {
  try {
    const storedDataKey = `marketTick_${symbol}_data`;
    const storedData = JSON.parse(localStorage.getItem(storedDataKey) || '[]');
    return storedData.length;
  } catch (error) {
    return 0;
  }
};

// Get detailed storage statistics
export const getStorageStats = (symbol: string) => {
  try {
    const storedDataKey = `marketTick_${symbol}_data`;
    const storedData = JSON.parse(localStorage.getItem(storedDataKey) || '[]');
    
    if (storedData.length === 0) {
      return {
        count: 0,
        sizeMB: 0,
        timeSpan: 'No data',
        firstRecord: null,
        lastRecord: null,
        capacityUsed: 0
      };
    }
    
    const dataSize = new Blob([JSON.stringify(storedData)]).size;
    const sizeMB = parseFloat((dataSize / (1024 * 1024)).toFixed(2));
    const capacityUsed = (storedData.length / 10000) * 100; // Percentage of 10k limit
    
    return {
      count: storedData.length,
      sizeMB: sizeMB,
      timeSpan: calculateTimeSpan(storedData),
      firstRecord: storedData[0]?.metadata?.collectedAt || null,
      lastRecord: storedData[storedData.length - 1]?.metadata?.collectedAt || null,
      capacityUsed: Math.round(capacityUsed)
    };
    
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      count: 0,
      sizeMB: 0,
      timeSpan: 'Error',
      firstRecord: null,
      lastRecord: null,
      capacityUsed: 0
    };
  }
};

// Check if storage is approaching limits
export const checkStorageHealth = (): { 
  isHealthy: boolean; 
  warnings: string[]; 
  totalSizeMB: number;
  availableSpace: number;
} => {
  const warnings: string[] = [];
  let totalSize = 0;
  let isHealthy = true;
  
  try {
    // Check localStorage usage
    let localStorageSize = 0;
    for (const key in localStorage) {
      if (key.startsWith('marketTick_')) {
        localStorageSize += localStorage[key].length;
      }
    }
    
    totalSize = (localStorageSize * 2) / (1024 * 1024); // Rough size estimate in MB
    const availableSpace = 10 - totalSize; // Assume 10MB limit for localStorage
    
    if (totalSize > 8) {
      warnings.push('🚨 Storage nearly full (>8MB). Consider clearing old data.');
      isHealthy = false;
    } else if (totalSize > 5) {
      warnings.push('⚠️ Storage usage high (>5MB). Monitor capacity.');
    }
    
    // Check individual symbol storage
    const symbols = Object.keys(localStorage)
      .filter(key => key.startsWith('marketTick_') && key.endsWith('_data'))
      .map(key => key.replace('marketTick_', '').replace('_data', ''));
    
    symbols.forEach(symbol => {
      const count = getStoredDataCount(symbol);
      if (count > 9000) {
        warnings.push(`🚨 ${symbol}: Near capacity limit (${count}/10,000 records)`);
        isHealthy = false;
      } else if (count > 7000) {
        warnings.push(`⚠️ ${symbol}: High storage usage (${count}/10,000 records)`);
      }
    });
    
    return {
      isHealthy,
      warnings,
      totalSizeMB: parseFloat(totalSize.toFixed(2)),
      availableSpace: parseFloat(availableSpace.toFixed(2))
    };
    
  } catch (error) {
    console.error('Failed to check storage health:', error);
    return {
      isHealthy: false,
      warnings: ['❌ Failed to check storage health'],
      totalSizeMB: 0,
      availableSpace: 0
    };
  }
};

// Clear stored data for a symbol
export const clearStoredData = (symbol: string): boolean => {
  try {
    const storedDataKey = `marketTick_${symbol}_data`;
    localStorage.removeItem(storedDataKey);
    console.log(`✅ Cleared stored data for ${symbol}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to clear stored data:', error);
    return false;
  }
};

// Legacy function for manual downloads (still works with prompts)
export const exportRawDataToJSON = (data: any, filename: string = 'raw_market_data.json') => {
  return storeDataLocally(data, filename);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const estimateDataSize = (recordCount: number): string => {
  // Rough estimate: each record is approximately 150 bytes in JSON format
  const estimatedBytes = recordCount * 150;
  return formatFileSize(estimatedBytes);
};
