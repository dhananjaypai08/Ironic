"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe,
  ChevronRight,
  Activity,
  DollarSign,
  Wallet,
  Brain
} from 'lucide-react';
import { useReserveData } from '@/hooks/useReserveData';
import { useUserData } from '@/hooks/useUserData';
import MetricCard from './MetricCard';
import ReserveChart from './ReserveChart';
import AIAnalytics from './AIAnalytics';
import DepositModal from './DepositModal';
import { WithdrawModal } from './WithdrawModal';

const Dashboard = () => {
  const { 
    reservePrice, 
    priceHistory = [], 
    loading: reserveLoading, 
    reserveInfo = { name: 'BTC.b Proof of Reserves' } 
  } = useReserveData() || {};
  
  const { 
    userMetrics, 
    portfolio,
    positions,
    isConnected = false, 
    address,
    loading: userLoading = false 
  } = useUserData() || {};
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Safe parsing functions
  const safeParseFloat = (value, fallback = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  };

  const formatPrice = (price) => {
    const numPrice = safeParseFloat(price);
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-black"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div variants={itemVariants} className="text-center mb-16">
            {/* Live Indicator */}
            <div className="inline-flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-green-400 text-sm font-medium">Live on Avalanche Fuji Testnet</span>
              <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse"></div>
            </div>
            
            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-6">
              Ironic Protocol
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Cross-chain reserve-bound synthetic minting with enforced withdrawal discipline.
            </p>
            
            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center bg-gray-800/30 backdrop-blur-sm rounded-lg px-4 py-2">
                <Shield className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-sm">Chainlink Automation</span>
              </div>
              <div className="flex items-center bg-gray-800/30 backdrop-blur-sm rounded-lg px-4 py-2">
                <Globe className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-sm">CCIP Cross-Chain</span>
              </div>
              <div className="flex items-center bg-gray-800/30 backdrop-blur-sm rounded-lg px-4 py-2">
                <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-sm">Proof of Reserves</span>
              </div>
              <div className="flex items-center bg-gray-800/30 backdrop-blur-sm rounded-lg px-4 py-2">
                <Brain className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-sm">AI Analytics</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowDepositModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Deposit into Reserve Pool
                <ChevronRight className="w-5 h-5 inline ml-2" />
              </button>
              {isConnected && (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 border border-gray-600 hover:border-gray-500"
                >
                  Withdraw Tokens
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* AI Analytics Section - Show only for connected users */}
        {isConnected && (
          <motion.div variants={itemVariants} className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">AI-Powered Insights</h2>
              <p className="text-gray-400">Real-time portfolio analysis and optimization recommendations</p>
            </div>
            
            <AIAnalytics
              userAddress={address}
              portfolio={portfolio}
              positions={positions}
              reserveData={{ reservePrice, priceHistory }}
              userMetrics={userMetrics}
              analysisType="portfolio"
              autoRefresh={true}
              className="max-w-4xl mx-auto"
            />
          </motion.div>
        )}

        {/* Reserve Price Section */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Live Reserve Data</h2>
            <p className="text-gray-400">Real-time proof of reserves powered by Chainlink oracles</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reserve Chart */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      {reserveInfo?.name || 'BTC.b Proof of Reserves'}
                    </h3>
                    <p className="text-gray-400 text-sm">8 decimal precision</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400">
                      {reserveLoading ? (
                        <div className="animate-pulse bg-gray-700 h-8 w-24 rounded"></div>
                      ) : (
                        `$${formatPrice(reservePrice)}`
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">Current Price</p>
                  </div>
                </div>
                
                <ReserveChart data={priceHistory} loading={reserveLoading} />
              </div>
            </div>

            {/* Metric Cards */}
            <div className="space-y-6">
              <MetricCard
                title="Reserve Status"
                value="Active"
                icon={<Activity className="w-6 h-6" />}
                color="green"
                subtitle="Chainlink verified"
              />
              <MetricCard
                title="Conversion Rate"
                value={reservePrice ? `1:${safeParseFloat(reservePrice).toFixed(2)}` : "Loading..."}
                icon={<TrendingUp className="w-6 h-6" />}
                color="blue"
                subtitle="Deposit to IRN ratio"
              />
              <MetricCard
                title="Network"
                value="Avalanche Fuji"
                icon={<Globe className="w-6 h-6" />}
                color="purple"
                subtitle="Testnet environment"
              />
            </div>
          </div>
        </motion.div>

        {/* User Metrics */}
        {isConnected && userMetrics && (
          <motion.div variants={itemVariants} className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Your Portfolio Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Balance"
                value={`${safeParseFloat(userMetrics.currentBalance).toFixed(4)} IRN`}
                icon={<Wallet className="w-6 h-6" />}
                color="green"
                subtitle="Current holdings"
              />
              <MetricCard
                title="Total Deposited"
                value={`${safeParseFloat(userMetrics.totalDeposited).toFixed(4)} IRN`}
                icon={<DollarSign className="w-6 h-6" />}
                color="blue"
                subtitle="Lifetime deposits"
              />
              <MetricCard
                title="Active Positions"
                value={userMetrics.activePositions?.toString() || '0'}
                icon={<Activity className="w-6 h-6" />}
                color="purple"
                subtitle="With stop-loss"
              />
              <MetricCard
                title="Total Gain/Loss"
                value={`${userMetrics.totalGain >= 0 ? '+' : ''}${safeParseFloat(userMetrics.totalGain).toFixed(4)} IRN`}
                icon={<TrendingUp className="w-6 h-6" />}
                color={userMetrics.totalGain >= 0 ? "green" : "red"}
                subtitle={`${safeParseFloat(userMetrics.gainPercentage).toFixed(2)}% return`}
              />
            </div>
          </motion.div>
        )}

        {/* Features Section */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Protocol Features</h2>
            <p className="text-gray-400">Built on cutting-edge blockchain infrastructure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Automated Risk Management */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Automated Risk Management</h3>
              <p className="text-gray-400 mb-4">
                Chainlink Automation monitors your positions 24/7, executing stop-loss orders when thresholds are met.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Real-time price monitoring</li>
                <li>• Automatic position closure</li>
                <li>• Gas-efficient execution</li>
              </ul>
            </div>

            {/* Cross-Chain Withdrawals */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Cross-Chain Withdrawals</h3>
              <p className="text-gray-400 mb-4">
                Withdraw your tokens on any supported blockchain using Chainlink CCIP cross-chain infrastructure.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Multi-chain support</li>
                <li>• Secure message passing</li>
                <li>• Unified liquidity</li>
              </ul>
            </div>

            {/* Proof of Reserves */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-yellow-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Proof of Reserves</h3>
              <p className="text-gray-400 mb-4">
                All tokens are backed by verifiable reserves using Chainlink Proof of Reserve feeds for transparency.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Real-time verification</li>
                <li>• Transparent backing</li>
                <li>• Oracle-secured data</li>
              </ul>
            </div>

            {/* AI Analytics */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Analytics</h3>
              <p className="text-gray-400 mb-4">
                Get intelligent insights and recommendations powered by advanced AI to optimize your DeFi strategy.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Portfolio optimization</li>
                <li>• Risk assessment</li>
                <li>• Automated recommendations</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Call to Action for Non-Connected Users */}
        {!isConnected && (
          <motion.div variants={itemVariants} className="text-center">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 border border-gray-700">
              <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                Connect your wallet to start minting reserve-backed synthetic tokens with automated risk management and AI-powered insights.
              </p>
              <div className="text-sm text-gray-500">
                Make sure you're connected to Avalanche Fuji Testnet
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal 
          isOpen={showDepositModal} 
          onClose={() => setShowDepositModal(false)}
          reservePrice={reservePrice}
        />
      )}
      
      {showWithdrawModal && (
        <WithdrawModal 
          isOpen={showWithdrawModal} 
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;