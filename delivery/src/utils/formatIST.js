// Utility: Format dates in IST (India Standard Time, UTC+5:30)
// Use these everywhere instead of default toLocaleString / toLocaleTimeString

const IST_LOCALE = 'en-IN';
const IST_TZ = { timeZone: 'Asia/Kolkata' };

/** e.g. "10:08 PM" */
export const formatTimeIST = (date) =>
  new Date(date).toLocaleTimeString(IST_LOCALE, {
    ...IST_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });

/** e.g. "3 Sep" */
export const formatDateShortIST = (date) =>
  new Date(date).toLocaleDateString(IST_LOCALE, {
    ...IST_TZ,
    month: 'short',
    day: 'numeric',
  });

/** e.g. "3 Sep, 10:08 PM" */
export const formatDateTimeIST = (date) =>
  new Date(date).toLocaleString(IST_LOCALE, {
    ...IST_TZ,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** e.g. "03 Sep 2026, 10:08 PM" — full timestamp */
export const formatFullIST = (date) =>
  new Date(date).toLocaleString(IST_LOCALE, {
    ...IST_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** e.g. "03 Sep 2026" — date only */
export const formatDateOnlyIST = (date) =>
  new Date(date).toLocaleDateString(IST_LOCALE, {
    ...IST_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
