import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { CHAIN_CONFIG } from '@/utils/constants';

const TransactionStatus = ({ status, txHash, onClose, onRetry }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-8 h-8 text-blue-400 animate-spin" />,
          title: 'Transaction Pending',
          message: 'Your transaction is being processed...',
          color: 'blue'
        };
      case 'confirmed':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-400" />,
          title: 'Transaction Confirmed',
          message: 'Your transaction has been successfully processed!',
          color: 'green'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-8 h-8 text-red-400" />,
          title: 'Transaction Failed',
          message: 'Your transaction failed. Please try again.',
          color: 'red'
        };
      default:
        return {
          icon: <Clock className="w-8 h-8 text-gray-400" />,
          title: 'Unknown Status',
          message: 'Transaction status unknown',
          color: 'gray'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        {statusConfig.icon}
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">{statusConfig.title}</h3>
      <p className="text-gray-400 mb-6">{statusConfig.message}</p>
      
      {txHash && (
        <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Transaction Hash:</span>
            <a
              href={`${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <span className="font-mono">{txHash.slice(0, 8)}...{txHash.slice(-8)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
      
      <div className="flex space-x-3">
        {status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
        <button
          onClick={onClose}
          className={`
            flex-1 py-2 px-4 rounded-lg transition-colors
            ${status === 'confirmed' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
            }
          `}
        >
          {status === 'confirmed' ? 'Done' : 'Close'}
        </button>
      </div>
    </div>
  );
};

export { TransactionStatus };
export default TransactionStatus;