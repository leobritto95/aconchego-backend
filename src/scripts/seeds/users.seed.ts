import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma';

export interface SeedUsers {
  admin: { id: string; email: string };
  students: Array<{ id: string; email: string; name: string }>;
  teachers: Array<{ id: string; email: string; name: string }>;
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

  // Criar 20 alunos
  const studentNames = [
    'João da Silva',
    'Ana Carolina Ferreira',
    'Bruno Rodrigues',
    'Carla Mendes',
    'Daniel Alves',
    'Eduarda Souza',
    'Felipe Costa',
    'Gabriela Martins',
    'Henrique Silva',
    'Isabela Oliveira',
    'Julio Pereira',
    'Larissa Santos',
    'Marcos Vinicius',
    'Natália Rocha',
    'Otávio Lima',
    'Patricia Gomes',
    'Rafael Barbosa',
    'Sofia Araújo',
    'Thiago Nunes',
    'Vanessa Campos',
  ];

  const allStudents = await Promise.all(
    studentNames.map((name, index) =>
      prisma.user.create({
        data: {
          email: `aluno${index + 1}@aconchego.com`,
          password: hashedPassword,
          name,
          role: 'STUDENT',
        },
      })
    )
  );

  const students = allStudents.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
  }));

  console.log(`✅ Created ${students.length} students total`);

  // Criar 3 professores
  const teacherNames = [
    'Maria Santos',
    'Carlos Oliveira',
    'Ana Paula Lima',
  ];

  const allTeachers = await Promise.all(
    teacherNames.map((name, index) =>
      prisma.user.create({
        data: {
          email: `professor${index === 0 ? '' : index + 1}@aconchego.com`,
          password: hashedPassword,
          name,
          role: 'TEACHER',
        },
      })
    )
  );

  const teachers = allTeachers.map((t) => ({
    id: t.id,
    email: t.email,
    name: t.name,
  }));

  console.log(`✅ Created ${teachers.length} teachers total`);

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
    students,
    teachers,
    secretary: { id: secretary.id, email: secretary.email },
  };
}

