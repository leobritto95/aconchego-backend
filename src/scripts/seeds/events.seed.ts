import prisma from '../../utils/prisma';

export async function seedEvents(): Promise<void> {
  console.log('📅 Seeding events...');

  // Workshop de Samba na próxima terça-feira das 12h às 14h (horário livre)
  const nextTuesday = new Date();
  const currentDay = nextTuesday.getDay(); // 0 = domingo, 2 = terça
  let daysToAdd = 2 - currentDay; // Diferença até terça
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Se já passou terça, pegar a próxima semana
  }
  nextTuesday.setDate(nextTuesday.getDate() + daysToAdd);
  nextTuesday.setHours(12, 0, 0, 0); // 12:00

  const event1End = new Date(nextTuesday);
  event1End.setHours(14, 0, 0, 0); // Termina às 14:00 (2 horas)

  const event1 = await prisma.event.create({
    data: {
      title: 'Workshop de Samba',
      description: 'Workshop especial de samba para todos os níveis - evento único',
      start: nextTuesday,
      end: event1End,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
    },
  });
  console.log('✅ Event created:', event1.title);

  // Workshop de Forró no próximo domingo das 12h às 14h
  const nextSunday = new Date();
  const currentDay2 = nextSunday.getDay(); // 0 = domingo
  let daysToAdd2 = 0 - currentDay2; // Diferença até domingo
  if (daysToAdd2 <= 0) {
    daysToAdd2 += 7; // Se já passou domingo, pegar a próxima semana
  }
  nextSunday.setDate(nextSunday.getDate() + daysToAdd2);
  nextSunday.setHours(12, 0, 0, 0); // 12:00

  const event2End = new Date(nextSunday);
  event2End.setHours(14, 0, 0, 0); // Termina às 14:00 (2 horas)

  const event2 = await prisma.event.create({
    data: {
      title: 'Workshop de Forró',
      description: 'Workshop intensivo de forró com foco em giros e passos básicos',
      start: nextSunday,
      end: event2End,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
    },
  });
  console.log('✅ Event created:', event2.title);

  // Workshop de Tango no próximo sábado das 12h às 14h
  const nextSaturday = new Date();
  const currentDay3 = nextSaturday.getDay(); // 6 = sábado
  let daysToAdd3 = 6 - currentDay3; // Diferença até sábado
  if (daysToAdd3 <= 0) {
    daysToAdd3 += 7; // Se já passou sábado, pegar a próxima semana
  }
  nextSaturday.setDate(nextSaturday.getDate() + daysToAdd3);
  nextSaturday.setHours(12, 0, 0, 0); // 12:00

  const event3End = new Date(nextSaturday);
  event3End.setHours(14, 0, 0, 0); // Termina às 14:00 (2 horas)

  const event3 = await prisma.event.create({
    data: {
      title: 'Workshop de Tango Argentino',
      description: 'Workshop de tango argentino com técnicas avançadas de conexão e postura',
      start: nextSaturday,
      end: event3End,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
    },
  });
  console.log('✅ Event created:', event3.title);
}

