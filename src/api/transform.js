const toCamelCase = (value) => value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const transformToApi = (value) => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, itemValue]) => {
    acc[toCamelCase(key)] = itemValue;
    return acc;
  }, {});
};

export const transformToDb = (value) => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, itemValue]) => {
    const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    acc[dbKey] = itemValue;
    return acc;
  }, {});
};
