import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Calendar, Clock, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import api from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

const convertIntervalToMs = (value, unit) => {
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
    const durationMs = convertIntervalToMs(task.duration_value, task.duration_unit);
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

const TaskDetailsModal = ({ isOpen, onClose, taskId, profile }) => {
    const [task, setTask] = useState(null);
    const [iterations, setIterations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const socket = useSocket();

    const fetchData = useCallback(async (showSpinner = false) => {
        if (!taskId) return;
        if (showSpinner) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const taskData = await api.getActiveTaskById(taskId);
            setTask(taskData);
            const its = await api.getIterations(taskId);
            const sorted = its.sort((a, b) => b.iteration_number - a.iteration_number);
            setIterations(sorted);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError(err.message || 'Не удалось загрузить данные');
        } finally {
            if (showSpinner) setRefreshing(false);
            else setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        if (!socket || !taskId || !isOpen) return;

        const handleTaskCompleted = ({ task: completedTask }) => {
            if (completedTask.id !== taskId) return;
            onClose();
        };

        const handleIterationCreated = ({ task: updatedTask, iteration }) => {
            if (updatedTask.id !== taskId) return;
            setTask(prev => prev ? { ...prev, ...updatedTask } : updatedTask);
            setIterations(prev => [iteration, ...prev].sort((a, b) => b.iteration_number - a.iteration_number));
        };

        const handleIterationUpdated = ({ taskId: updatedTaskId, iterationId, amount, description, totalAmount }) => {
            if (updatedTaskId !== taskId) return;
            setIterations(prev => prev.map(it =>
                it.id === iterationId ? { ...it, amount, description } : it
            ));
            if (totalAmount !== undefined) {
                setTask(prev => prev ? { ...prev, accumulated_amount: totalAmount } : prev);
            }
        };

        const handleIterationDeleted = ({ taskId: deletedTaskId, iterationId, totalAmount }) => {
            if (deletedTaskId !== taskId) return;
            setIterations(prev => prev.filter(it => it.id !== iterationId));
            if (totalAmount !== undefined) {
                setTask(prev => prev ? { ...prev, accumulated_amount: totalAmount } : prev);
            }
        };

        const handleTaskUpdated = (updatedTask) => {
            if (updatedTask.id === taskId) {
                fetchData(true);
            }
        };

        socket.on('iteration:created', handleIterationCreated);
        socket.on('task:completed', handleTaskCompleted);
        socket.on('task:updated', handleTaskUpdated);
        socket.on('iteration:updated', handleIterationUpdated);
        socket.on('iteration:deleted', handleIterationDeleted);

        return () => {
            socket.off('iteration:created', handleIterationCreated);
            socket.off('task:completed', handleTaskCompleted);
            socket.off('task:updated', handleTaskUpdated);
            socket.off('iteration:updated', handleIterationUpdated);
            socket.off('iteration:deleted', handleIterationDeleted);
        };
    }, [socket, taskId, isOpen, onClose, fetchData]);

    useEffect(() => {
        if (isOpen && taskId) {
            fetchData(false);
        } else {
            setTask(null);
            setIterations([]);
            setError(null);
        }
    }, [isOpen, taskId, fetchData]);

    const handleRefresh = () => fetchData(true);

    if (!isOpen) return null;

    const createdDate = task?.created_at ? new Date(task.created_at.includes('Z') ? task.created_at : task.created_at + 'Z') : null;
    const completionDate = task ? getCompletionDate(task, createdDate) : null;
    const autoTaskTitle = task
        ? (task.status === 'completed'
            ? `Завершённая задача #${task.task_number}`
            : `Активная задача #${task.task_number}`)
        : '';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] animate-fade-in">
            <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium">Детали задачи</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className={`p-1 text-text-secondary hover:text-text-primary transition-colors ${refreshing ? 'animate-spin' : ''}`}
                            title="Обновить"
                            disabled={refreshing}
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-surface-light rounded">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {!loading && !error && task ? (
                    <div className="mb-6 p-4 bg-surface-light rounded-lg border border-border flex-shrink-0">
                        <div className="flex justify-between items-start mb-2">
                            <span
                                className={`px-2 py-1 rounded text-xs font-medium ${task.type === 'income'
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-red-500/20 text-red-500'
                                    }`}
                            >
                                {task.type === 'income' ? 'Доход' : 'Расход'}
                            </span>
                            <div className={`text-xl font-bold ${task.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {task.type === 'income' ? '+' : '-'}
                                {formatCurrency(task.accumulated_amount || 0, profile?.currency)}
                            </div>
                        </div>

                        <div className="font-medium text-sm">
                            {task.description && task.description.trim() !== ''
                                ? task.description
                                : autoTaskTitle}
                        </div>

                        <div className="flex items-center justify-between text-xs text-text-secondary mt-2 border-t border-border">
                            {createdDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{formatDate(createdDate)}</span>
                                    <Clock size={12} className="ml-1" />
                                    <span>{formatTime(createdDate)}</span>
                                </div>
                            )}
                            {completionDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{formatDate(completionDate)}</span>
                                    <Clock size={12} className="ml-1" />
                                    <span>{formatTime(completionDate)}</span>
                                </div>
                            )}
                            {!completionDate && <div />}
                        </div>
                    </div>
                ) : null}

                <div className="flex-1 overflow-y-auto relative">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
                        </div>
                    ) : error ? (
                        <p className="text-center text-red-400 py-8">{error}</p>
                    ) : task ? (
                        <>
                            {iterations.length === 0 ? (
                                <p className="text-center text-text-secondary py-8">Нет итераций</p>
                            ) : (
                                <div className="space-y-3">
                                    {iterations.map((it, index) => (
                                        <div
                                            key={it.id}
                                            className={`p-3 rounded-lg border border-border ${task.type === 'income' ? 'bg-green-500/5' : 'bg-red-500/5'
                                                } animate-fade-in`}
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="flex flex-col sm:flex-row justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-text-secondary">
                                                            Итерация #{it.iteration_number}
                                                        </span>
                                                        {it.description && it.description !== `Итерация #${it.iteration_number}` && (
                                                            <span className="text-xs text-text-secondary truncate max-w-[200px]">
                                                                {it.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            <span>{it.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            <span>{it.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center self-end sm:self-center">
                                                    <span
                                                        className={`text-sm font-medium whitespace-nowrap ${task.type === 'income' ? 'text-green-500' : 'text-red-500'
                                                            }`}
                                                    >
                                                        {task.type === 'income' ? '+' : '-'}
                                                        {formatCurrency(it.amount, profile?.currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-text-secondary py-8">Задача не найдена</p>
                    )}
                </div>

                <div className="flex-shrink-0 mt-4">
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

export default TaskDetailsModal;