import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import TransactionStatus from './TransactionStatus';
import toast from 'react-hot-toast';

const DepositModal = ({ isOpen, onClose, reservePrice }) => {
  const { deposit, depositStopLoss, convertToMintAmount, loading } = useContract();
  const { refetch } = useUserData();
  
  const [amount, setAmount] = useState('');
  const [stopLoss, setStopLoss] = useState(false);
  const [stopLossThreshold, setStopLossThreshold] = useState('');
  const [estimatedMint, setEstimatedMint] = useState('0');
  const [txHash, setTxHash] = useState(null);
  const [txStatus, setTxStatus] = useState('idle'); // idle, pending, confirmed, failed

  const tokenName = 'ccip-bnm';

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
      await tx.wait();
      setTxStatus('confirmed');
      
      // Refresh user data
      setTimeout(() => {
        refetch();
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
  };

  const handleClose = () => {
    resetModal();
    onClose();
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
          className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Deposit Tokens</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {txStatus === 'idle' && (
              <>
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
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-3 text-gray-400 text-sm">
                      {tokenName.toUpperCase()}
                    </span>
                  </div>
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
                      1 {tokenName.toUpperCase()} = {parseFloat(reservePrice || 0).toFixed(2)} IRN
                    </span>
                  </div>
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
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{stopLoss ? 'Deposit with Stop Loss' : 'Deposit'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
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