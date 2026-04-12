import React, { useState } from 'react';
import { Calendar, Clock, Trash2, TrendingUp, TrendingDown, Receipt, Info, Edit2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';
import TaskDetailsModal from './modals/TaskDetailsModal';
import TransactionDetailsModal from './modals/TransactionDetailsModal';
import EditDescriptionModal from './modals/EditDescriptionModal';

const formatDate = (dateString) => dateString || '';
const formatTime = (timeString) => timeString || '';

const TransactionHistory = ({
  profile,
  transactions = [],
  loading,
  onDeleteTransaction,
  onUpdateTransaction,
  getTaskIterations
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, taskId: null });
  const [detailsSimpleModal, setDetailsSimpleModal] = useState({ isOpen: false, transaction: null });
  const [editModal, setEditModal] = useState({ isOpen: false, transaction: null });

  const handleDeleteClick = (transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deletingTransaction && onDeleteTransaction) {
      try {
        await onDeleteTransaction(deletingTransaction.id);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      } finally {
        setShowDeleteModal(false);
        setDeletingTransaction(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingTransaction(null);
  };

  const handleShowDetails = (transaction) => {
    if (transaction.is_interval && transaction.interval_task_id) {
      setDetailsModal({ isOpen: true, taskId: transaction.interval_task_id });
    } else {
      setDetailsSimpleModal({ isOpen: true, transaction });
    }
  };

  const closeDetails = () => {
    setDetailsModal({ isOpen: false, taskId: null });
  };

  const closeSimpleDetails = () => {
    setDetailsSimpleModal({ isOpen: false, transaction: null });
  };

  const handleEditClick = (transaction) => {
    setEditModal({ isOpen: true, transaction });
  };

  const closeEdit = () => {
    setEditModal({ isOpen: false, transaction: null });
  };

  const saveEdit = async (newDescription) => {
    if (editModal.transaction && onUpdateTransaction) {
      await onUpdateTransaction(editModal.transaction.id, newDescription);
      closeEdit();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Receipt size={18} className="text-text-secondary" />
              История транзакций
            </h3>
            <p className="text-xs text-text-secondary mt-1">{transactions.length} записей</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="p-4 bg-surface rounded-full mb-4">
              <Receipt size={40} className="text-text-disabled" />
            </div>
            <p className="text-text-secondary text-sm mb-1">Нет транзакций</p>
            <p className="text-text-disabled text-xs">Создайте свою первую транзакцию</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-surface/50 transition-colors">
                <div className="flex justify-between items-center"> {/* items-start → items-center */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${transaction.type === 'income'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                          }`}
                      >
                        {transaction.type === 'income' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {transaction.is_interval ? 'Интервальная' : (transaction.type === 'income' ? 'Доход' : 'Расход')}
                      </span>

                      <span
                        className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                          }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount, profile?.currency)}
                      </span>
                    </div>

                    <div className="font-medium text-sm mb-4">
                      {transaction.description || 'Транзакция'}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatTime(transaction.time)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => handleEditClick(transaction)}
                      className="text-text-disabled hover:text-accent hover:bg-accent/10 p-1.5 rounded transition-colors"
                      title="Редактировать описание"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => handleShowDetails(transaction)}
                      className="text-text-disabled hover:text-accent hover:bg-accent/10 p-1.5 rounded transition-colors"
                      title="Подробнее"
                    >
                      <Info size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(transaction)}
                      className="text-text-disabled hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-colors"
                      title="Удалить транзакцию"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Удалить транзакцию"
        description={`Удалить "${deletingTransaction?.description || 'транзакцию'}"?`}
        confirmText="Удалить"
        iconColor="text-red-500"
      />

      <TaskDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={closeDetails}
        taskId={detailsModal.taskId}
        profile={profile}
        initialIterations={detailsModal.taskId ? getTaskIterations(detailsModal.taskId) : []}
      />

      <TransactionDetailsModal
        isOpen={detailsSimpleModal.isOpen}
        onClose={closeSimpleDetails}
        transaction={detailsSimpleModal.transaction}
        profile={profile}
      />

      <EditDescriptionModal
        isOpen={editModal.isOpen}
        onClose={closeEdit}
        onSave={saveEdit}
        currentDescription={editModal.transaction?.description || ''}
      />
    </div>
  );
};

export default TransactionHistory;