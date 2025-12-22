/**
 * Cores do calendário
 */

export const CALENDAR_COLORS = {
  // Classes/Aulas - Matriculado
  enrolled: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  // Classes/Aulas - Não matriculado (roxo claro)
  notEnrolled: {
    backgroundColor: '#c4b5fd',
    borderColor: '#a78bfa',
  },
  // Eventos únicos
  singleEvent: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
} as const;
