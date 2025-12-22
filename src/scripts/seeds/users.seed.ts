import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma';

export interface SeedUsers {
  admin: { id: string; email: string };
  student: { id: string; email: string };
  teacher: { id: string; email: string };
  secretary: { id: string; email: string };
}

export async function seedUsers(): Promise<SeedUsers> {
  console.log('📝 Seeding users...');

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

  return {
    admin: { id: admin.id, email: admin.email },
    student: { id: student.id, email: student.email },
    teacher: { id: teacher.id, email: teacher.email },
    secretary: { id: secretary.id, email: secretary.email },
  };
}

