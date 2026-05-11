import { addYears, subDays, isAfter, isBefore, startOfDay, differenceInDays, parseISO, format } from 'date-fns';

/**
 * Calculates the leave period for a given employee's TMT and a target date.
 * @param {string} tmt - The employee's joined date (YYYY-MM-DD).
 * @param {Date|string} targetDate - The date to check the period for.
 * @returns {{start: Date, end: Date, periodLabel: string}}
 */
export const getLeavePeriod = (tmt, targetDate = new Date()) => {
  if (!tmt) {
    return {
      start: new Date(0),
      end: new Date(0),
      label: 'TMT Belum Diatur',
      yearIndex: 0
    };
  }

  try {
    const parsedTmt = parseISO(tmt);
    if (isNaN(parsedTmt)) {
      return { start: new Date(0), end: new Date(0), label: 'TMT Tidak Valid', yearIndex: 0 };
    }

    const startDate = startOfDay(parsedTmt);
    const checkDate = startOfDay(new Date(targetDate));
    
    let periodStart = startDate;
    let yearCount = 0;

    while (!isBefore(checkDate, addYears(periodStart, 1))) {
      periodStart = addYears(periodStart, 1);
      yearCount++;
    }
    
    const periodEnd = subDays(addYears(periodStart, 1), 1);
    
    return {
      start: periodStart,
      end: periodEnd,
      label: `${format(periodStart, 'dd MMM yyyy')} - ${format(periodEnd, 'dd MMM yyyy')}`,
      yearIndex: yearCount + 1
    };
  } catch (error) {
    return {
      start: new Date(0),
      end: new Date(0),
      label: 'TMT Error',
      yearIndex: 0
    };
  }
};

/**
 * Calculates the duration of leave excluding weekends (optional - usually for formal leave).
 * @param {string} start - Start date.
 * @param {string} end - End date.
 * @returns {number}
 */
export const calculateDuration = (start, end) => {
  const s = parseISO(start);
  const e = parseISO(end);
  return differenceInDays(e, s) + 1; // Inclusive
};

/**
 * Helper to get all monthly columns for the recap
 */
export const getMonthlyColumns = () => {
  return [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
};
