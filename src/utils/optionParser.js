/**
 * Utility functions to parse and stringify options between
 * "key~value;key~value" format and JavaScript object
 */
const optionParser = {
  /**
   * Parse string format "key1~value1;key2~value2" to object
   * @param {string} str - The string to parse
   * @returns {Object} - Parsed object
   */
  parse(str) {
    if (!str || typeof str !== 'string') {
      return {};
    }
    
    const result = {};
    const pairs = str.split(';');
    
    for (const pair of pairs) {
      if (pair.includes('~')) {
        const [key, value] = pair.split('~');
        if (key && value !== undefined) {
          result[key.trim()] = value.trim();
        }
      }
    }
    
    return result;
  },

  /**
   * Convert object to string format "key1~value1;key2~value2"
   * @param {Object} obj - The object to stringify
   * @returns {string} - Formatted string
   */
  stringify(obj) {
    if (!obj || typeof obj !== 'object') {
      return '';
    }
    
    const pairs = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        pairs.push(`${key}~${value}`);
      }
    }
    
    return pairs.join(';');
  },

  /**
   * Parse and then stringify (useful for validation/normalization)
   * @param {string} str - Input string
   * @returns {string} - Normalized string
   */
  normalize(str) {
    const obj = this.parse(str);
    return this.stringify(obj);
  }
};
