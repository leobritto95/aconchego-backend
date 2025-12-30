import prisma from '../../utils/prisma';
import { SeedClasses } from './classes.seed';

export async function seedFeedback(
  studentId: string,
  classes: SeedClasses
): Promise<void> {
  console.log('💬 Seeding feedback...');

  await prisma.feedback.create({
    data: {
      studentId: studentId,
      classId: classes[0].id,
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
}

