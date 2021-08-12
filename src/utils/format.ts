import moment from 'moment';

const DATE_FORMATS = {
  date: 'MMM D, YYYY',
  datetime: 'MMM D, YYYY h:mm A',
  time: 'h:mm A',
  timestamp: 'MM/DD/YYYY hh:mm:ss',
};

/**
 * Format a date object as a string
 * @param param0 Date to format and formatter type
 * @returns A formatted date string
 */
export function formatDate({
  date,
  formatter = 'date',
  fallback = '',
  utc,
}: {
  /**
   * Date to format
   */
  date: Date | number | string | null | undefined;
  /**
   * Should the date be shown in UTC time?
   *
   * @description Use to display non-relative dates, like birthdays
   */
  utc: boolean;
  /**
   * Formatting string to use
   *
   * Defaults to `date`
   */
  formatter?: keyof typeof DATE_FORMATS;
  /**
   * String to use when an invalid date is provided
   */
  fallback?: string;
}): string {
  if (!date) {
    return fallback;
  }
  try {
    if (utc) {
      return moment(date).utc().format(DATE_FORMATS[formatter]);
    }
    return moment(date).format(DATE_FORMATS[formatter]);
  } catch {
    return fallback;
  }
}
