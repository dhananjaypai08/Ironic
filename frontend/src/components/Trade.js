import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Shield, 
  Activity,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useReserveData } from '@/hooks/useReserveData';
import { useUserData } from '@/hooks/useUserData';
import { useContract } from '@/hooks/useContract';
import MetricCard from './MetricCard';
import DepositModal from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import ReserveChart from './ReserveChart';

const Trade = () => {
  const { reservePrice, priceHistory, loading: reserveLoading, reserveInfo } = useReserveData();
  const { userMetrics, isConnected } = useUserData();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState('buy');

  const tabs = [
    { id: 'buy', name: 'Buy', icon: TrendingUp },
    { id: 'sell', name: 'Sell', icon: TrendingDown },
  ];

  const QuickAction = ({ action, icon: Icon, color, onClick, disabled = false }) => (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        p-6 rounded-2xl border transition-all duration-200 flex flex-col items-center space-y-3
        ${disabled 
          ? 'bg-gray-800/30 border-gray-700 cursor-not-allowed opacity-50' 
          : `bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-${color}-500/50`
        }
      `}
    >
      <div className={`w-12 h-12 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      <span className="font-medium text-white">{action}</span>
    </motion.button>
  );

  const PriceMovement = () => {
    const currentPrice = parseFloat(reservePrice || 0);
    const previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2]?.price : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

    return (
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold text-white">
          ${currentPrice.toLocaleString()}
        </span>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-sm ${
          priceChange >= 0 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {priceChange >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trade</h1>
          <p className="text-gray-400">Buy and sell reserve-backed synthetic tokens</p>
        </div>

        {/* Price Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{reserveInfo.name}</h2>
                  <PriceMovement />
                  <p className="text-gray-400 text-sm mt-1">Real-time reserve price</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">24h Volume</div>
                  <div className="text-lg font-semibold">$2.4M</div>
                </div>
              </div>
              
              <ReserveChart data={priceHistory} loading={reserveLoading} />
            </div>
          </div>

          <div className="space-y-6">
            <MetricCard
              title="Current Price"
              value={reserveLoading ? "Loading..." : `$${parseFloat(reservePrice || 0).toLocaleString()}`}
              icon={<DollarSign className="w-6 h-6" />}
              color="green"
              subtitle="Live oracle feed"
            />
            <MetricCard
              title="Mint Ratio"
              value={reservePrice ? `1:${parseFloat(reservePrice).toFixed(2)}` : "1:0"}
              icon={<ArrowUpDown className="w-6 h-6" />}
              color="blue"
              subtitle="Token to IRN"
            />
            <MetricCard
              title="Oracle Status"
              value="Active"
              icon={<Activity className="w-6 h-6" />}
              color="green"
              subtitle="Chainlink verified"
            />
          </div>
        </div>

        {/* Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
              {/* Tabs */}
              <div className="border-b border-gray-800">
                <nav className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors
                        ${activeTab === tab.id
                          ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                          : 'text-gray-400 hover:text-gray-300'
                        }
                      `}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Trading Content */}
              <div className="p-6">
                {!isConnected ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-400">Connect your wallet to start trading</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeTab === 'buy' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Buy IRN Tokens</h3>
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Exchange Rate:</span>
                            <span className="text-white">1 CCIP-BnM = {parseFloat(reservePrice || 0).toFixed(2)} IRN</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Minimum Deposit:</span>
                            <span className="text-white">0.001 CCIP-BnM</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <QuickAction
                            action="Quick Deposit"
                            icon={TrendingUp}
                            color="green"
                            onClick={() => setShowDepositModal(true)}
                          />
                          <QuickAction
                            action="Deposit with Stop-Loss"
                            icon={Shield}
                            color="blue"
                            onClick={() => setShowDepositModal(true)}
                          />
                        </div>

                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Activity className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-200">
                              <p className="font-medium mb-1">Automated Risk Management</p>
                              <p>Enable stop-loss to automatically close positions when price thresholds are met using Chainlink Automation.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'sell' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Sell IRN Tokens</h3>
                        
                        {userMetrics && userMetrics.currentBalance > 0 ? (
                          <div>
                            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Your Balance:</span>
                                <span className="text-white">{parseFloat(userMetrics.currentBalance).toFixed(6)} IRN</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Withdrawal Status:</span>
                                <span className={userMetrics.canWithdraw ? 'text-green-400' : 'text-yellow-400'}>
                                  {userMetrics.canWithdraw ? 'Available' : 'Restricted'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <QuickAction
                                action="Withdraw Tokens"
                                icon={TrendingDown}
                                color="red"
                                onClick={() => setShowWithdrawModal(true)}
                                disabled={!userMetrics.canWithdraw}
                              />
                              <QuickAction
                                action="Cross-Chain Withdraw"
                                icon={ArrowUpDown}
                                color="purple"
                                onClick={() => setShowWithdrawModal(true)}
                                disabled={!userMetrics.canWithdraw}
                              />
                            </div>

                            {!userMetrics.canWithdraw && (
                              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-yellow-200">
                                    <p className="font-medium mb-1">Withdrawal Discipline Period</p>
                                    <p>You can withdraw in {Math.ceil((userMetrics.withdrawalTimeLeft || 0) / 60)} minutes. This enforced period helps maintain protocol stability.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                              <TrendingDown className="w-6 h-6 text-gray-600" />
                            </div>
                            <h4 className="font-semibold mb-2">No Tokens to Sell</h4>
                            <p className="text-gray-400 text-sm">Deposit tokens first to start trading</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Stats & Info */}
          <div className="space-y-6">
            {isConnected && userMetrics && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">Your Trading Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Balance:</span>
                    <span className="font-mono text-white">{parseFloat(userMetrics.currentBalance).toFixed(4)} IRN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Deposited:</span>
                    <span className="font-mono text-white">{parseFloat(userMetrics.totalDeposited).toFixed(4)} IRN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Active Positions:</span>
                    <span className="text-white">{userMetrics.activePositions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total P&L:</span>
                    <span className={`font-mono ${userMetrics.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {userMetrics.totalGain >= 0 ? '+' : ''}{userMetrics.totalGain.toFixed(4)} IRN
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Protocol Features */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Protocol Features</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white text-sm">Automated Stop-Loss</p>
                    <p className="text-gray-400 text-xs">Chainlink Automation monitors positions 24/7</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <ArrowUpDown className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white text-sm">Cross-Chain Withdrawals</p>
                    <p className="text-gray-400 text-xs">Withdraw on any supported blockchain</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Activity className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white text-sm">Proof of Reserves</p>
                    <p className="text-gray-400 text-xs">Transparent backing via oracle feeds</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white text-sm">Withdrawal Discipline</p>
                    <p className="text-gray-400 text-xs">1-hour cooldown period for stability</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Info */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Market Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Network:</span>
                  <span className="text-white text-sm">Avalanche Fuji</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Oracle Feed:</span>
                  <span className="text-white text-sm">BTC.b Reserves</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Update Frequency:</span>
                  <span className="text-white text-sm">30 seconds</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Decimals:</span>
                  <span className="text-white text-sm">18 (IRN), 8 (Reserve)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)}
        reservePrice={reservePrice}
      />
      <WithdrawModal 
        isOpen={showWithdrawModal} 
        onClose={() => setShowWithdrawModal(false)}
      />
    </div>
  );
};

export default Trade;