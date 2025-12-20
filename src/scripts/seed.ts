import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // Limpar dados existentes (opcional - comente se quiser manter dados)
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classStudent.deleteMany();
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

  // ========== CLASS ==========
  const classData = await prisma.class.create({
      data: {
        name: 'Asa Branca',
        date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        style: 'Forró',
        description: 'Turma de forró para iniciantes',
        teacherId: teacher.id,
      },
    });
    console.log('✅ Class created:', classData.name);

  // ========== CLASS STUDENT ==========
  await prisma.classStudent.create({
    data: {
      classId: classData.id,
      studentId: student.id,
    },
  });
  console.log('✅ ClassStudent created');

  // ========== ATTENDANCE ==========  
  await prisma.attendance.create({
    data: {
      classId: classData.id,
      studentId: student.id,
      date: new Date(),
      status: 'PRESENT',
    },
  })
  console.log('✅ Attendance created');

  // ========== EVENT ==========
  const event = await prisma.event.create({
    data: {
      title: 'Aula de Forró',
      description: 'Aula prática de forró para todos os níveis',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 horas depois
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
    },
  })
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


