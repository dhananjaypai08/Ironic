import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';

export const useReserveData = () => {
  const { getLatestReserve } = useContract();
  const [reservePrice, setReservePrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  const fetchReserveData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const price = await getLatestReserve();
      if (price !== null) {
        setReservePrice(price);
        
        // Add to price history for charts
        setPriceHistory(prev => {
          const newEntry = {
            timestamp: Date.now(),
            price: parseFloat(price),
            time: new Date().toLocaleTimeString()
          };
          
          // Keep last 50 entries
          const updated = [...prev, newEntry].slice(-50);
          return updated;
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Reserve data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getLatestReserve]);

  // Fetch data on mount and set interval
  useEffect(() => {
    fetchReserveData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchReserveData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchReserveData]);

  const getReserveInfo = () => ({
    name: "BTC.b Proof of Reserves",
    symbol: "BTC.b",
    decimals: 8,
    description: "Bitcoin.b reserve backed synthetic token",
    currentPrice: reservePrice,
    priceHistory,
    lastUpdated: new Date().toISOString()
  });

  return {
    reservePrice,
    priceHistory,
    loading,
    error,
    refetch: fetchReserveData,
    reserveInfo: getReserveInfo()
  };
};