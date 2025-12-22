import prisma from '../../utils/prisma';
import { SeedClasses } from './classes.seed';

export async function seedClassStudents(
  studentId: string,
  classes: SeedClasses
): Promise<void> {
  console.log('👥 Seeding class students...');

  // Matricular estudante na classe única
  await prisma.classStudent.create({
    data: {
      classId: classes.classData.id,
      studentId: studentId,
    },
  });
  console.log('✅ ClassStudent created');

  // Matricular estudante na classe recorrente também
  await prisma.classStudent.create({
    data: {
      classId: classes.recurringClass.id,
      studentId: studentId,
    },
  });
  console.log('✅ ClassStudent created for recurring class');

  // Matricular estudante em algumas classes da manhã
  await prisma.classStudent.create({
    data: {
      classId: classes.morningClasses[0].id,
      studentId: studentId,
    },
  });
  console.log('✅ ClassStudent created for morning class 1');

  await prisma.classStudent.create({
    data: {
      classId: classes.morningClasses[1].id,
      studentId: studentId,
    },
  });
  console.log('✅ ClassStudent created for morning class 2');

  // Matricular estudante em algumas classes da tarde
  await prisma.classStudent.create({
    data: {
      classId: classes.afternoonClasses[0].id,
      studentId: studentId,
    },
  });
  console.log('✅ ClassStudent created for afternoon class 1');

  await prisma.classStudent.create({
    data: {
      classId: classes.afternoonClasses[1].id,
      studentId: studentId,
    },
  });
  console.log('✅ ClassStudent created for afternoon class 2');
}

