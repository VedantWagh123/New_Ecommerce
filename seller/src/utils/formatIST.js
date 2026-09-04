// Utility: Format dates in IST (India Standard Time, UTC+5:30)

const IST_LOCALE = 'en-IN';
const IST_TZ = { timeZone: 'Asia/Kolkata' };

export const formatTimeIST = (date) =>
  new Date(date).toLocaleTimeString(IST_LOCALE, { ...IST_TZ, hour: '2-digit', minute: '2-digit' });

export const formatDateShortIST = (date) =>
  new Date(date).toLocaleDateString(IST_LOCALE, { ...IST_TZ, month: 'short', day: 'numeric' });

export const formatDateTimeIST = (date) =>
  new Date(date).toLocaleString(IST_LOCALE, { ...IST_TZ, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatFullIST = (date) =>
  new Date(date).toLocaleString(IST_LOCALE, { ...IST_TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatDateOnlyIST = (date) =>
  new Date(date).toLocaleDateString(IST_LOCALE, { ...IST_TZ, day: '2-digit', month: 'short', year: 'numeric' });
