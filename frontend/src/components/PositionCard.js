import { CheckCircle, XCircle, Shield, TrendingDown } from 'lucide-react';

const PositionCard = ({ position, index, reservePrice }) => {
  const isNearStopLoss = position.isActive && reservePrice && 
    parseFloat(reservePrice) <= parseFloat(position.stopLossThreshold) * 1.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200
        ${position.isActive 
          ? (isNearStopLoss ? 'border-yellow-500/50' : 'border-green-500/50') 
          : 'border-gray-800'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${position.isActive 
              ? (isNearStopLoss ? 'bg-yellow-500/20' : 'bg-green-500/20') 
              : 'bg-gray-600/20'
            }
          `}>
            {position.isActive ? (
              <Shield className={`w-5 h-5 ${isNearStopLoss ? 'text-yellow-400' : 'text-green-400'}`} />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">Position #{index + 1}</h3>
            <p className="text-sm text-gray-400">{position.tokenDeposited}</p>
          </div>
        </div>
        
        <div className={`
          px-3 py-1 rounded-full text-xs font-medium
          ${position.isActive 
            ? (isNearStopLoss ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400')
            : 'bg-gray-600/20 text-gray-400'
          }
        `}>
          {position.isActive ? (isNearStopLoss ? 'At Risk' : 'Active') : 'Closed'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Amount:</span>
          <span className="font-mono text-white">{parseFloat(position.amount).toFixed(6)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Stop Loss:</span>
          <span className="font-mono text-white">${parseFloat(position.stopLossThreshold).toFixed(2)}</span>
        </div>

        {position.isActive && reservePrice && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Current Price:</span>
            <span className={`font-mono ${
              parseFloat(reservePrice) > parseFloat(position.stopLossThreshold) 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              ${parseFloat(reservePrice).toFixed(2)}
            </span>
          </div>
        )}

        {isNearStopLoss && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mt-4">
            <div className="flex items-start space-x-2">
              <TrendingDown className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium">Stop Loss Warning</p>
                <p>Price is approaching your stop loss threshold</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};


export { PositionCard };
export default PositionCard;