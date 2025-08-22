import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './DateRangePicker.css';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false
}) => {
  const maxDate = new Date(); // Can't select future dates
  const minDate = new Date('2020-01-01'); // Reasonable minimum date

  const handleStartDateChange = (date: Date | null) => {
    onStartDateChange(date);
    // If end date is before start date, reset end date
    if (date && endDate && date > endDate) {
      onEndDateChange(date);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    onEndDateChange(date);
  };

  const getPresetDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
  };

  const applyPreset = (days: number) => {
    const { start, end } = getPresetDateRange(days);
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className="date-range-picker">
      <label>Date Range:</label>
      
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">From:</label>
          <DatePicker
            id="start-date"
            selected={startDate}
            onChange={handleStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={maxDate}
            minDate={minDate}
            placeholderText="Start date"
            dateFormat="yyyy-MM-dd"
            className="date-input"
            disabled={disabled}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
          />
        </div>
        
        <div className="date-input-group">
          <label htmlFor="end-date">To:</label>
          <DatePicker
            id="end-date"
            selected={endDate}
            onChange={handleEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || minDate}
            maxDate={maxDate}
            placeholderText="End date"
            dateFormat="yyyy-MM-dd"
            className="date-input"
            disabled={disabled}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
          />
        </div>
      </div>

      <div className="preset-buttons">
        <button
          type="button"
          onClick={() => applyPreset(1)}
          disabled={disabled}
          className="preset-button"
        >
          Last 24 Hours
        </button>
        <button
          type="button"
          onClick={() => applyPreset(7)}
          disabled={disabled}
          className="preset-button"
        >
          Last 7 Days
        </button>
        <button
          type="button"
          onClick={() => applyPreset(30)}
          disabled={disabled}
          className="preset-button"
        >
          Last 30 Days
        </button>
      </div>

      {startDate && endDate && (
        <div className="date-range-info">
          Duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
