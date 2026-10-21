import { MONTHS, WEEKDAYS } from '../i18n/strings';

// Date helpers that don't rely on Intl (so Hindi month names work on every Android version).

export const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "12 अक्टूबर 2026" / "12 Oct 2026" */
export const formatDate = (value, lang, { withYear = true } = {}) => {
  const date = toDate(value);
  if (!date) return '';
  const base = `${date.getDate()} ${MONTHS[lang][date.getMonth()]}`;
  return withYear ? `${base} ${date.getFullYear()}` : base;
};

/** "आज" / "कल" / "सोमवार, 12 अक्टूबर" */
export const formatDay = (value, lang, t) => {
  const date = toDate(value);
  if (!date) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return t.common.today;
  if (sameDay(date, yesterday)) return t.common.yesterday;
  return `${WEEKDAYS[lang][date.getDay()]}, ${formatDate(date, lang, { withYear: date.getFullYear() !== today.getFullYear() })}`;
};

/** Month heading for the history timeline: "अक्टूबर 2026". */
export const formatMonth = (value, lang) => {
  const date = toDate(value);
  if (!date) return '';
  const months = lang === 'en' ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] : MONTHS.hi;
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

/** Time from a Date or "HH:mm": "10:30 am". */
export const formatTime = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
    const [h, m] = value.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
  }
  const date = toDate(value);
  if (!date) return String(value);
  return formatTime(`${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
};

/** Milliseconds to "m:ss". */
export const formatDuration = (ms) => {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export const isPast = (value) => {
  const date = toDate(value);
  return date ? date.getTime() < Date.now() : false;
};
