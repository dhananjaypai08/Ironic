"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Shield, 
  Activity,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Brain
} from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useReserveData } from '@/hooks/useReserveData';
import MetricCard from './MetricCard';
import PositionCard from './PositionCard';
import WithdrawModal from './WithdrawModal';
import AIAnalytics from './AIAnalytics';
import { CHAIN_CONFIG } from '@/utils/constants';

const Portfolio = () => {
  const { 
    portfolio, 
    positions, 
    ironBalance, 
    userMetrics, 
    loading, 
    error, 
    refetch, 
    isConnected,
    address 
  } = useUserData();
  
  const { reservePrice, reserveInfo, priceHistory } = useReserveData();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return 'Available now';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
            <p className="text-gray-400">Manage your Ironic Protocol positions</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <span>Address: {address?.slice(0, 8)}...{address?.slice(-6)}</span>
              <a
                href={`${CHAIN_CONFIG.explorerUrl}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <button
              onClick={refetch}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
              disabled={!userMetrics?.canWithdraw}
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">Error loading portfolio: {error}</span>
            </div>
          </div>
        )}

        {/* Portfolio Overview */}
        {userMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Balance"
              value={`${parseFloat(userMetrics.currentBalance).toFixed(4)} IRN`}
              icon={<Wallet className="w-6 h-6" />}
              color="blue"
              subtitle="Current holdings"
            />
            <MetricCard
              title="Total Deposited"
              value={`${parseFloat(userMetrics.totalDeposited).toFixed(4)} IRN`}
              icon={<DollarSign className="w-6 h-6" />}
              color="green"
              subtitle="Lifetime deposits"
            />
            <MetricCard
              title="Active Positions"
              value={userMetrics.activePositions.toString()}
              icon={<Activity className="w-6 h-6" />}
              color="purple"
              subtitle={`${userMetrics.closedPositions} closed`}
            />
          </div>
        )}

        {/* Withdrawal Status */}
        {portfolio && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Withdrawal Status</h3>
                <div className="flex items-center space-x-2">
                  {userMetrics?.canWithdraw ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">Available for withdrawal</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400">
                        Withdrawal available in {formatTimeLeft(userMetrics?.withdrawalTimeLeft || 0)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Next available:</p>
                <p className="text-sm text-white font-mono">
                  {formatTime(portfolio.allowedWithdrawalTimestamp)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', count: null },
                { id: 'ai-insights', name: 'AI Insights', count: null },
                { id: 'positions', name: 'Positions', count: positions.length },
                { id: 'reserves', name: 'Reserve Data', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.name}</span>
                  {tab.count !== null && (
                    <span className="bg-gray-700 text-gray-300 rounded-full px-2 py-1 text-xs">
                      {tab.count}
                    </span>
                  )}
                  {tab.id === 'ai-insights' && (
                    <Brain className="w-4 h-4" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolio Summary */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                  <h3 className="text-xl font-semibold mb-4">Portfolio Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Iron Token Balance:</span>
                      <span className="font-mono">{parseFloat(ironBalance).toFixed(6)} IRN</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Withdrawn:</span>
                      <span className="font-mono">
                        {portfolio ? parseFloat(portfolio.withdrawn).toFixed(6) : '0.000000'} IRN
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Token Deposited:</span>
                      <span className="font-mono text-sm">
                        {portfolio?.tokenDeposited || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                  <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!userMetrics?.canWithdraw}
                    >
                      Withdraw Tokens
                    </button>
                    <button
                      onClick={refetch}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      Refresh Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="space-y-8">
              {/* Risk Analysis */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Shield className="w-6 h-6 text-red-400 mr-2" />
                  Risk Analysis
                </h3>
                <AIAnalytics
                  userAddress={address}
                  portfolio={portfolio}
                  positions={positions}
                  reserveData={{ reservePrice, priceHistory }}
                  userMetrics={userMetrics}
                  analysisType="risk"
                  className="mb-6"
                />
              </div>

              {/* Position Analysis */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Activity className="w-6 h-6 text-purple-400 mr-2" />
                  Position Analysis
                </h3>
                <AIAnalytics
                  userAddress={address}
                  portfolio={portfolio}
                  positions={positions}
                  reserveData={{ reservePrice, priceHistory }}
                  userMetrics={userMetrics}
                  analysisType="positions"
                  className="mb-6"
                />
              </div>

              {/* Opportunities */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <TrendingUp className="w-6 h-6 text-green-400 mr-2" />
                  Optimization Opportunities
                </h3>
                <AIAnalytics
                  userAddress={address}
                  portfolio={portfolio}
                  positions={positions}
                  reserveData={{ reservePrice, priceHistory }}
                  userMetrics={userMetrics}
                  analysisType="opportunities"
                />
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div>
              {positions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Positions</h3>
                  <p className="text-gray-400">You haven't created any positions yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {positions.map((position, index) => (
                    <PositionCard
                      key={index}
                      position={position}
                      index={index}
                      reservePrice={reservePrice}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reserves' && (
            <div className="space-y-6">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <h3 className="text-xl font-semibold mb-4">Reserve Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Current Reserve Data</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reserve Name:</span>
                        <span>{reserveInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Symbol:</span>
                        <span>{reserveInfo.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Price:</span>
                        <span className="font-mono text-green-400">
                          ${parseFloat(reservePrice || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Decimals:</span>
                        <span>{reserveInfo.decimals}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Protocol Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Network:</span>
                        <span>Avalanche Fuji</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Oracle Provider:</span>
                        <span>Chainlink</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Updated:</span>
                        <span className="text-sm">
                          {new Date(reserveInfo.lastUpdated).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <WithdrawModal 
        isOpen={showWithdrawModal} 
        onClose={() => setShowWithdrawModal(false)}
      />
    </div>
  );
};

export default Portfolio;