export const formatCurrency = (amount, currency = 'RUB') => {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return formatter.format(amount);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} ${getRussianNoun(diffMins, ['минуту', 'минуты', 'минут'])} назад`;
    }

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (e) {
    return '';
  }
};

const getRussianNoun = (number, words) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
};

export const getCurrencySymbol = (currency = 'RUB') => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'RUB': '₽',
    'KZT': '₸'
  };
  return symbols[currency] || currency;
};

/**
 * Форматирует количество секунд в строку вида ДД:ЧЧ:ММ:СС (опуская незначащие части)
 * @param {number} seconds - количество секунд (может быть 0 или отрицательное)
 * @returns {string}
 */
export const formatTimeInterval = (seconds) => {
  if (seconds <= 0) return '0 сек';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}д ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  if (minutes > 0) {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs} сек`;
};

/**
 * Форматирует миллисекунды в тот же формат (для обратного отсчёта)
 * @param {number} ms - количество миллисекунд
 * @returns {string}
 */
export const formatTimeLeftMs = (ms) => {
  if (ms <= 0) return '0 сек';
  const seconds = Math.floor(ms / 1000);
  return formatTimeInterval(seconds);
};