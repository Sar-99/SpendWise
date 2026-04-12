import React, { useState, useEffect } from 'react';
import { Trash2, Clock, Info, Zap, Calendar, Edit2 } from 'lucide-react';
import { formatCurrency, formatTimeInterval } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';
import TaskDetailsModal from './modals/TaskDetailsModal';
import EditDescriptionModal from './modals/EditDescriptionModal';

const convertToMs = (value, unit) => {
  const n = Number(value);
  if (isNaN(n) || n <= 0) return 0;
  switch (unit) {
    case 'seconds': return n * 1000;
    case 'minutes': return n * 60 * 1000;
    case 'hours': return n * 60 * 60 * 1000;
    case 'days': return n * 24 * 60 * 60 * 1000;
    default: return n * 1000;
  }
};

const getCompletionDate = (task, createdDate) => {
  if (!createdDate) return null;
  if (task.status === 'completed' && task.completed_at) {
    return new Date(task.completed_at);
  }
  const start = createdDate.getTime();
  const durationMs = convertToMs(task.duration_value, task.duration_unit);
  if (durationMs <= 0) return null;
  return new Date(start + durationMs);
};

const formatDate = (date) => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatTime = (date) => {
  if (!date) return '';
  return date.toLocaleTimeString();
};

const TaskItem = ({ task, profile, onDelete, onShowDetails, onEditDescription }) => {
  const progress = task.total_iterations > 0
    ? ((task.completed_iterations || 0) / task.total_iterations) * 100
    : 0;

  const [timeUntilNext, setTimeUntilNext] = useState(0);

  const createdDate = task.created_at ? new Date(task.created_at.includes('Z') ? task.created_at : task.created_at + 'Z') : null;
  const completionDate = getCompletionDate(task, createdDate);

  useEffect(() => {
    if (!task.next_iteration_at || task.status !== 'active') {
      setTimeUntilNext(0);
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      const next = new Date(task.next_iteration_at).getTime();
      const diff = Math.max(0, Math.ceil((next - now) / 1000));
      setTimeUntilNext(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [task.next_iteration_at, task.status]);

  return (
    <div className="p-4 bg-surface-light rounded-lg border border-border mb-3 relative">
      <div className="flex justify-between items-start mb-2">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${task.type === 'income'
            ? 'bg-green-500/20 text-green-500'
            : 'bg-red-500/20 text-red-500'
            }`}
        >
          {task.type === 'income' ? 'Доход' : 'Расход'}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${task.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
            {task.type === 'income' ? '+' : '-'}
            {formatCurrency(task.accumulated_amount || 0, profile?.currency)}
          </span>
        </div>
      </div>

      <div className="font-medium text-sm mb-2">
        {task.description || 'Задача'}
      </div>

      <div className="flex justify-between items-center text-xs text-text-secondary mb-2">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>
            {task.type === 'income' ? '+' : '-'}
            {formatCurrency(task.amount, profile?.currency)} / итерацию
          </span>
        </div>
        {task.next_iteration_at && task.status === 'active' && (
          <span>через {formatTimeInterval(timeUntilNext)}</span>
        )}
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">Прогресс</span>
          <span>{task.completed_iterations || 0}/{task.total_iterations}</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-text-secondary mt-2 pt-2 border-t border-border">
        {createdDate && (
          <div className="flex items-center gap-1">
            <Calendar size={10} />
            <span>{formatDate(createdDate)}</span>
            <Clock size={10} />
            <span>{formatTime(createdDate)}</span>
          </div>
        )}
        {completionDate && (
          <>
            <div className="w-px h-4 bg-border-light mx-2" />
            <div className="flex items-center gap-1">
              <Calendar size={10} />
              <span>{formatDate(completionDate)}</span>
              <Clock size={10} />
              <span>{formatTime(completionDate)}</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onShowDetails(task.id)}
            className="text-text-disabled hover:text-accent hover:bg-accent/10 p-1 rounded transition-colors"
            title="Детали итераций"
          >
            <Info size={14} />
          </button>
          <button
            onClick={() => onEditDescription(task.id, task.description)}
            className="text-text-disabled hover:text-accent hover:bg-accent/10 p-1 rounded transition-colors"
            title="Редактировать описание"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(task.id, task.description)}
            className="text-text-disabled hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"
            title="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ActiveTasks = ({ profile, activeTasks = [], onDeleteTask, onEditTaskDescription, getTaskIterations }) => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null, taskName: '' });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, taskId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, taskId: null, currentDescription: '' });

  const handleDeleteClick = (taskId, taskName) => setDeleteModal({ isOpen: true, taskId, taskName });
  const confirmDelete = () => {
    if (deleteModal.taskId && onDeleteTask) onDeleteTask(deleteModal.taskId);
    setDeleteModal({ isOpen: false, taskId: null, taskName: '' });
  };
  const cancelDelete = () => setDeleteModal({ isOpen: false, taskId: null, taskName: '' });

  const handleShowDetails = (taskId) => setDetailsModal({ isOpen: true, taskId });
  const closeDetails = () => setDetailsModal({ isOpen: false, taskId: null });

  const handleEditDescription = (taskId, currentDescription) => {
    setEditModal({ isOpen: true, taskId, currentDescription });
  };
  const saveEdit = async (newDescription) => {
    if (editModal.taskId && onEditTaskDescription) {
      await onEditTaskDescription(editModal.taskId, newDescription);
      setEditModal({ isOpen: false, taskId: null, currentDescription: '' });
    }
  };
  const closeEdit = () => setEditModal({ isOpen: false, taskId: null, currentDescription: '' });

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-background">
        <h3 className="font-medium flex items-center gap-2">
          <Zap size={18} className="text-accent" />
          <span className="text-sm md:text-base">Активные задачи</span>
        </h3>
        <p className="text-xs text-text-secondary mt-1">{activeTasks.length} активных</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="p-4 bg-surface rounded-full mb-4">
              <Zap size={40} className="text-text-disabled" />
            </div>
            <p className="text-text-secondary text-sm mb-1">Нет активных задач</p>
            <p className="text-text-disabled text-xs">Создайте интервальную транзакцию</p>
          </div>
        ) : (
          activeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              profile={profile}
              onDelete={handleDeleteClick}
              onShowDetails={handleShowDetails}
              onEditDescription={handleEditDescription}
            />
          ))
        )}
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Удалить задачу"
        description={`Удалить "${deleteModal.taskName || 'эту задачу'}"? Все накопленные транзакции будут удалены.`}
        confirmText="Удалить"
      />
      <TaskDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={closeDetails}
        taskId={detailsModal.taskId}
        profile={profile}
      />
      <EditDescriptionModal
        isOpen={editModal.isOpen}
        onClose={closeEdit}
        onSave={saveEdit}
        currentDescription={editModal.currentDescription}
        title="Редактировать описание задачи"
      />
    </div>
  );
};

export default ActiveTasks;