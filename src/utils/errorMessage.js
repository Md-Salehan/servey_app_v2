

export const getErrorMessage = (error) => {
  if (!error) return '';

  if ('status' in error) {
    // FetchBaseQueryError
    if (typeof error.data === 'string') return error.data;
    return error.data?.message || `Error ${error.status}`;
  }

  // SerializedError
  return error.message || 'Something went wrong';
};
