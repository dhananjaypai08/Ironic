// src/components/Navbar.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ConnectKitButton } from 'connectkit';
import { 
  Menu, 
  X, 
  Home, 
  Wallet, 
  TrendingUp, 
  Shield,
  ExternalLink,
  Activity
} from 'lucide-react';
import { useReserveData } from '@/hooks/useReserveData';
import { useUserData } from '@/hooks/useUserData';

const Navbar = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { reservePrice, loading: reserveLoading } = useReserveData();
  const { isConnected, userMetrics } = useUserData();

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: Home },
    { name: 'Portfolio', id: 'portfolio', icon: Wallet },
    { name: 'Trade', id: 'trade', icon: TrendingUp },
  ];

  const NavLink = ({ item, mobile = false }) => (
    <button
      onClick={() => {
        setActiveTab(item.id);
        if (mobile) setMobileMenuOpen(false);
      }}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
        ${activeTab === item.id 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-300 hover:text-white hover:bg-gray-800'
        }
        ${mobile ? 'w-full justify-start' : ''}
      `}
    >
      <item.icon className="w-4 h-4" />
      <span className={mobile ? 'text-base' : 'text-sm font-medium'}>{item.name}</span>
    </button>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Ironic
                </span>
              </div>
              
              {/* Live indicator */}
              <div className="hidden sm:flex items-center bg-gray-800/50 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-green-400 font-medium">LIVE</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                {navigation.map((item) => (
                  <NavLink key={item.id} item={item} />
                ))}
              </div>

              {/* Reserve Price Display */}
              <div className="flex items-center bg-gray-800/50 rounded-lg px-3 py-2">
                <Activity className="w-4 h-4 text-blue-400 mr-2" />
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {reserveLoading ? (
                      <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
                    ) : (
                      `$${parseFloat(reservePrice || 0).toLocaleString()}`
                    )}
                  </div>
                  <div className="text-xs text-gray-400">BTC.b Reserve</div>
                </div>
              </div>

              {/* User Balance (if connected) */}
              {isConnected && userMetrics && (
                <div className="flex items-center bg-gray-800/50 rounded-lg px-3 py-2">
                  <Wallet className="w-4 h-4 text-purple-400 mr-2" />
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {parseFloat(userMetrics.currentBalance).toFixed(2)} IRN
                    </div>
                    <div className="text-xs text-gray-400">Your Balance</div>
                  </div>
                </div>
              )}

              {/* Connect Wallet Button */}
              <ConnectKitButton.Custom>
                {({ isConnected, show, address, ensName }) => (
                  <button
                    onClick={show}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${isConnected 
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }
                    `}
                  >
                    {isConnected 
                      ? `${ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}`
                      : 'Connect Wallet'
                    }
                  </button>
                )}
              </ConnectKitButton.Custom>

              {/* External Links */}
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-700">
                <a
                  href="https://testnet.snowscan.xyz/address/0x90005A6914750Ff5ecA78d60983Dc6bbbbb32CAC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Avalanche Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Navigation Links */}
              <div className="space-y-2">
                {navigation.map((item) => (
                  <NavLink key={item.id} item={item} mobile />
                ))}
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 text-blue-400 mr-2" />
                    <span className="text-sm text-gray-300">Reserve Price</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {reserveLoading ? 'Loading...' : `$${parseFloat(reservePrice || 0).toLocaleString()}`}
                  </span>
                </div>

                {isConnected && userMetrics && (
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 text-purple-400 mr-2" />
                      <span className="text-sm text-gray-300">Your Balance</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {parseFloat(userMetrics.currentBalance).toFixed(2)} IRN
                    </span>
                  </div>
                )}
              </div>

              {/* Connect Button */}
              <div className="pt-2">
                <ConnectKitButton.Custom>
                  {({ isConnected, show, address, ensName }) => (
                    <button
                      onClick={show}
                      className={`
                        w-full px-4 py-3 rounded-lg font-medium transition-all duration-200
                        ${isConnected 
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }
                      `}
                    >
                      {isConnected 
                        ? `Connected: ${ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}`
                        : 'Connect Wallet'
                      }
                    </button>
                  )}
                </ConnectKitButton.Custom>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </>
  );
};

export default Navbar;