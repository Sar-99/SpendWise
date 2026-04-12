export const validateAmount = (amount) => {
  if (!amount || amount === '') return 'Сумма обязательна';
  if (isNaN(amount) || parseFloat(amount) <= 0) return 'Сумма должна быть положительным числом';
  if (parseFloat(amount) > 1000000000) return 'Сумма слишком большая';
  return null;
};

export const validateDate = (dateString) => {
  if (!dateString) return 'Дата обязательна';
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(date.getTime())) return 'Неверный формат даты';
  if (date > new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)) return 'Дата не может быть больше года вперед';
  return null;
};

export const validateInterval = (intervalValue, durationValue, intervalUnit, durationUnit) => {
  if (!intervalValue || intervalValue < 1) return 'Интервал должен быть не менее 1';
  if (!durationValue || durationValue < 1) return 'Длительность должна быть не менее 1';
  if (durationValue < intervalValue) return 'Длительность должна быть больше интервала';
  
  // Максимальное количество итераций - 1000
  const maxIterations = 1000;
  let iterations;
  
  // Приблизительный расчет итераций
  if (intervalUnit === durationUnit) {
    iterations = Math.floor(durationValue / intervalValue);
  } else {
    // Конвертируем все к дням для расчета
    const intervalInDays = convertToDays(intervalValue, intervalUnit);
    const durationInDays = convertToDays(durationValue, durationUnit);
    iterations = Math.floor(durationInDays / intervalInDays);
  }
  
  if (iterations > maxIterations) return `Слишком много итераций (максимум ${maxIterations})`;
  if (iterations < 1) return 'Длительность слишком мала для указанного интервала';
  
  return null;
};

const convertToDays = (value, unit) => {
  switch (unit) {
    case 'days': return value;
    case 'weeks': return value * 7;
    case 'months': return value * 30; // Приблизительно
    case 'years': return value * 365;
    default: return value;
  }
};

export const validateCategoryName = (name, existingCategories = []) => {
  if (!name || name.trim().length === 0) return 'Название категории обязательно';
  if (name.trim().length < 2) return 'Название должно быть не менее 2 символов';
  if (name.trim().length > 50) return 'Название должно быть не более 50 символов';
  
  // Проверка на уникальность (не учитывая регистр)
  const normalizedNewName = name.trim().toLowerCase();
  const isDuplicate = existingCategories.some(
    cat => cat.name.toLowerCase() === normalizedNewName
  );
  
  if (isDuplicate) return 'Категория с таким названием уже существует';
  
  return null;
};