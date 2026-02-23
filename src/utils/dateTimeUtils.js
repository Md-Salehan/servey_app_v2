// utils/dateTimeUtils.js
export const parseDateString = (dateString) => {
  if (!dateString) return null;

  if (dateString.includes('T')) {
    // ISO format: YYYY-MM-DDTHH:mm
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  } else if (dateString.includes(':')) {
    // Time only: HH:mm
    const [hours, minutes] = dateString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  } else {
    // Date only: YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
};

export const formatDisplayValue = (dateString, mode) => {
  const date = parseDateString(dateString);
  if (!date) return '';

  if (mode === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } else if (mode === 'datetime') {
    const datePart = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} ${timePart}`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
};

export const formatOutputValue = (date, mode) => {
  if (!date) return '';

  if (mode === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } else if (mode === 'datetime') {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${dateStr}T${timeStr}`;
  } else {
    return date.toISOString().split('T')[0];
  }
};

export const getDefaultPlaceholder = (mode) => {
  switch (mode) {
    case 'time': return 'Select time';
    case 'datetime': return 'Select date and time';
    default: return 'Select date';
  }
};