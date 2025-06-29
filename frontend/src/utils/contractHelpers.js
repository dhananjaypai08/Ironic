import { ethers } from 'ethers';

export const formatTokenAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  return ethers.parseUnits(amount.toString(), decimals);
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

export const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - (timestamp * 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const calculateAPY = (initialAmount, currentAmount, timeInDays) => {
  if (initialAmount <= 0 || timeInDays <= 0) return 0;
  const gain = currentAmount - initialAmount;
  const dailyReturn = gain / initialAmount / timeInDays;
  const apy = ((1 + dailyReturn) ** 365 - 1) * 100;
  return apy;
};

export const formatCurrency = (amount, decimals = 2) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatPercentage = (value, decimals = 2) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00%';
  return `${num.toFixed(decimals)}%`;
};

export const getTransactionUrl = (txHash, chainConfig) => {
  return `${chainConfig.explorerUrl}/tx/${txHash}`;
};

export const getAddressUrl = (address, chainConfig) => {
  return `${chainConfig.explorerUrl}/address/${address}`;
};

export const validateAmount = (amount, maxAmount = null) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  if (maxAmount && num > parseFloat(maxAmount)) {
    return { isValid: false, error: 'Amount exceeds available balance' };
  }
  return { isValid: true, error: null };
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};