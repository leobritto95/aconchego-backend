import prisma from '../../utils/prisma';
import { normalizeDate } from '../../utils/dateUtils';
import { SeedClasses } from './classes.seed';

interface ScheduleTime {
  startTime: string;
  endTime: string;
}

interface Enrollment {
  classId: string;
  studentId: string;
  createdAt: Date;
}

// Constantes para configuração de presença
const ATTENDANCE_CONFIG = {
  // Porcentagem de presença esperada (80%)
  PRESENCE_PERCENTAGE: 0.8,
  // Número de últimas aulas a serem excluídas do cálculo
  EXCLUDED_LAST_CLASSES: 2,
} as const;

/**
 * Calcula todos os dias letivos de uma classe até antes das últimas aulas
 */
function getClassDates(
  startDate: Date,
  endDate: Date | null,
  recurringDays: number[],
  scheduleTimes: Record<string, ScheduleTime>
): Date[] {
  const dates: Date[] = [];
  const now = normalizeDate(new Date());
  const classStart = normalizeDate(startDate);
  
  // Calcular até o final da classe ou até hoje (o que for menor)
  const limitDate = endDate 
    ? (endDate < now ? normalizeDate(endDate) : now)
    : now;

  const currentDate = new Date(classStart);
  
  // Calcular todos os dias letivos
  while (currentDate <= limitDate) {
    const dayOfWeek = currentDate.getDay();
    const dayKey = dayOfWeek.toString();
    
    if (recurringDays.includes(dayOfWeek) && scheduleTimes[dayKey]?.startTime) {
      dates.push(new Date(currentDate));
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Remover as últimas aulas conforme configurado
  return dates.slice(0, -ATTENDANCE_CONFIG.EXCLUDED_LAST_CLASSES);
}

/**
 * Gera presença ou falta de forma determinística
 * Distribuição: ~80% presença, ~20% falta
 */
function getAttendanceStatus(studentIndex: number, dateIndex: number): 'PRESENT' | 'ABSENT' {
  const hash = (studentIndex * 1000 + dateIndex * 17) % 10;
  const threshold = ATTENDANCE_CONFIG.PRESENCE_PERCENTAGE * 10;
  return hash < threshold ? 'PRESENT' : 'ABSENT';
}

export async function seedAttendance(
  enrollments: Enrollment[],
  classes: SeedClasses
): Promise<void> {
  console.log('📅 Seeding attendance...');

  // Criar um mapa de classes por ID para acesso rápido
  const classesMap = new Map(classes.map((c) => [c.id, c]));

  const allRecords: Array<{
    classId: string;
    studentId: string;
    date: Date;
    status: 'PRESENT' | 'ABSENT';
  }> = [];

  enrollments.forEach((enrollment, enrollmentIndex) => {
    const classItem = classesMap.get(enrollment.classId);
    if (!classItem) return;

    const enrollmentDate = normalizeDate(enrollment.createdAt);

    const classDates = getClassDates(
      classItem.startDate,
      classItem.endDate,
      classItem.recurringDays,
      classItem.scheduleTimes as unknown as Record<string, ScheduleTime>
    );

    // Filtrar apenas datas após a matrícula do aluno
    const relevantDates = classDates.filter((date) => {
      return normalizeDate(date) >= enrollmentDate;
    });

    relevantDates.forEach((date, dateIndex) => {
      allRecords.push({
        classId: enrollment.classId,
        studentId: enrollment.studentId,
        date: new Date(date),
        status: getAttendanceStatus(enrollmentIndex, dateIndex),
      });
    });
  });

  // Inserir registros em lote
  if (allRecords.length > 0) {
    await Promise.all(
      allRecords.map((record) =>
        prisma.attendance.create({ data: record })
      )
    );
  }

  console.log(`✅ Created ${allRecords.length} attendance records`);
}
