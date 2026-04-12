import React from 'react';
import { X, Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const TransactionDetailsModal = ({ isOpen, onClose, transaction, profile }) => {
    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] animate-fade-in">
            <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-medium">Детали транзакции</h3>
                    <button onClick={onClose} className="text-text-disabled hover:text-text-primary">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className={`p-4 rounded-lg ${transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${transaction.type === 'income'
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-red-500/20 text-red-500'
                                }`}>
                                {transaction.type === 'income' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {transaction.type === 'income' ? 'Доход' : 'Расход'}
                            </span>
                            <span className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(transaction.amount, profile?.currency)}
                            </span>
                        </div>

                        <div className="text-sm font-medium mb-3">
                            {transaction.description || 'Без описания'}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{transaction.date || ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{transaction.time || ''}</span>
                            </div>
                        </div>

                        {transaction.note && (
                            <div className="mt-3 text-xs text-text-secondary border-t border-border pt-2">
                                {transaction.note}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-surface text-text-primary rounded-lg hover:bg-surface-light transition-colors"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailsModal;