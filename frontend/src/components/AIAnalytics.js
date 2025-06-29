import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  RefreshCw,
  Lightbulb,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';

const AIAnalytics = ({ 
  userAddress, 
  portfolio, 
  positions, 
  reserveData, 
  userMetrics,
  analysisType = 'portfolio',
  autoRefresh = false,
  className = ""
}) => {
  const { generateAnalysis, loading, error, lastAnalysis } = useAIAnalytics();
  const [analysis, setAnalysis] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Auto-generate analysis on mount or data change
  useEffect(() => {
    if (userAddress && (portfolio || positions?.length > 0)) {
      handleGenerateAnalysis();
    }
  }, [userAddress, portfolio, positions, reserveData, userMetrics, analysisType]);

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (userAddress && !loading) {
        handleGenerateAnalysis();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, userAddress, loading]);

  const handleGenerateAnalysis = async () => {
    try {
      const result = await generateAnalysis(
        analysisType,
        userAddress,
        portfolio,
        positions,
        reserveData,
        userMetrics
      );
      
      if (result) {
        setAnalysis(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to generate analysis:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'immediate':
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'low': return <Lightbulb className="w-4 h-4 text-blue-400" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'performance': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'risk': return <Shield className="w-4 h-4 text-red-400" />;
      case 'opportunity': return <Target className="w-4 h-4 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Lightbulb className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!userAddress) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 ${className}`}>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">AI Analytics</h3>
          <p className="text-gray-500">Connect your wallet to get AI-powered insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Analytics</h3>
              <p className="text-sm text-gray-400">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Real-time insights'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleGenerateAnalysis}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Analyzing your portfolio with AI...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
            >
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-400">Analysis Error: {error}</span>
              </div>
            </motion.div>
          )}

          {analysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Executive Summary */}
              <div className={`rounded-lg p-4 border ${getSeverityColor(analysis.executiveSummary?.severity)}`}>
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Executive Summary</h4>
                    <p className="text-sm opacity-90">{analysis.executiveSummary?.text}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs opacity-75">
                      <span>Confidence: {((analysis.executiveSummary?.confidence || 0) * 100).toFixed(0)}%</span>
                      <span>Severity: {analysis.executiveSummary?.severity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              {analysis.metrics && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Portfolio Metrics</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Health Score</div>
                      <div className={`text-lg font-bold ${getScoreColor(analysis.metrics.portfolioHealthScore)}`}>
                        {analysis.metrics.portfolioHealthScore || 'N/A'}
                        {analysis.metrics.portfolioHealthScore && '/100'}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Risk Score</div>
                      <div className={`text-lg font-bold ${getScoreColor(100 - (analysis.metrics.riskScore || 0))}`}>
                        {analysis.metrics.riskScore || 'N/A'}
                        {analysis.metrics.riskScore && '/100'}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">APY</div>
                      <div className="text-lg font-bold text-green-400">
                        {analysis.metrics.apy ? `${analysis.metrics.apy.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Automation</div>
                      <div className={`text-lg font-bold ${getScoreColor(analysis.metrics.automationUtilization)}`}>
                        {analysis.metrics.automationUtilization || 'N/A'}
                        {analysis.metrics.automationUtilization && '%'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {analysis.keyInsights?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Key Insights</h4>
                  <div className="space-y-3">
                    {analysis.keyInsights.slice(0, 3).map((insight, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-white">{insight.title}</h5>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                insight.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                                insight.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                'bg-blue-900/30 text-blue-400'
                              }`}>
                                {insight.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{insight.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Impact: {insight.impact}</span>
                              <span>Confidence: {((insight.confidence || 0) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {analysis.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          {getPriorityIcon(rec.priority)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-white">{rec.title}</h5>
                              <span className="text-xs text-gray-400">{rec.timeframe}</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Impact: {rec.expectedImpact}</span>
                              <span>Complexity: {rec.complexity}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerts */}
              {analysis.alerts?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Alerts</h4>
                  <div className="space-y-2">
                    {analysis.alerts.map((alert, index) => (
                      <div key={index} className={`rounded-lg p-3 border ${
                        alert.type === 'critical' ? 'bg-red-900/20 border-red-500/30 text-red-400' :
                        alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                        'bg-blue-900/20 border-blue-500/30 text-blue-400'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{alert.message}</span>
                          {alert.actionRequired && (
                            <span className="text-xs bg-gray-800 px-2 py-1 rounded">Action Required</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIAnalytics;