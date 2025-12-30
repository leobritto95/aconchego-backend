import prisma from '../../utils/prisma';

export interface SeedClasses {
  classData: { id: string; name: string };
  recurringClass: { id: string; name: string };
  unenrolledClass: { id: string; name: string };
  newRecurringClass: { id: string; name: string };
  morningClasses: Array<{ id: string; name: string }>;
  afternoonClasses: Array<{ id: string; name: string }>;
}

interface Teacher {
  id: string;
  email: string;
  name: string;
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

  // ========== CLASS (única - mesma data de início e fim) ==========
  // Classe única que acontece na próxima quarta-feira (3)
  // Quarta: 12h-14h
  const nextWednesday = new Date();
  const currentDay = nextWednesday.getDay(); // 0 = domingo, 3 = quarta
  let daysToAdd = 3 - currentDay; // Diferença até quarta
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Se já passou quarta, pegar a próxima semana
  }
  nextWednesday.setDate(nextWednesday.getDate() + daysToAdd);
  nextWednesday.setHours(10, 0, 0, 0); // 10:00
  
  const singleClassDayOfWeek = 3; // Quarta-feira (fixo)

  const classData = await prisma.class.create({
    data: {
      name: 'Aula de Forró - Iniciantes',
      style: 'Forró',
      description: 'Turma de forró para iniciantes',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [singleClassDayOfWeek],
      scheduleTimes: {
        [singleClassDayOfWeek.toString()]: {
          startTime: '10:00',
          endTime: '12:00',
        },
      },
      startDate: nextWednesday,
      endDate: nextWednesday,
    },
  });
  console.log('✅ Single class created:', classData.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda terça e quinta (2, 4)
  // Terça: 18h-20h, Quinta: 18h-20h (horários iguais)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // 1 mês antes (aproximadamente 30 dias)
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90); // Termina em 90 dias

  const recurringClass = await prisma.class.create({
    data: {
      name: 'Asa Branca',
      style: 'Forró',
      description: 'Aula de forró toda terça (18h-20h) e quinta-feira (18h-20h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [2, 4], // Terça e Quinta (0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta...)
      scheduleTimes: {
        '2': { startTime: '18:00', endTime: '20:00' }, // Terça
        '4': { startTime: '18:00', endTime: '20:00' }, // Quinta
      },
      startDate: startDate,
      endDate: endDate,
    },
  });
  console.log('✅ Recurring class created:', recurringClass.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda segunda-feira (1)
  // Segunda: 18h-20h
  const unenrolledClassStartDate = new Date();
  unenrolledClassStartDate.setDate(unenrolledClassStartDate.getDate() - 30); // 1 mês antes (aproximadamente 30 dias)
  
  const unenrolledClassEndDate = new Date();
  unenrolledClassEndDate.setDate(unenrolledClassEndDate.getDate() + 90);

  const unenrolledClass = await prisma.class.create({
    data: {
      name: 'Balanço Carioca',
      style: 'Samba de Gafieira',
      description: 'Aula de samba de gafieira toda segunda-feira (18h-20h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [1], // Segunda-feira (0=domingo, 1=segunda...)
      scheduleTimes: {
        '1': { startTime: '18:00', endTime: '20:00' }, // Segunda
      },
      startDate: unenrolledClassStartDate,
      endDate: unenrolledClassEndDate,
    },
  });
  console.log('✅ Unenrolled class created:', unenrolledClass.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda sexta e sábado (5, 6)
  // Sexta: 20h-22h, Sábado: 16h-18h (horários diferentes)
  const newClassStartDate = new Date();
  newClassStartDate.setDate(newClassStartDate.getDate() - 30); // 1 mês antes (aproximadamente 30 dias)

  const newRecurringClass = await prisma.class.create({
    data: {
      name: 'Pista Dourada',
      style: 'Dança de Salão',
      description: 'Aula de dança de salão toda sexta-feira à noite (20h-22h) e sábado à tarde (16h-18h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [5, 6], // Sexta (5) e Sábado (6)
      scheduleTimes: {
        '5': { startTime: '20:00', endTime: '22:00' }, // Sexta à noite
        '6': { startTime: '16:00', endTime: '18:00' }, // Sábado à tarde
      },
      startDate: newClassStartDate,
      endDate: null,
    },
  });
  console.log('✅ New recurring class created:', newRecurringClass.name);

  // ========== CLASSES PELA MANHÃ ==========
  const morningClassStartDate = new Date();
  morningClassStartDate.setDate(morningClassStartDate.getDate() - 30);
  
  const morningClassEndDate = new Date();
  morningClassEndDate.setDate(morningClassEndDate.getDate() + 90);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda segunda e quarta (1, 3)
  // Segunda: 8h-10h, Quarta: 8h-10h (horários iguais)
  const morningClass1 = await prisma.class.create({
    data: {
      name: 'Zumba Energia',
      style: 'Zumba',
      description: 'Aula de zumba para começar bem o dia - Segunda e Quarta (8h-10h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [1, 3], // Segunda e Quarta
      scheduleTimes: {
        '1': { startTime: '08:00', endTime: '10:00' },
        '3': { startTime: '08:00', endTime: '10:00' },
      },
      startDate: morningClassStartDate,
      endDate: morningClassEndDate,
    },
  });
  console.log('✅ Morning class created:', morningClass1.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda terça e quinta (2, 4)
  // Terça: 10h-12h, Quinta: 10h-12h (horários iguais)
  const morningClass2 = await prisma.class.create({
    data: {
      name: 'Salsa Tropical',
      style: 'Salsa',
      description: 'Aula de salsa pela manhã - Terça e Quinta (10h-12h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [2, 4], // Terça e Quinta
      scheduleTimes: {
        '2': { startTime: '10:00', endTime: '12:00' },
        '4': { startTime: '10:00', endTime: '12:00' },
      },
      startDate: morningClassStartDate,
      endDate: morningClassEndDate,
    },
  });
  console.log('✅ Morning class created:', morningClass2.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda sexta-feira (5)
  // Sexta: 8h-10h
  const morningClass3 = await prisma.class.create({
    data: {
      name: 'Valsa Clássica',
      style: 'Valsa',
      description: 'Aula de valsa toda sexta-feira pela manhã (8h-10h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [5], // Sexta
      scheduleTimes: {
        '5': { startTime: '08:00', endTime: '10:00' },
      },
      startDate: morningClassStartDate,
      endDate: morningClassEndDate,
    },
  });
  console.log('✅ Morning class created:', morningClass3.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece todo sábado (6)
  // Sábado: 10h-12h
  const morningClass4 = await prisma.class.create({
    data: {
      name: 'Samba Raiz',
      style: 'Samba',
      description: 'Aula de samba aos sábados pela manhã (10h-12h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [6], // Sábado
      scheduleTimes: {
        '6': { startTime: '10:00', endTime: '12:00' },
      },
      startDate: morningClassStartDate,
      endDate: null,
    },
  });
  console.log('✅ Morning class created:', morningClass4.name);

  // ========== CLASSES À TARDE ==========
  const afternoonClassStartDate = new Date();
  afternoonClassStartDate.setDate(afternoonClassStartDate.getDate() - 30);
  
  const afternoonClassEndDate = new Date();
  afternoonClassEndDate.setDate(afternoonClassEndDate.getDate() + 90);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda segunda e quarta (1, 3)
  // Segunda: 14h-16h, Quarta: 14h-16h (horários iguais)
  const afternoonClass1 = await prisma.class.create({
    data: {
      name: 'Tango Argentino',
      style: 'Tango',
      description: 'Aula de tango à tarde - Segunda e Quarta (14h-16h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [1, 3], // Segunda e Quarta
      scheduleTimes: {
        '1': { startTime: '14:00', endTime: '16:00' },
        '3': { startTime: '14:00', endTime: '16:00' },
      },
      startDate: afternoonClassStartDate,
      endDate: afternoonClassEndDate,
    },
  });
  console.log('✅ Afternoon class created:', afternoonClass1.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda terça e quinta (2, 4)
  // Terça: 16h-18h, Quinta: 16h-18h (horários iguais)
  const afternoonClass2 = await prisma.class.create({
    data: {
      name: 'Forró Nordestino',
      style: 'Forró',
      description: 'Aula de forró à tarde - Terça e Quinta (16h-18h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [2, 4], // Terça e Quinta
      scheduleTimes: {
        '2': { startTime: '16:00', endTime: '18:00' },
        '4': { startTime: '16:00', endTime: '18:00' },
      },
      startDate: afternoonClassStartDate,
      endDate: afternoonClassEndDate,
    },
  });
  console.log('✅ Afternoon class created:', afternoonClass2.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda sexta-feira (5)
  // Sexta: 14h-16h
  const afternoonClass3 = await prisma.class.create({
    data: {
      name: 'Gafieira Carioca',
      style: 'Samba de Gafieira',
      description: 'Aula de samba de gafieira toda sexta à tarde (14h-16h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [5], // Sexta
      scheduleTimes: {
        '5': { startTime: '14:00', endTime: '16:00' },
      },
      startDate: afternoonClassStartDate,
      endDate: afternoonClassEndDate,
    },
  });
  console.log('✅ Afternoon class created:', afternoonClass3.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece todo domingo (0)
  // Domingo: 14h-16h
  const afternoonClass4 = await prisma.class.create({
    data: {
      name: 'Salão de Domingos',
      style: 'Dança de Salão',
      description: 'Aula de dança de salão aos domingos à tarde (14h-16h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [0], // Domingo
      scheduleTimes: {
        '0': { startTime: '14:00', endTime: '16:00' },
      },
      startDate: afternoonClassStartDate,
      endDate: null,
    },
  });
  console.log('✅ Afternoon class created:', afternoonClass4.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda quarta-feira (3)
  // Quarta: 16h-18h
  const afternoonClass5 = await prisma.class.create({
    data: {
      name: 'Bolero Romântico',
      style: 'Bolero',
      description: 'Aula de bolero às quartas à tarde (16h-18h)',
      teacherId: getNextTeacher(),
      active: true,
      recurringDays: [3], // Quarta
      scheduleTimes: {
        '3': { startTime: '16:00', endTime: '18:00' },
      },
      startDate: afternoonClassStartDate,
      endDate: afternoonClassEndDate,
    },
  });
  console.log('✅ Afternoon class created:', afternoonClass5.name);

  return {
    classData: { id: classData.id, name: classData.name },
    recurringClass: { id: recurringClass.id, name: recurringClass.name },
    unenrolledClass: { id: unenrolledClass.id, name: unenrolledClass.name },
    newRecurringClass: { id: newRecurringClass.id, name: newRecurringClass.name },
    morningClasses: [
      { id: morningClass1.id, name: morningClass1.name },
      { id: morningClass2.id, name: morningClass2.name },
      { id: morningClass3.id, name: morningClass3.name },
      { id: morningClass4.id, name: morningClass4.name },
    ],
    afternoonClasses: [
      { id: afternoonClass1.id, name: afternoonClass1.name },
      { id: afternoonClass2.id, name: afternoonClass2.name },
      { id: afternoonClass3.id, name: afternoonClass3.name },
      { id: afternoonClass4.id, name: afternoonClass4.name },
      { id: afternoonClass5.id, name: afternoonClass5.name },
    ],
  };
}

