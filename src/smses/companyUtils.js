// src/utils/companyUtils.js
export const generateCompanyId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `comp_${timestamp}_${randomStr}`.toUpperCase();
};

export const validateCompanyName = (name) => {
  return name && name.trim().length >= 2;
};