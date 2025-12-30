import prisma from '../../utils/prisma';
import { normalizeDate } from '../../utils/dateUtils';

interface Teacher {
  id: string;
  email: string;
  name: string;
}

interface ScheduleTime {
  startTime: string;
  endTime: string;
}

export type SeedClasses = Array<{
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  recurringDays: number[];
  scheduleTimes: Record<string, ScheduleTime>;
}>;

// Constantes para configuração de datas das classes
const CLASS_DATE_CONFIG = {
  // Range de meses para startDate (6 meses atrás até 2 meses atrás)
  START_DATE_MONTHS_AGO: { min: 6, max: 2 },
  // Dias no futuro para endDate padrão
  DEFAULT_END_DATE_DAYS: 90,
} as const;

/**
 * Calcula a data de início de uma classe baseado no seu índice
 * Classes mais antigas têm índices menores
 */
function calculateStartDate(classIndex: number, totalClasses: number): Date {
  const now = new Date();
  const minDate = new Date(now);
  minDate.setMonth(now.getMonth() - CLASS_DATE_CONFIG.START_DATE_MONTHS_AGO.min);
  
  const maxDate = new Date(now);
  maxDate.setMonth(now.getMonth() - CLASS_DATE_CONFIG.START_DATE_MONTHS_AGO.max);
  
  // Distribuir uniformemente: classe 0 = mais antiga, última = mais recente
  const progress = totalClasses > 1 ? classIndex / (totalClasses - 1) : 0;
  const date = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) * progress);
  
  return normalizeDate(date);
}

/**
 * Calcula a data de fim padrão para classes
 */
function getDefaultEndDate(): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + CLASS_DATE_CONFIG.DEFAULT_END_DATE_DAYS);
  return normalizeDate(endDate);
}

export async function seedClasses(teachers: Teacher[]): Promise<SeedClasses> {
  console.log('📚 Seeding classes...');
  
  // Distribuir professores de forma rotativa
  let teacherIndex = 0;
  const getNextTeacher = () => {
    const teacher = teachers[teacherIndex % teachers.length];
    teacherIndex++;
    return teacher.id;
  };

  const defaultEndDate = getDefaultEndDate();

  // Array de configurações das classes
  const classesConfig = [
    {
      name: 'Asa Branca',
      style: 'Forró',
      description: 'Aula de forró toda terça (18h-20h) e quinta-feira (18h-20h)',
      recurringDays: [2, 4], // Terça e Quinta
      scheduleTimes: {
        '2': { startTime: '18:00', endTime: '20:00' },
        '4': { startTime: '18:00', endTime: '20:00' },
      },
      endDate: defaultEndDate,
    },
    {
      name: 'Balanço Carioca',
      style: 'Samba de Gafieira',
      description: 'Aula de samba de gafieira toda segunda-feira (18h-20h)',
      recurringDays: [1], // Segunda
      scheduleTimes: { '1': { startTime: '18:00', endTime: '20:00' } },
      endDate: defaultEndDate,
    },
    {
      name: 'Pista Dourada',
      style: 'Dança de Salão',
      description: 'Aula de dança de salão toda sexta-feira à noite (20h-22h) e sábado à tarde (16h-18h)',
      recurringDays: [5, 6], // Sexta e Sábado
      scheduleTimes: {
        '5': { startTime: '20:00', endTime: '22:00' },
        '6': { startTime: '16:00', endTime: '18:00' },
      },
      endDate: null,
    },
    {
      name: 'Zumba Energia',
      style: 'Zumba',
      description: 'Aula de zumba para começar bem o dia - Segunda e Quarta (8h-10h)',
      recurringDays: [1, 3], // Segunda e Quarta
      scheduleTimes: {
        '1': { startTime: '08:00', endTime: '10:00' },
        '3': { startTime: '08:00', endTime: '10:00' },
      },
      endDate: defaultEndDate,
    },
    {
      name: 'Salsa Tropical',
      style: 'Salsa',
      description: 'Aula de salsa pela manhã - Terça e Quinta (10h-12h)',
      recurringDays: [2, 4], // Terça e Quinta
      scheduleTimes: {
        '2': { startTime: '10:00', endTime: '12:00' },
        '4': { startTime: '10:00', endTime: '12:00' },
      },
      endDate: defaultEndDate,
    },
    {
      name: 'Valsa Clássica',
      style: 'Valsa',
      description: 'Aula de valsa toda sexta-feira pela manhã (8h-10h)',
      recurringDays: [5], // Sexta
      scheduleTimes: { '5': { startTime: '08:00', endTime: '10:00' } },
      endDate: defaultEndDate,
    },
    {
      name: 'Samba Raiz',
      style: 'Samba',
      description: 'Aula de samba aos sábados pela manhã (10h-12h)',
      recurringDays: [6], // Sábado
      scheduleTimes: { '6': { startTime: '10:00', endTime: '12:00' } },
      endDate: null,
    },
    {
      name: 'Tango Argentino',
      style: 'Tango',
      description: 'Aula de tango à tarde - Segunda e Quarta (14h-16h)',
      recurringDays: [1, 3], // Segunda e Quarta
      scheduleTimes: {
        '1': { startTime: '14:00', endTime: '16:00' },
        '3': { startTime: '14:00', endTime: '16:00' },
      },
      endDate: defaultEndDate,
    },
    {
      name: 'Forró Nordestino',
      style: 'Forró',
      description: 'Aula de forró à tarde - Terça e Quinta (16h-18h)',
      recurringDays: [2, 4], // Terça e Quinta
      scheduleTimes: {
        '2': { startTime: '16:00', endTime: '18:00' },
        '4': { startTime: '16:00', endTime: '18:00' },
      },
      endDate: defaultEndDate,
    },
    {
      name: 'Gafieira Carioca',
      style: 'Samba de Gafieira',
      description: 'Aula de samba de gafieira toda sexta à tarde (14h-16h)',
      recurringDays: [5], // Sexta
      scheduleTimes: { '5': { startTime: '14:00', endTime: '16:00' } },
      endDate: defaultEndDate,
    },
    {
      name: 'Salão de Domingos',
      style: 'Dança de Salão',
      description: 'Aula de dança de salão aos domingos à tarde (14h-16h)',
      recurringDays: [0], // Domingo
      scheduleTimes: { '0': { startTime: '14:00', endTime: '16:00' } },
      endDate: null,
    },
    {
      name: 'Bolero Romântico',
      style: 'Bolero',
      description: 'Aula de bolero às quartas à tarde (16h-18h)',
      recurringDays: [3], // Quarta
      scheduleTimes: { '3': { startTime: '16:00', endTime: '18:00' } },
      endDate: defaultEndDate,
    },
    {
      name: 'Aula de Forró - Iniciantes',
      style: 'Forró',
      description: 'Turma de forró para iniciantes',
      recurringDays: [3], // Quarta
      scheduleTimes: { '3': { startTime: '10:00', endTime: '12:00' } },
      isSingleClass: true, // Classe única: endDate = startDate
    },
  ];

  // Criar todas as classes
  const classData = await Promise.all(
    classesConfig.map(async (config, index) => {
      const startDate = calculateStartDate(index, classesConfig.length);
      let endDate: Date | null = null;
      
      if (config.isSingleClass) {
        // Classe única: endDate = startDate
        endDate = normalizeDate(new Date(startDate));
      } else if (config.endDate) {
        endDate = normalizeDate(new Date(config.endDate));
      }

      const created = await prisma.class.create({
        data: {
          name: config.name,
          style: config.style,
          description: config.description,
          teacherId: getNextTeacher(),
          active: true,
          recurringDays: config.recurringDays,
          scheduleTimes: config.scheduleTimes,
          startDate,
          endDate,
        },
      });

      console.log(`✅ Class created: ${created.name}`);
      
      return { 
        id: created.id, 
        name: created.name,
        startDate: created.startDate,
        endDate: created.endDate,
        recurringDays: created.recurringDays,
        scheduleTimes: created.scheduleTimes as unknown as Record<string, ScheduleTime>,
      } as SeedClasses[number];
    })
  );

  return classData;
}
