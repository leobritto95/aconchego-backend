import { CALENDAR_COLORS } from '../constants/calendarColors';

interface ScheduleTime {
  startTime: string;
  endTime: string;
}

interface RecurringClass {
  id: string;
  name: string;
  style?: string | null;
  description?: string | null;
  recurringDays: number[]; // [2, 3] = terça e quarta
  scheduleTimes: Record<string, ScheduleTime>; // { "2": { startTime: "19:00", endTime: "21:00" }, ... }
  startDate: Date;
  endDate: Date | null;
  backgroundColor?: string | null;
  borderColor?: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  description?: string;
  extendedProps?: {
    type: 'recurring-class' | 'single-event';
    classId?: string;
    isEnrolled?: boolean; // Se o aluno está matriculado (apenas para classes)
  };
}

/**
 * Busca o horário para um dia específico da semana
 * @param scheduleTimes - Objeto com horários por dia da semana
 * @param dayOfWeek - Dia da semana (0-6)
 * @returns Horário do dia ou null se não encontrado
 */
function getTimeForDay(
  scheduleTimes: Record<string, ScheduleTime>,
  dayOfWeek: number
): ScheduleTime | null {
  const daySchedule = scheduleTimes[dayOfWeek.toString()];
  if (daySchedule?.startTime && daySchedule?.endTime) {
    return daySchedule;
  }
  return null;
}

/**
 * Expande classes recorrentes em eventos individuais para um range de datas
 * @param classes - Array de classes recorrentes
 * @param exceptions - Array de datas canceladas (ClassException)
 * @param startDate - Data inicial do range
 * @param endDate - Data final do range
 * @param enrolledClassIds - Set de classIds que o aluno está matriculado (opcional)
 * @returns Array de eventos no formato do FullCalendar
 */
export function expandRecurringClasses(
  classes: RecurringClass[],
  exceptions: Array<{ classId: string; date: Date }>,
  startDate: Date,
  endDate: Date,
  enrolledClassIds?: Set<string>
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Criar um Set de exceções para busca rápida
  // Formato: "classId-YYYY-MM-DD"
  const exceptionsSet = new Set(
    exceptions.map((ex) => {
      const dateStr = ex.date.toISOString().split('T')[0];
      return `${ex.classId}-${dateStr}`;
    })
  );

  for (const classItem of classes) {
    // Validar se está no período de recorrência
    const classStart = new Date(classItem.startDate);
    const classEnd = classItem.endDate
      ? new Date(classItem.endDate)
      : null;

    // Ajustar datas de início e fim considerando a recorrência
    const actualStart = classStart > startDate ? classStart : startDate;
    const actualEnd = classEnd && classEnd < endDate ? classEnd : endDate;

    // Iterar por cada dia no range
    const currentDate = new Date(actualStart);
    currentDate.setHours(0, 0, 0, 0); // Normalizar para início do dia

    while (currentDate <= actualEnd) {
      const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1 = segunda, ...

      // Verificar se este dia da semana está na recorrência
      if (classItem.recurringDays.includes(dayOfWeek)) {
        // Verificar se não está cancelado (exceção)
        const dateKey = `${classItem.id}-${currentDate.toISOString().split('T')[0]}`;
        if (!exceptionsSet.has(dateKey)) {
          // Buscar horário para este dia específico
          const daySchedule = getTimeForDay(classItem.scheduleTimes, dayOfWeek);
          
          if (!daySchedule) {
            // Se não tem horário definido para este dia, pular
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Criar evento para este dia
          const [startHours, startMinutes] = daySchedule.startTime
            .split(':')
            .map(Number);
          const [endHours, endMinutes] = daySchedule.endTime.split(':').map(Number);

          const eventStart = new Date(currentDate);
          eventStart.setHours(startHours, startMinutes, 0, 0);

          const eventEnd = new Date(currentDate);
          eventEnd.setHours(endHours, endMinutes, 0, 0);

          // Verificar se o evento termina antes de começar (passou da meia-noite)
          if (eventEnd < eventStart) {
            eventEnd.setDate(eventEnd.getDate() + 1);
          }

          // Título pode incluir o estilo
          const title = classItem.style
            ? `${classItem.name} - ${classItem.style}`
            : classItem.name;

          // Verificar se o aluno está matriculado nesta classe
          const isEnrolled = enrolledClassIds
            ? enrolledClassIds.has(classItem.id)
            : false;

          // Cores diferentes baseadas na matrícula
          const backgroundColor = isEnrolled
            ? classItem.backgroundColor || CALENDAR_COLORS.enrolled.backgroundColor
            : CALENDAR_COLORS.notEnrolled.backgroundColor;
          const borderColor = isEnrolled
            ? classItem.borderColor || CALENDAR_COLORS.enrolled.borderColor
            : CALENDAR_COLORS.notEnrolled.borderColor;

          events.push({
            id: `class-${classItem.id}-${currentDate.toISOString().split('T')[0]}`,
            title,
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            backgroundColor,
            borderColor,
            description: classItem.description || undefined,
            extendedProps: {
              type: 'recurring-class',
              classId: classItem.id,
              isEnrolled, // Adicionar informação de matrícula
            },
          });
        }
      }

      // Próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return events;
}

/**
 * Valida se os dias da semana estão no formato correto
 * @param days - Array de números representando dias da semana (0-6)
 * @returns true se válido, false caso contrário
 */
export function validateRecurringDays(days: number[]): boolean {
  if (!Array.isArray(days) || days.length === 0) {
    return false;
  }

  // Validar que todos os valores estão entre 0-6
  return days.every(
    (day) => Number.isInteger(day) && day >= 0 && day <= 6
  );
}

/**
 * Valida formato de horário (HH:MM)
 * @param time - String no formato HH:MM
 * @returns true se válido, false caso contrário
 */
export function validateTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

/**
 * Valida estrutura de scheduleTimes
 * @param scheduleTimes - Objeto com horários por dia da semana
 * @param recurringDays - Dias da semana da classe
 * @returns true se válido, false caso contrário
 */
export function validateScheduleTimes(
  scheduleTimes: any,
  recurringDays: number[]
): boolean {
  if (!scheduleTimes || typeof scheduleTimes !== 'object') {
    return false;
  }

  // Verificar se todos os dias recorrentes têm horários definidos
  for (const day of recurringDays) {
    const daySchedule = scheduleTimes[day.toString()];
    if (
      !daySchedule ||
      typeof daySchedule !== 'object' ||
      !daySchedule.startTime ||
      !daySchedule.endTime ||
      !validateTimeFormat(daySchedule.startTime) ||
      !validateTimeFormat(daySchedule.endTime)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Formata um array de números de dias da semana em texto legível
 * @param days - Array de números (0-6)
 * @returns String formatada, ex: "Terça, Quarta"
 */
export function formatRecurringDays(days: number[]): string {
  const dayNames = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ];

  return days
    .sort((a, b) => a - b)
    .map((day) => dayNames[day])
    .join(', ');
}


