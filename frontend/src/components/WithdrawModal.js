import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import TransactionStatus from './TransactionStatus';
import { CHAIN_CONFIG } from '@/utils/constants';
import toast from 'react-hot-toast';

const WithdrawModal = ({ isOpen, onClose }) => {
  const { withdraw, loading } = useContract();
  const { userMetrics, refetch } = useUserData();
  
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState(null);
  const [txStatus, setTxStatus] = useState('idle');

  const tokenName = 'ccip-bnm';
  const maxAmount = userMetrics?.currentBalance || '0';

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(maxAmount)) {
      toast.error('Insufficient balance');
      return;
    }

    if (!userMetrics?.canWithdraw) {
      toast.error('Withdrawal not available yet');
      return;
    }

    try {
      setTxStatus('pending');
      
      const tx = await withdraw(tokenName, amount);
      setTxHash(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      setTxStatus('confirmed');
      
      // Refresh user data
      setTimeout(() => {
        refetch();
      }, 2000);
      
    } catch (error) {
      console.error('Withdraw error:', error);
      setTxStatus('failed');
    }
  };

  const resetModal = () => {
    setAmount('');
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
            <h2 className="text-xl font-semibold text-white">Withdraw Tokens</h2>
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
                {/* Available Balance */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Available Balance:</span>
                    <span className="text-lg font-semibold text-white">
                      {parseFloat(maxAmount).toFixed(6)} IRN
                    </span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      max={maxAmount}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setAmount(maxAmount)}
                      className="absolute right-3 top-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Withdrawal Status */}
                {!userMetrics?.canWithdraw && (
                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-1">Withdrawal Restricted</p>
                        <p>You can withdraw in {Math.ceil((userMetrics?.withdrawalTimeLeft || 0) / 60)} minutes due to the withdrawal discipline period.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Withdraw Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={loading || !amount || parseFloat(amount) <= 0 || !userMetrics?.canWithdraw}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Withdraw</span>
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


export { WithdrawModal };
export default WithdrawModal;