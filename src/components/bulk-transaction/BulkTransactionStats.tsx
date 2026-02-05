import React from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface BulkTransactionStatsProps {
  totalRecipients: number;
  totalTransactions: number;
  selectedCount: number;
}

const BulkTransactionStats: React.FC<BulkTransactionStatsProps> = ({
  totalRecipients,
  totalTransactions,
  selectedCount,
}) => {
  const stats = [
    {
      label: 'Total Recipients',
      value: totalRecipients,
      icon: UserGroupIcon,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Transactions',
      value: totalTransactions,
      icon: PaperAirplaneIcon,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      label: 'Selected Recipients',
      value: selectedCount,
      icon: CheckCircleIcon,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 ${stat.bgColor} rounded-lg`}>
              <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BulkTransactionStats;
