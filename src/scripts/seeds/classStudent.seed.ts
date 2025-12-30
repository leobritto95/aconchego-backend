import prisma from '../../utils/prisma';
import { SeedClasses } from './classes.seed';

interface Student {
  id: string;
  email: string;
  name: string;
}

export async function seedClassStudents(
  students: Student[],
  classes: SeedClasses
): Promise<void> {
  console.log('👥 Seeding class students...');

  // Índice das classes (usado na distribuição abaixo):
  // 0: Asa Branca
  // 1: Balanço Carioca
  // 2: Pista Dourada
  // 3: Zumba Energia
  // 4: Salsa Tropical
  // 5: Valsa Clássica
  // 6: Samba Raiz
  // 7: Tango Argentino
  // 8: Forró Nordestino
  // 9: Gafieira Carioca
  // 10: Salão de Domingos
  // 11: Bolero Romântico
  // 12: Aula de Forró - Iniciantes
  const allClasses = classes;

  // Função auxiliar para matricular um aluno em classes específicas
  const enrollStudent = async (
    student: Student,
    classIndices: number[]
  ): Promise<void> => {
    const selectedClasses = classIndices.map((idx) => allClasses[idx]);
    await Promise.all(
      selectedClasses.map((classItem) =>
        prisma.classStudent.create({
          data: {
            classId: classItem.id,
            studentId: student.id,
          },
        })
      )
    );
    const classNames = selectedClasses.map((c) => c.name).join(', ');
    console.log(`✅ ${student.name} enrolled in ${classIndices.length} classes: ${classNames}`);
  };

  // Distribuição determinística: cada aluno tem classes específicas
  const studentEnrollments: number[][] = [
    // 2 alunos (7 classes)
    [0, 1, 2, 3, 4, 5, 6],           // Aluno 0: João da Silva
    [0, 1, 2, 3, 7, 8, 9],           // Aluno 1: Ana Carolina Ferreira
    
    // 5 alunos (5 classes)
    [1, 2, 4, 5, 8],                 // Aluno 2: Bruno Rodrigues
    [0, 3, 6, 9, 10],                // Aluno 3: Carla Mendes
    [1, 4, 7, 8, 11],                // Aluno 4: Daniel Alves
    [2, 5, 6, 10, 12],               // Aluno 5: Eduarda Souza
    [0, 3, 7, 9, 11],                // Aluno 6: Felipe Costa
    
    // 8 alunos (3 classes)
    [0, 4, 8],                       // Aluno 7: Gabriela Martins
    [1, 5, 9],                       // Aluno 8: Henrique Silva
    [2, 6, 10],                      // Aluno 9: Isabela Oliveira
    [3, 7, 11],                      // Aluno 10: Julio Pereira
    [0, 4, 12],                      // Aluno 11: Larissa Santos
    [1, 5, 8],                       // Aluno 12: Marcos Vinicius
    [2, 6, 9],                       // Aluno 13: Natália Rocha
    [3, 7, 10],                      // Aluno 14: Otávio Lima
    
    // 4 alunos (2 classes)
    [0, 8],                          // Aluno 15: Patricia Gomes
    [1, 9],                          // Aluno 16: Rafael Barbosa
    [2, 10],                         // Aluno 17: Sofia Araújo
    [3, 11],                         // Aluno 18: Thiago Nunes
    
    // 1 aluno sem matrícula (simular aluno novo)
    // Aluno 19: Vanessa Campos - sem matrícula
  ];

  // Matricular alunos conforme a distribuição
  for (let i = 0; i < students.length && i < studentEnrollments.length; i++) {
    if (studentEnrollments[i].length > 0) {
      await enrollStudent(students[i], studentEnrollments[i]);
    } else {
      console.log(`ℹ️  ${students[i].name} not enrolled (new student)`);
    }
  }

  console.log(`✅ Total students processed: ${students.length}`);
}
