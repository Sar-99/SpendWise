import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const StatsBar = ({ profile, stats, onAddTransaction }) => {
  if (!stats) return null;
  
  const currency = profile?.currency || 'USD';
  
  return (
    <div className="px-6 py-4 border-b border-border bg-background">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Wallet size={20} className="text-accent" />
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">Баланс</div>
              <div className="text-xl font-bold">
                {formatCurrency(stats.balance, currency)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/10 rounded">
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <div>
              <div className="text-xs text-text-secondary">Доходы</div>
              <div className="text-sm font-medium text-green-500">
                {formatCurrency(stats.total_income, currency)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-500/10 rounded">
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <div>
              <div className="text-xs text-text-secondary">Расходы</div>
              <div className="text-sm font-medium text-red-500">
                {formatCurrency(stats.total_expense, currency)}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onAddTransaction}
          className="px-5 py-2.5 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] text-sm font-medium transition-colors"
        >
          Добавить транзакцию
        </button>
      </div>
    </div>
  );
};

export default StatsBar;