/**
 * Cores do calendário
 */

export const CALENDAR_COLORS = {
  // Classes/Aulas - Matriculado
  enrolled: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  // Classes/Aulas - Não matriculado
  notEnrolled: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  // Eventos únicos
  singleEvent: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
} as const;
