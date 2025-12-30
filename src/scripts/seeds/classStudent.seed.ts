import prisma from '../../utils/prisma';
import { SeedClasses } from './classes.seed';

interface Student {
  id: string;
  email: string;
  name: string;
}

interface Enrollment {
  classId: string;
  studentId: string;
  createdAt: Date;
}

// Constantes para configuração de matrículas
const ENROLLMENT_CONFIG = {
  // Porcentagem de alunos matriculados antes do startDate (40%)
  BEFORE_START_PERCENTAGE: 0.4,
  // Range de dias antes do startDate
  DAYS_BEFORE_START: { min: 1, max: 7 },
  // Range de dias depois do startDate
  DAYS_AFTER_START: { min: 3, max: 14 },
} as const;

/**
 * Calcula se um aluno deve ser matriculado antes ou depois do startDate
 */
function shouldEnrollBeforeStart(
  studentIndex: number,
  classIndexInList: number
): boolean {
  const hash = (studentIndex * 7 + classIndexInList * 3) % 10;
  return hash < ENROLLMENT_CONFIG.BEFORE_START_PERCENTAGE * 10;
}

/**
 * Calcula a data de matrícula antes do startDate
 */
function calculateEnrollmentDateBefore(
  startDate: Date,
  studentIndex: number,
  classIndexInList: number
): Date {
  const range = ENROLLMENT_CONFIG.DAYS_BEFORE_START.max - ENROLLMENT_CONFIG.DAYS_BEFORE_START.min + 1;
  const daysBefore = ENROLLMENT_CONFIG.DAYS_BEFORE_START.min + 
    ((studentIndex * 5 + classIndexInList * 3) % range);
  
  const enrollmentDate = new Date(startDate);
  enrollmentDate.setDate(enrollmentDate.getDate() - daysBefore);
  enrollmentDate.setHours(0, 0, 0, 0);
  
  return enrollmentDate;
}

/**
 * Calcula a data de matrícula depois do startDate
 */
function calculateEnrollmentDateAfter(
  startDate: Date,
  studentIndex: number,
  classIndexInList: number
): Date {
  const range = ENROLLMENT_CONFIG.DAYS_AFTER_START.max - ENROLLMENT_CONFIG.DAYS_AFTER_START.min + 1;
  const daysAfter = ENROLLMENT_CONFIG.DAYS_AFTER_START.min + 
    ((studentIndex * 7 + classIndexInList * 5) % range);
  
  const enrollmentDate = new Date(startDate);
  enrollmentDate.setDate(enrollmentDate.getDate() + daysAfter);
  enrollmentDate.setHours(0, 0, 0, 0);
  
  return enrollmentDate;
}

/**
 * Calcula a data de matrícula para um aluno em uma classe específica
 */
function calculateEnrollmentDate(
  startDate: Date,
  studentIndex: number,
  classIndexInList: number
): Date {
  if (shouldEnrollBeforeStart(studentIndex, classIndexInList)) {
    return calculateEnrollmentDateBefore(startDate, studentIndex, classIndexInList);
  }
  return calculateEnrollmentDateAfter(startDate, studentIndex, classIndexInList);
}

export async function seedClassStudents(
  students: Student[],
  classes: SeedClasses
): Promise<Enrollment[]> {
  console.log('👥 Seeding class students...');

  const allEnrollments: Enrollment[] = [];

  /**
   * Matricula um aluno em classes específicas
   * Alguns alunos serão matriculados antes do startDate, outros depois
   */
  const enrollStudent = async (
    student: Student,
    classIndices: number[],
    studentIndex: number
  ): Promise<void> => {
    const selectedClasses = classIndices.map((idx) => classes[idx]);
    
    const enrollments = await Promise.all(
      selectedClasses.map(async (classItem, classIndexInList) => {
        const enrollmentDate = calculateEnrollmentDate(
          classItem.startDate,
          studentIndex,
          classIndexInList
        );

        await prisma.classStudent.create({
          data: {
            classId: classItem.id,
            studentId: student.id,
            createdAt: enrollmentDate,
            updatedAt: enrollmentDate,
          },
        });

        return {
          classId: classItem.id,
          studentId: student.id,
          createdAt: enrollmentDate,
        };
      })
    );

    allEnrollments.push(...enrollments);
    
    const classNames = selectedClasses.map((c) => c.name).join(', ');
    console.log(`✅ ${student.name} enrolled in ${classIndices.length} classes: ${classNames}`);
  };

  /**
   * Distribuição de matrículas
   * Cada array interno representa os índices das classes que o aluno será matriculado
   * Os índices correspondem à ordem das classes criadas em classes.seed.ts

    Índice das classes (usado na distribuição abaixo):
    0: Asa Branca
    1: Balanço Carioca
    2: Pista Dourada
    3: Zumba Energia
    4: Salsa Tropical
    5: Valsa Clássica
    6: Samba Raiz
    7: Tango Argentino
    8: Forró Nordestino
    9: Gafieira Carioca
    10: Salão de Domingos
    11: Bolero Romântico
    12: Aula de Forró - Iniciantes
  */

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
      await enrollStudent(students[i], studentEnrollments[i], i);
    } else {
      console.log(`ℹ️  ${students[i].name} not enrolled (new student)`);
    }
  }

  console.log(`✅ Total students processed: ${students.length}`);
  
  return allEnrollments;
}
