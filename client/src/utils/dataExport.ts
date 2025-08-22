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

  // Format data with readable timestamps
  const formattedData = data.map(item => ({
    ...item,
    timestamp: item.timestamp,
    datetime: new Date(item.timestamp * 1000).toISOString()
  }));

  const jsonContent = JSON.stringify(formattedData, null, 2);
  
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
