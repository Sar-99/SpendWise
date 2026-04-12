import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Clock, DollarSign, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const TransactionModal = ({ profile, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    description: '',
    intervalValue: '',
    intervalUnit: 'seconds',
    durationValue: '',
    durationUnit: 'seconds',
  });
  const [errors, setErrors] = useState({});
  const [isTaskMode, setIsTaskMode] = useState(false); // режим задачи (интервальные настройки)
  const [intervalDetails, setIntervalDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const intervalInputRef = useRef(null);
  const durationInputRef = useRef(null);

  const timeUnits = [
    { value: 'seconds', label: 'сек' },
    { value: 'minutes', label: 'мин' },
    { value: 'hours', label: 'час' },
    { value: 'days', label: 'дн' },
  ];

  const convertToSeconds = useCallback((value, unit) => {
    const n = Number(value);
    if (isNaN(n) || n <= 0) return 0;
    switch (unit) {
      case 'seconds': return n;
      case 'minutes': return n * 60;
      case 'hours': return n * 60 * 60;
      case 'days': return n * 60 * 60 * 24;
      default: return n;
    }
  }, []);

  const changeTimeUnit = (currentUnit, direction) => {
    const currentIndex = timeUnits.findIndex(unit => unit.value === currentUnit);
    let newIndex = direction === 'next'
      ? (currentIndex === timeUnits.length - 1 ? 0 : currentIndex + 1)
      : (currentIndex === 0 ? timeUnits.length - 1 : currentIndex - 1);
    return timeUnits[newIndex].value;
  };

  // Обработчики клавиш для интервала
  const handleIntervalKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setForm(prev => ({
        ...prev,
        intervalUnit: changeTimeUnit(prev.intervalUnit, 'next')
      }));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setForm(prev => ({
        ...prev,
        intervalUnit: changeTimeUnit(prev.intervalUnit, 'prev')
      }));
    }
  }, []);

  // Обработчики клавиш для длительности
  const handleDurationKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setForm(prev => ({
        ...prev,
        durationUnit: changeTimeUnit(prev.durationUnit, 'next')
      }));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setForm(prev => ({
        ...prev,
        durationUnit: changeTimeUnit(prev.durationUnit, 'prev')
      }));
    }
  }, []);

  // Расчёт деталей интервала
  useEffect(() => {
    const { amount, intervalValue, intervalUnit, durationValue, durationUnit } = form;
    if (!isTaskMode || !intervalValue || !durationValue || !amount) {
      setIntervalDetails(null);
      return;
    }

    const intervalSeconds = convertToSeconds(intervalValue, intervalUnit);
    const durationSeconds = convertToSeconds(durationValue, durationUnit);

    if (intervalSeconds === 0 || durationSeconds === 0) {
      setIntervalDetails(null);
      return;
    }

    let count = Math.floor(durationSeconds / intervalSeconds);
    if (count < 1) count = 1;

    const total = count * Number(amount);

    setIntervalDetails({
      count,
      total,
      description: `Каждые ${intervalValue} ${intervalUnit} ${form.type === 'income' ? '+' : '-'}${formatCurrency(amount, profile?.currency)} в течение ${durationValue} ${durationUnit}`
    });
  }, [form, isTaskMode, profile?.currency, convertToSeconds]);

  // Переключение режима: сбрасываем интервальные поля при выходе из режима задачи
  const toggleTaskMode = () => {
    if (isTaskMode) {
      setForm(prev => ({
        ...prev,
        intervalValue: '',
        intervalUnit: 'seconds',
        durationValue: '',
        durationUnit: 'seconds',
      }));
      setIntervalDetails(null);
    }
    setIsTaskMode(!isTaskMode);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      newErrors.amount = 'Введите сумму';
    }
    if (isTaskMode) {
      if (!form.intervalValue || Number(form.intervalValue) <= 0) {
        newErrors.intervalValue = 'Введите интервал';
      }
      if (!form.durationValue || Number(form.durationValue) <= 0) {
        newErrors.durationValue = 'Введите длительность';
      }
      if (form.intervalValue && form.durationValue) {
        const intervalSeconds = convertToSeconds(form.intervalValue, form.intervalUnit);
        const durationSeconds = convertToSeconds(form.durationValue, form.durationUnit);
        if (durationSeconds < intervalSeconds) {
          newErrors.durationValue = 'Длительность должна быть больше интервала';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { type, amount, description, intervalValue, intervalUnit, durationValue, durationUnit } = form;
      const data = {
        type,
        amount: parseFloat(amount),
        description: description?.trim() || ''
      };
      if (isTaskMode && intervalValue && durationValue) {
        data.intervalSettings = {
          intervalValue: parseInt(intervalValue),
          intervalUnit,
          durationValue: parseInt(durationValue),
          durationUnit,
          iterations: intervalDetails?.count || 1
        };
      }
      onSuccess(data);
      onClose();
    } catch (err) {
      setErrors({ submit: err.message || 'Ошибка создания транзакции' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-medium">
            {isTaskMode ? 'Новая задача' : 'Новая транзакция'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTaskMode}
              className={`p-1.5 rounded transition-all duration-200 ${isTaskMode
                  ? 'text-accent bg-accent/10 hover:bg-accent/20'
                  : 'text-text-disabled hover:text-text-secondary hover:bg-surface-light'
                }`}
              title={isTaskMode ? 'Обычная транзакция' : 'Интервальная задача'}
            >
              <Zap size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-light rounded"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'expense' })}
                className={`flex-1 py-3 text-center transition-colors ${form.type === 'expense' ? 'bg-red-600 text-white' : 'bg-surface text-text-secondary hover:bg-surface-light'
                  }`}
                disabled={loading}
              >
                Расход
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'income' })}
                className={`flex-1 py-3 text-center transition-colors ${form.type === 'income' ? 'bg-green-600 text-white' : 'bg-surface text-text-secondary hover:bg-surface-light'
                  }`}
                disabled={loading}
              >
                Доход
              </button>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <DollarSign size={14} />
                <span>Сумма</span>
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className={`input ${errors.amount ? 'border-red-500' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                disabled={loading}
              />
              {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="label">Описание (необязательно)</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input"
                placeholder="Например: Покупка продуктов"
                disabled={loading}
              />
            </div>

            {isTaskMode && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="label">Интервал</label>
                  <div className="flex gap-2">
                    <input
                      ref={intervalInputRef}
                      type="number"
                      name="intervalValue"
                      value={form.intervalValue}
                      onChange={handleChange}
                      onKeyDown={handleIntervalKeyDown}
                      className={`input flex-1 ${errors.intervalValue ? 'border-red-500' : ''}`}
                      placeholder="10"
                      min="1"
                      disabled={loading}
                    />
                    <div className="flex border border-border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, intervalUnit: changeTimeUnit(prev.intervalUnit, 'prev') }))}
                        className="px-3 py-2 bg-surface-light hover:bg-surface-light/80 transition-colors border-r border-border"
                        disabled={loading}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="px-4 py-2 bg-surface flex items-center justify-center min-w-[80px]">
                        <span className="font-medium">{timeUnits.find(u => u.value === form.intervalUnit)?.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, intervalUnit: changeTimeUnit(prev.intervalUnit, 'next') }))}
                        className="px-3 py-2 bg-surface-light hover:bg-surface-light/80 transition-colors border-l border-border"
                        disabled={loading}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  {errors.intervalValue && <p className="text-red-400 text-sm mt-1">{errors.intervalValue}</p>}
                </div>

                <div>
                  <label className="label">Длительность</label>
                  <div className="flex gap-2">
                    <input
                      ref={durationInputRef}
                      type="number"
                      name="durationValue"
                      value={form.durationValue}
                      onChange={handleChange}
                      onKeyDown={handleDurationKeyDown}
                      className={`input flex-1 ${errors.durationValue ? 'border-red-500' : ''}`}
                      placeholder="60"
                      min="1"
                      disabled={loading}
                    />
                    <div className="flex border border-border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, durationUnit: changeTimeUnit(prev.durationUnit, 'prev') }))}
                        className="px-3 py-2 bg-surface-light hover:bg-surface-light/80 transition-colors border-r border-border"
                        disabled={loading}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="px-4 py-2 bg-surface flex items-center justify-center min-w-[80px]">
                        <span className="font-medium">{timeUnits.find(u => u.value === form.durationUnit)?.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, durationUnit: changeTimeUnit(prev.durationUnit, 'next') }))}
                        className="px-3 py-2 bg-surface-light hover:bg-surface-light/80 transition-colors border-l border-border"
                        disabled={loading}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  {errors.durationValue && <p className="text-red-400 text-sm mt-1">{errors.durationValue}</p>}
                </div>

                {intervalDetails && (
                  <div className="p-3 bg-surface-light rounded-lg border border-border">
                    <p className="text-sm text-text-secondary mb-2">{intervalDetails.description}</p>
                    <div className="flex justify-between text-sm">
                      <div><span className="text-text-secondary">Итераций: </span><span className="font-medium">{intervalDetails.count}</span></div>
                      <div><span className="text-text-secondary">Результат: </span><span className={`font-medium ${form.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{form.type === 'income' ? '+' : '-'}{formatCurrency(intervalDetails.total, profile?.currency)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-border">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${loading ? 'bg-surface-light text-text-disabled cursor-not-allowed' : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                  }`}
              >
                {loading ? 'Создание...' : (isTaskMode ? 'Создать задачу' : 'Создать транзакцию')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-surface text-text-primary rounded-lg hover:bg-surface-light transition-colors"
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;