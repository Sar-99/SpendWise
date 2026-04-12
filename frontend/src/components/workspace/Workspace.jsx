import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Header from './Header';
import StatsBar from './StatsBar';
import TransactionHistory from './TransactionHistory';
import ActiveTasks from './ActiveTasks';
import TransactionModal from './modals/TransactionModal';
import api from '../../services/api';

const Workspace = () => {
  const { user } = useAuth();
  const socket = useSocket();

  const [profile, setProfile] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [iterationsMap, setIterationsMap] = useState({});
  const [stats, setStats] = useState({
    balance: 0,
    total_income: 0,
    total_expense: 0,
    income_count: 0,
    expense_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('currentProfile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (err) {
        console.error('Ошибка парсинга профиля:', err);
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!profile) return;
    try {
      const [txData, tasksData] = await Promise.all([
        api.getTransactions(profile.id),
        api.getActiveTasks(profile.id),
      ]);
      const txs = Array.isArray(txData) ? txData : [];
      const tasks = tasksData || [];
      const active = tasks.filter(t => t.status === 'active');
      setTransactions(txs);
      setActiveTasks(active);

      const iterationsPromises = tasks.map(task => api.getIterations(task.id).catch(() => []));
      const iterationsResults = await Promise.all(iterationsPromises);
      const newIterationsMap = {};
      tasks.forEach((task, index) => {
        newIterationsMap[task.id] = iterationsResults[index] || [];
      });
      setIterationsMap(newIterationsMap);

      // Статистика: транзакции + накопленные суммы активных задач
      let totalIncome = 0, totalExpense = 0, incomeCount = 0, expenseCount = 0;
      txs.forEach(tx => {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
          incomeCount++;
        } else {
          totalExpense += tx.amount;
          expenseCount++;
        }
      });
      active.forEach(task => {
        const acc = task.accumulated_amount || 0;
        if (task.type === 'income') totalIncome += acc;
        else totalExpense += acc;
      });
      setStats({
        balance: totalIncome - totalExpense,
        total_income: totalIncome,
        total_expense: totalExpense,
        income_count: incomeCount,
        expense_count: expenseCount,
      });
    } catch (err) {
      console.error('Ошибка при обновлении данных:', err);
      setError(err.message);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const fetchInitial = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    fetchInitial();
    pollingIntervalRef.current = setInterval(refreshData, 5000);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [profile, refreshData]);

  useEffect(() => {
    if (!socket || !profile) return;

    const handleIterationCreated = ({ task, iteration }) => {
      setActiveTasks(prev => prev.map(t => t.id === task.id ? task : t));
      setIterationsMap(prev => ({
        ...prev,
        [task.id]: [...(prev[task.id] || []), iteration].sort((a, b) => a.iteration_number - b.iteration_number)
      }));
      setTimeout(refreshData, 100);
    };

    const handleTaskCompleted = ({ task, transaction }) => {
      setActiveTasks(prev => prev.filter(t => t.id !== task.id));
      setTransactions(prev => [transaction, ...prev]);
      setIterationsMap(prev => {
        const newMap = { ...prev };
        delete newMap[task.id];
        return newMap;
      });
      setTimeout(refreshData, 100);
    };

    const handleIterationUpdated = ({ taskId, iterationId, amount, description, totalAmount }) => {
      setIterationsMap(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || []).map(it => it.id === iterationId ? { ...it, amount, description } : it)
      }));
      if (totalAmount !== undefined) {
        setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, accumulated_amount: totalAmount } : t));
      }
      setTimeout(refreshData, 100);
    };

    const handleIterationDeleted = ({ taskId, iterationId, totalAmount }) => {
      setIterationsMap(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter(it => it.id !== iterationId)
      }));
      if (totalAmount !== undefined) {
        setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, accumulated_amount: totalAmount } : t));
      }
      setTimeout(refreshData, 100);
    };

    const handleTaskUpdated = (updatedTask) => {
      setActiveTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      setTransactions(prev => prev.map(tx =>
        tx.interval_task_id === updatedTask.id ? { ...tx, description: updatedTask.description } : tx
      ));
    };

    const handleTaskDeleted = ({ taskId }) => {
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setTransactions(prev => prev.filter(tx => tx.interval_task_id !== taskId));
      setIterationsMap(prev => {
        const newMap = { ...prev };
        delete newMap[taskId];
        return newMap;
      });
      setTimeout(refreshData, 100);
    };

    socket.on('iteration:created', handleIterationCreated);
    socket.on('task:completed', handleTaskCompleted);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('iteration:updated', handleIterationUpdated);
    socket.on('iteration:deleted', handleIterationDeleted);
    socket.emit('subscribe', profile.id);
    return () => {
      socket.off('iteration:created', handleIterationCreated);
      socket.off('task:completed', handleTaskCompleted);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('iteration:updated', handleIterationUpdated);
      socket.off('iteration:deleted', handleIterationDeleted);
    };
  }, [socket, profile, refreshData]);

  const handleTransactionSuccess = async (data) => {
    try {
      const finalDescription = data.description?.trim() || '';
      if (data.intervalSettings) {
        const newTask = await api.createActiveTask({
          profileId: profile.id,
          description: finalDescription,
          type: data.type,
          amount: data.amount,
          intervalValue: data.intervalSettings.intervalValue,
          intervalUnit: data.intervalSettings.intervalUnit,
          durationValue: data.intervalSettings.durationValue,
          durationUnit: data.intervalSettings.durationUnit,
        });
        setActiveTasks(prev => [newTask, ...prev]);
        setIterationsMap(prev => ({ ...prev, [newTask.id]: [] }));
      } else {
        const newTransaction = await api.createTransaction({
          profileId: profile.id,
          type: data.type,
          amount: data.amount,
          description: finalDescription,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 8),
        });
        setTransactions(prev => [newTransaction, ...prev]);
      }
      refreshData();
    } catch (err) {
      console.error('Ошибка создания:', err);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await api.deleteTransaction(transactionId);
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
      refreshData();
    } catch (err) {
      console.error('Ошибка удаления транзакции:', err);
    }
  };

  const handleUpdateTransaction = async (id, newDescription) => {
    try {
      await api.updateTransaction(id, { description: newDescription });
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, description: newDescription } : tx));
    } catch (err) {
      console.error('Ошибка обновления транзакции:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteActiveTask(taskId);
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setIterationsMap(prev => {
        const newMap = { ...prev };
        delete newMap[taskId];
        return newMap;
      });
      setTransactions(prev => prev.filter(tx => tx.interval_task_id !== taskId));
      refreshData();
    } catch (err) {
      console.error('Ошибка удаления задачи:', err);
    }
  };

  const handleEditTaskDescription = async (taskId, newDescription) => {
    try {
      await api.updateActiveTaskDescription(taskId, newDescription);
      setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, description: newDescription } : t));
      setTransactions(prev => prev.map(tx => tx.interval_task_id === taskId ? { ...tx, description: newDescription } : tx));
    } catch (err) {
      console.error('Ошибка обновления описания задачи:', err);
    }
  };

  const getTaskIterations = useCallback((taskId) => iterationsMap[taskId] || [], [iterationsMap]);

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary">Профиль не выбран</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header profile={profile} />
      <StatsBar profile={profile} stats={stats} onAddTransaction={() => setShowTransactionModal(true)} />
      <div className="flex flex-col md:flex-row h-[calc(100vh-160px)]">
        <div className="w-full md:w-[70%] border-b md:border-b-0 md:border-r border-border">
          <TransactionHistory
            profile={profile}
            transactions={transactions}
            loading={loading}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            getTaskIterations={getTaskIterations}
          />
        </div>
        <div className="w-full md:w-[30%]">
          <ActiveTasks
            profile={profile}
            activeTasks={activeTasks}
            onDeleteTask={handleDeleteTask}
            onEditTaskDescription={handleEditTaskDescription}
            getTaskIterations={getTaskIterations}
          />
        </div>
      </div>
      {showTransactionModal && (
        <TransactionModal
          profile={profile}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </div>
  );
};

export default Workspace;