// hooks/useDateTimeValidation.js
import { useCallback } from 'react';

const useDateTimeValidation = (mode, minimumDate, maximumDate, minimumTime, maximumTime) => {
  // Safely parse a date string and return a Date object or null if invalid
  const safeParseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  // Format date for error messages
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = safeParseDate(dateString);
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Format time for error messages
  const formatTime = useCallback((timeString) => {
    if (!timeString) return '';
    const time = safeParseDate(timeString);
    if (!time) return '';
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const isDateWithinConstraints = useCallback((dateToCheck) => {
    if (!dateToCheck) return true;
    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);

    if (minimumDate) {
      const minDate = safeParseDate(minimumDate);
      if (minDate) {
        minDate.setHours(0, 0, 0, 0);
        if (checkDate < minDate) return false;
      }
    }
    if (maximumDate) {
      const maxDate = safeParseDate(maximumDate);
      if (maxDate) {
        maxDate.setHours(23, 59, 59, 999);
        if (checkDate > maxDate) return false;
      }
    }
    return true;
  }, [minimumDate, maximumDate]);

  const isTimeWithinConstraints = useCallback((timeToCheck) => {
    if (!timeToCheck || (!minimumTime && !maximumTime)) return true;
    const checkTime = new Date(timeToCheck);
    const timeValue = checkTime.getHours() * 60 + checkTime.getMinutes();

    if (minimumTime) {
      const minTime = safeParseDate(minimumTime);
      if (minTime) {
        const minValue = minTime.getHours() * 60 + minTime.getMinutes();
        if (timeValue < minValue) return false;
      }
    }
    if (maximumTime) {
      const maxTime = safeParseDate(maximumTime);
      if (maxTime) {
        const maxValue = maxTime.getHours() * 60 + maxTime.getMinutes();
        if (timeValue > maxValue) return false;
      }
    }
    return true;
  }, [minimumTime, maximumTime]);

  const getValidationErrorMessage = useCallback((selectedDate, currentPickerMode) => {
    if (!selectedDate) return '';

    if (mode === 'time' && !isTimeWithinConstraints(selectedDate)) {
      return `Time must be between ${formatTime(minimumTime)} and ${formatTime(maximumTime)}`;
    }
    if (mode === 'date' && !isDateWithinConstraints(selectedDate)) {
      return `Date must be between ${formatDate(minimumDate)} and ${formatDate(maximumDate)}`;
    }
    if (mode === 'datetime') {
      if (currentPickerMode === 'date' && !isDateWithinConstraints(selectedDate)) {
        return `Date must be between ${formatDate(minimumDate)} and ${formatDate(maximumDate)}`;
      }
      if (currentPickerMode === 'time' && !isTimeWithinConstraints(selectedDate)) {
        return `Time must be between ${formatTime(minimumTime)} and ${formatTime(maximumTime)}`;
      }
    }
    return '';
  }, [mode, isDateWithinConstraints, isTimeWithinConstraints, formatDate, formatTime, minimumDate, maximumDate, minimumTime, maximumTime]);

  return { getValidationErrorMessage };
};

export default useDateTimeValidation;