import prisma from '../../utils/prisma';

export async function clearDatabase(): Promise<void> {
  console.log('🧹 Clearing database...');

  // Limpar dados existentes
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.classException.deleteMany();
  await prisma.class.deleteMany();
  await prisma.news.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared');
}

