// src/utils/dateHelpers.js
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
         parseISO, isValid, addDays, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

export const dateHelpers = {
  // Formattazione date italiane
  formatDate: (date) => {
    if (!date || !isValid(new Date(date))) return '';
    return format(new Date(date), 'dd/MM/yyyy', { locale: it });
  },

  formatDateTime: (date) => {
    if (!date || !isValid(new Date(date))) return '';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: it });
  },

  // Periodi per report
  getToday: () => ({
    start: new Date(),
    end: new Date()
  }),

  getYesterday: () => ({
    start: subDays(new Date(), 1),
    end: subDays(new Date(), 1)
  }),

  getCurrentWeek: () => ({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  }),

  getCurrentMonth: () => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  }),

  // Parsing sicuro
  parseDate: (dateString) => {
    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
};