import 'dotenv/config';
import prisma from '../utils/prisma';
import { clearDatabase } from './seeds/clear.seed';
import { seedUsers } from './seeds/users.seed';
import { seedClasses } from './seeds/classes.seed';
import { seedClassStudents } from './seeds/classStudent.seed';
import { seedAttendance } from './seeds/attendance.seed';
import { seedEvents } from './seeds/events.seed';
import { seedNews } from './seeds/news.seed';
import { seedFeedback } from './seeds/feedback.seed';

async function main() {
  console.log('🌱 Seeding database...\n');

  // Limpar dados existentes
  await clearDatabase();
  console.log('');

  // Criar usuários
  const users = await seedUsers();

  // Criar classes (depende de teachers)
  const classes = await seedClasses(users.teachers);

  // Matricular alunos em classes
  const enrollments = await seedClassStudents(users.students, classes);

  // Criar presenças dos alunos
  await seedAttendance(enrollments, classes);

  // Criar eventos
  await seedEvents();

  // Criar notícias
  await seedNews();

  // Criar feedbacks
  await seedFeedback(users.students[0].id, classes);

  console.log('✨ Seeding completed!');
  console.log('\n📝 Credenciais de login:');
  console.log('   Admin: admin@aconchego.com / 123456');
  console.log('   Aluno: aluno@aconchego.com / 123456');
  console.log('   Professor 1: professor@aconchego.com / 123456');
  console.log('   Professor 2: professor2@aconchego.com / 123456');
  console.log('   Professor 3: professor3@aconchego.com / 123456');
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
