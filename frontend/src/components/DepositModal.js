import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  Shield, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle,
  RefreshCw,
  Info,
  Eye
} from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { CONTRACT_CONFIG, CHAIN_CONFIG } from '@/utils/constants';
import { ethers } from 'ethers';
import TransactionStatus from './TransactionStatus';
import toast from 'react-hot-toast';

const DepositModal = ({ isOpen, onClose, reservePrice }) => {
  const { 
    deposit, 
    depositStopLoss, 
    convertToMintAmount, 
    checkTokenAllowance,
    checkTokenBalance,
    getContractAddress,
    loading,
    address 
  } = useContract();
  const { refetch } = useUserData();
  
  const [amount, setAmount] = useState('');
  const [stopLoss, setStopLoss] = useState(false);
  const [stopLossThreshold, setStopLossThreshold] = useState('');
  const [estimatedMint, setEstimatedMint] = useState('0');
  const [txHash, setTxHash] = useState(null);
  const [txStatus, setTxStatus] = useState('idle'); // idle, pending, confirmed, failed
  
  // Debug/allowance states
  const [tokenBalance, setTokenBalance] = useState('0');
  const [currentAllowance, setCurrentAllowance] = useState('0');
  const [contractAddress, setContractAddress] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [loadingDebugInfo, setLoadingDebugInfo] = useState(false);

  const tokenName = 'ccip-bnm';
  const tokenAddress = CONTRACT_CONFIG.ccipBnmToken;

  // Fetch debug information
  const fetchDebugInfo = async () => {
    if (!address) return;
    
    setLoadingDebugInfo(true);
    try {
      const [balance, contractAddr] = await Promise.all([
        checkTokenBalance(tokenAddress, address),
        getContractAddress()
      ]);
      
      setTokenBalance(ethers.formatEther(balance));
      setContractAddress(contractAddr);
      
      if (contractAddr) {
        const allowance = await checkTokenAllowance(tokenAddress, address, contractAddr);
        setCurrentAllowance(ethers.formatEther(allowance));
      }
    } catch (error) {
      console.error('Error fetching debug info:', error);
    } finally {
      setLoadingDebugInfo(false);
    }
  };

  // Fetch debug info when modal opens
  useEffect(() => {
    if (isOpen && address) {
      fetchDebugInfo();
    }
  }, [isOpen, address, amount]);

  // Calculate estimated mint amount
  useEffect(() => {
    const calculateMint = async () => {
      if (amount && reservePrice) {
        try {
          const mintAmount = await convertToMintAmount(amount, reservePrice, tokenName);
          setEstimatedMint(mintAmount);
        } catch (error) {
          console.error('Error calculating mint amount:', error);
          setEstimatedMint('0');
        }
      } else {
        setEstimatedMint('0');
      }
    };

    calculateMint();
  }, [amount, reservePrice, convertToMintAmount]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (stopLoss && (!stopLossThreshold || parseFloat(stopLossThreshold) <= 0)) {
      toast.error('Please enter a valid stop-loss threshold');
      return;
    }

    if (stopLoss && parseFloat(stopLossThreshold) >= parseFloat(reservePrice)) {
      toast.error('Stop-loss threshold must be below current price');
      return;
    }

    // Check if user has enough balance
    if (parseFloat(amount) > parseFloat(tokenBalance)) {
      toast.error('Insufficient token balance');
      return;
    }

    try {
      setTxStatus('pending');
      
      let tx;
      if (stopLoss) {
        tx = await depositStopLoss(tokenName, amount, stopLossThreshold);
      } else {
        tx = await deposit(tokenName, amount);
      }
      
      setTxHash(tx.hash);
      
      // Wait for confirmation
    //   await tx.wait();
      setTxStatus('confirmed');
      
      // Refresh user data and debug info
      setTimeout(() => {
        refetch();
        fetchDebugInfo();
      }, 2000);
      
    } catch (error) {
      console.error('Deposit error:', error);
      setTxStatus('failed');
    }
  };

  const resetModal = () => {
    setAmount('');
    setStopLoss(false);
    setStopLossThreshold('');
    setEstimatedMint('0');
    setTxHash(null);
    setTxStatus('idle');
    setShowDebugInfo(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const isInsufficientAllowance = () => {
    if (!amount || !currentAllowance) return false;
    return parseFloat(amount) > parseFloat(currentAllowance);
  };

  const isInsufficientBalance = () => {
    if (!amount || !tokenBalance) return false;
    return parseFloat(amount) > parseFloat(tokenBalance);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Deposit Tokens</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                title="Toggle debug info"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {txStatus === 'idle' && (
              <>
                {/* Debug Information */}
                {showDebugInfo && (
                  <div className="mb-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-300">Debug Information</h3>
                      <button
                        onClick={fetchDebugInfo}
                        disabled={loadingDebugInfo}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingDebugInfo ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Your Address:</span>
                        <span className="font-mono text-gray-300">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Token Balance:</span>
                        <span className="font-mono text-green-400">{parseFloat(tokenBalance).toFixed(4)} CCIP-BnM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Allowance:</span>
                        <span className={`font-mono ${isInsufficientAllowance() ? 'text-red-400' : 'text-green-400'}`}>
                          {parseFloat(currentAllowance).toFixed(4)} CCIP-BnM
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Contract Address:</span>
                        <a
                          href={`${CHAIN_CONFIG.explorerUrl}/address/${contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
                        >
                          <span>{contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : 'Loading...'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Token Address:</span>
                        <a
                          href={`${CHAIN_CONFIG.explorerUrl}/address/${tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
                        >
                          <span>{tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Balance Check Warning */}
                {isInsufficientBalance() && (
                  <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-200">
                        <p className="font-medium mb-1">Insufficient Balance</p>
                        <p>You need {amount} CCIP-BnM but only have {parseFloat(tokenBalance).toFixed(4)} CCIP-BnM.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Allowance Warning */}
                {!isInsufficientBalance() && isInsufficientAllowance() && (
                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-1">Approval Required</p>
                        <p>The contract will request approval to spend {amount} CCIP-BnM tokens before depositing.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deposit Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isInsufficientBalance() ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    <div className="absolute right-3 top-3 flex items-center space-x-2">
                      {parseFloat(tokenBalance) > 0 && (
                        <button
                          onClick={() => setAmount(tokenBalance)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          MAX
                        </button>
                      )}
                      <span className="text-gray-400 text-sm">CCIP-BnM</span>
                    </div>
                  </div>
                  {parseFloat(tokenBalance) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {parseFloat(tokenBalance).toFixed(4)} CCIP-BnM
                    </p>
                  )}
                </div>

                {/* Stop Loss Option */}
                <div className="mb-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stopLoss}
                      onChange={(e) => setStopLoss(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-gray-300">Enable Stop Loss</span>
                    </div>
                  </label>
                  
                  {stopLoss && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Stop Loss Threshold (USD)
                      </label>
                      <input
                        type="number"
                        value={stopLossThreshold}
                        onChange={(e) => setStopLossThreshold(e.target.value)}
                        placeholder={`Below ${parseFloat(reservePrice || 0).toFixed(2)}`}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Estimated Output */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">You will receive:</span>
                    <span className="text-lg font-semibold text-green-400">
                      {parseFloat(estimatedMint).toFixed(6)} IRN
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Exchange Rate:</span>
                    <span className="text-gray-300">
                      1 CCIP-BnM = {parseFloat(reservePrice || 0).toFixed(2)} IRN
                    </span>
                  </div>
                  {currentAllowance !== '0' && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-400">Current Allowance:</span>
                      <span className={`text-gray-300 ${isInsufficientAllowance() ? 'text-yellow-400' : 'text-green-400'}`}>
                        {parseFloat(currentAllowance).toFixed(4)} CCIP-BnM
                      </span>
                    </div>
                  )}
                </div>

                {/* Warning */}
                {stopLoss && (
                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-1">Stop Loss Enabled</p>
                        <p>Your position will be automatically closed if the reserve price drops to ${stopLossThreshold}.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deposit Button */}
                <button
                  onClick={handleDeposit}
                  disabled={
                    loading || 
                    !amount || 
                    parseFloat(amount) <= 0 || 
                    isInsufficientBalance()
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {isInsufficientAllowance() && !isInsufficientBalance() 
                          ? `Approve & ${stopLoss ? 'Deposit with Stop Loss' : 'Deposit'}`
                          : (stopLoss ? 'Deposit with Stop Loss' : 'Deposit')
                        }
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Additional Info */}
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <p>• If this is your first deposit, you'll need to approve token spending first</p>
                  <p>• Approval and deposit will require separate transaction confirmations</p>
                  <p>• Gas fees apply for both approval and deposit transactions</p>
                </div>
              </>
            )}

            {/* Transaction Status */}
            {txStatus !== 'idle' && (
              <TransactionStatus
                status={txStatus}
                txHash={txHash}
                onClose={handleClose}
                onRetry={() => setTxStatus('idle')}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export { DepositModal };
export default DepositModal;