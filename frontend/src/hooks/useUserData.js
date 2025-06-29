import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';

export const useUserData = () => {
  const { 
    address, 
    isConnected, 
    getUserPortfolio, 
    getUserPositions, 
    getIronBalance 
  } = useContract();
  
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [ironBalance, setIronBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserData = useCallback(async () => {
    if (!isConnected || !address) {
      setPortfolio(null);
      setPositions([]);
      setIronBalance('0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all user data in parallel
      const [portfolioData, positionsData, balanceData] = await Promise.all([
        getUserPortfolio(address),
        getUserPositions(),
        getIronBalance('ccip-bnm', address)
      ]);

      setPortfolio(portfolioData);
      setPositions(positionsData);
      setIronBalance(balanceData);
    } catch (err) {
      setError(err.message);
      console.error('User data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, getUserPortfolio, getUserPositions, getIronBalance]);

  // Fetch data when user connects/changes
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Calculate user metrics
  const getUserMetrics = useCallback(() => {
    if (!portfolio) return null;

    const totalDeposited = parseFloat(portfolio.ironBalance) || 0;
    const totalWithdrawn = parseFloat(portfolio.withdrawn) || 0;
    const currentBalance = parseFloat(ironBalance) || 0;
    
    // Simple gain calculation (this could be more sophisticated)
    const totalGain = currentBalance - totalDeposited + totalWithdrawn;
    const gainPercentage = totalDeposited > 0 ? (totalGain / totalDeposited) * 100 : 0;

    const activePositions = positions.filter(pos => pos.isActive).length;
    const closedPositions = positions.filter(pos => !pos.isActive).length;

    // Check withdrawal availability
    const canWithdraw = portfolio.allowedWithdrawalTimestamp < Date.now() / 1000;
    const withdrawalTimeLeft = Math.max(0, portfolio.allowedWithdrawalTimestamp - Date.now() / 1000);

    return {
      totalDeposited,
      totalWithdrawn,
      currentBalance,
      totalGain,
      gainPercentage,
      activePositions,
      closedPositions,
      canWithdraw,
      withdrawalTimeLeft,
      totalPositions: positions.length
    };
  }, [portfolio, positions, ironBalance]);

  return {
    portfolio,
    positions,
    ironBalance,
    loading,
    error,
    refetch: fetchUserData,
    userMetrics: getUserMetrics(),
    isConnected,
    address
  };
};