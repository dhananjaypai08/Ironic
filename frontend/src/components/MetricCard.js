import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon, color = 'blue', subtitle, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  const bgColorClasses = {
    blue: 'bg-blue-500/20',
    green: 'bg-green-500/20',
    red: 'bg-red-500/20',
    purple: 'bg-purple-500/20',
    yellow: 'bg-yellow-500/20'
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${bgColorClasses[color]} flex items-center justify-center`}>
          <div className={iconColorClasses[color]}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`text-sm px-2 py-1 rounded-lg ${
            trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(2)}%
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        {subtitle && (
          <p className="text-gray-500 text-xs">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export { MetricCard };
export default MetricCard;