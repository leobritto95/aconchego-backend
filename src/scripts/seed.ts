import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // Limpar dados existentes (opcional - comente se quiser manter dados)
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.classException.deleteMany();
  await prisma.class.deleteMany();
  await prisma.news.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // ========== USERS ==========
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@aconchego.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user:', admin.email);

  const student = await prisma.user.create({
    data: {
      email: 'aluno@aconchego.com',
      password: hashedPassword,
      name: 'João da Silva',
      role: 'STUDENT',
    },
  });
  console.log('✅ Student user:', student.email);

  const teacher = await prisma.user.create({
    data: {
      email: 'professor@aconchego.com',
      password: hashedPassword,
      name: 'Maria Santos',
      role: 'TEACHER',
    },
  });
  console.log('✅ Teacher user:', teacher.email);

  const secretary = await prisma.user.create({
    data: {
      email: 'secretaria@aconchego.com',
      password: hashedPassword,
      name: 'Pedro Costa',
      role: 'SECRETARY',
    },
  });
  console.log('✅ Secretary user:', secretary.email);

  // ========== CLASS (única - mesma data de início e fim) ==========
  const singleClassDate = new Date();
  const singleClassDayOfWeek = singleClassDate.getDay(); // 0=domingo, 1=segunda, ...

  const classData = await prisma.class.create({
    data: {
      name: 'Asa Branca',
      style: 'Forró',
      description: 'Turma de forró para iniciantes',
      teacherId: teacher.id,
      active: true,
      recurringDays: [singleClassDayOfWeek], // Dia da semana da data específica
      scheduleTimes: {
        [singleClassDayOfWeek.toString()]: {
          startTime: '18:00',
          endTime: '20:00',
        },
      },
      startDate: singleClassDate, // Data da classe única
      endDate: singleClassDate, // Mesma data (classe única)
    },
  });
  console.log('✅ Single class created:', classData.name);

  // ========== CLASS RECORRENTE ==========
  // Classe que acontece toda terça e quinta (2, 4)
  // Terça: 19h-21h, Quinta: 20h-22h (horários diferentes por dia!)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Começa 7 dias atrás para ter exemplos no calendário
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90); // Termina em 90 dias

  const recurringClass = await prisma.class.create({
    data: {
      name: 'Aula de Forró - Avançado',
      style: 'Forró',
      description: 'Aula de forró toda terça (19h-21h) e quinta-feira (20h-22h)',
      teacherId: teacher.id,
      active: true,
      recurringDays: [2, 4], // Terça e Quinta (0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta...)
      scheduleTimes: {
        '2': { startTime: '19:00', endTime: '21:00' }, // Terça
        '4': { startTime: '20:00', endTime: '22:00' }, // Quinta (horário diferente)
      },
      startDate: startDate,
      endDate: endDate,
    },
  });
  console.log('✅ Recurring class created:', recurringClass.name);

  // ========== NOVA CLASSE (aluno não matriculado) ==========
  const unenrolledClassStartDate = new Date();
  unenrolledClassStartDate.setDate(unenrolledClassStartDate.getDate() - 7);
  
  const unenrolledClassEndDate = new Date();
  unenrolledClassEndDate.setDate(unenrolledClassEndDate.getDate() + 90);

  const unenrolledClass = await prisma.class.create({
    data: {
      name: 'Samba de Gafieira',
      style: 'Samba',
      description: 'Aula de samba de gafieira toda segunda-feira (18h-20h)',
      teacherId: teacher.id,
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

  // ========== CLASS STUDENT ==========
  await prisma.classStudent.create({
    data: {
      classId: classData.id,
      studentId: student.id,
    },
  });
  console.log('✅ ClassStudent created');

  // Matricular estudante na classe recorrente também
  await prisma.classStudent.create({
    data: {
      classId: recurringClass.id,
      studentId: student.id,
    },
  });
  console.log('✅ ClassStudent created for recurring class');

  // ========== ATTENDANCE ==========  
  await prisma.attendance.create({
    data: {
      classId: classData.id,
      studentId: student.id,
      date: new Date(),
      status: 'PRESENT',
    },
  });
  console.log('✅ Attendance created');

  // Criar presença para uma das aulas da classe recorrente (última terça-feira)
  const lastTuesday = new Date();
  lastTuesday.setDate(lastTuesday.getDate() - ((lastTuesday.getDay() + 5) % 7)); // Última terça
  lastTuesday.setHours(19, 0, 0, 0);
  
  if (lastTuesday <= new Date()) {
    await prisma.attendance.create({
      data: {
        classId: recurringClass.id,
        studentId: student.id,
        date: lastTuesday,
        status: 'PRESENT',
      },
    });
    console.log('✅ Attendance created for recurring class');
  }

  // ========== CLASS EXCEPTION (exemplo) ==========
  // Cancelar a próxima quinta-feira da classe recorrente
  const nextThursday = new Date();
  const currentDay = nextThursday.getDay(); // 0 = domingo, 4 = quinta
  let daysToAdd = 4 - currentDay; // Diferença até quinta
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Se já passou quinta, pegar a próxima semana
  }
  nextThursday.setDate(nextThursday.getDate() + daysToAdd);
  nextThursday.setHours(0, 0, 0, 0);

  // Só criar exceção se a data estiver dentro do período de recorrência
  if (nextThursday <= endDate && nextThursday >= startDate) {
    await prisma.classException.create({
      data: {
        classId: recurringClass.id,
        date: nextThursday,
        reason: 'Feriado - Classe cancelada',
      },
    });
    console.log('✅ ClassException created (next Thursday cancelled)');
  }

  // ========== EVENT (evento único) ==========
  const event = await prisma.event.create({
    data: {
      title: 'Workshop de Samba',
      description: 'Workshop especial de samba para todos os níveis - evento único',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 horas depois
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
    },
  });
  console.log('✅ Event created:', event.title);

  // ========== NEWS ==========
  const news = await prisma.news.create({
    data: {
      title: 'Bem-vindos ao Aconchego!',
      content: 'Estamos muito felizes em recebê-los em nossa plataforma. Aqui você pode acompanhar seus feedbacks, eventos e muito mais!',
      author: 'Equipe Aconchego',
      imageUrl: 'https://via.placeholder.com/800x400',
    },
  })
  console.log('✅ News created:', news.title);

  // ========== FEEDBACK ==========
  await prisma.feedback.create({
    data: {
      studentId: student.id,
      classId: classData.id,
      date: new Date(),
      average: 8.5,
      status: 'APPROVED',
      evaluatorFeedback: 'Ótimo desempenho na aula! Continue praticando.',
      parameters: {
        parameter1: { name: 'Ritmo', score: 8.0 },
        parameter2: { name: 'Postura', score: 9.0 },
        parameter3: { name: 'Expressão', score: 8.5 },
        parameter4: { name: 'Coordenação', score: 8.0 },
        parameter5: { name: 'Interpretação', score: 9.0 },
      },
    },
  });
  console.log('✅ Feedback created');

  console.log('\n✨ Seeding completed!');
  console.log('\n📝 Credenciais de login:');
  console.log('   Admin: admin@aconchego.com / 123456');
  console.log('   Aluno: aluno@aconchego.com / 123456');
  console.log('   Professor: professor@aconchego.com / 123456');
  console.log('   Secretaria: secretaria@aconchego.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


