import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { handlePrismaError, isPrismaError } from '../utils/prismaError';
import { AuthRequest } from '../middleware/auth.middleware';
import { normalizeDate, getEndOfDay } from '../utils/dateUtils';

interface ScheduleTime {
  startTime: string;
  endTime: string;
}

type ScheduleTimes = Record<string, ScheduleTime>;

/**
 * Verifica se o usuário tem permissão para gerenciar presenças
 */
function canManageAttendance(userRole: string): boolean {
  const allowedRoles = ['ADMIN', 'SECRETARY', 'TEACHER'];
  return allowedRoles.includes(userRole.toUpperCase());
}

/**
 * Valida se uma data é passada
 */
function isPastDate(date: Date): boolean {
  const today = normalizeDate(new Date());
  const dateNormalized = normalizeDate(date);
  return dateNormalized < today;
}

/**
 * Valida se uma data corresponde a um dia de aula válido da turma
 */
function isValidClassDate(
  date: Date,
  classItem: {
    recurringDays: number[];
    scheduleTimes: any;
    startDate: Date;
    endDate: Date | null;
  }
): boolean {
  const dateNormalized = normalizeDate(date);
  const dayOfWeek = dateNormalized.getDay();

  // Verificar se o dia da semana está nos dias recorrentes
  if (!classItem.recurringDays.includes(dayOfWeek)) {
    return false;
  }

  // Verificar se a data está dentro do período de recorrência
  const classStart = normalizeDate(classItem.startDate);
  const classEnd = classItem.endDate ? normalizeDate(classItem.endDate) : null;

  if (dateNormalized < classStart || (classEnd && dateNormalized > classEnd)) {
    return false;
  }

  // Verificar se tem horário definido para esse dia
  const scheduleTimes = classItem.scheduleTimes as unknown as ScheduleTimes;
  const daySchedule = scheduleTimes[dayOfWeek.toString()];

  return !!daySchedule?.startTime;
}

/**
 * Valida se não há exceção (cancelamento) para uma data
 */
async function hasException(classId: string, date: Date): Promise<boolean> {
  const dateNormalized = normalizeDate(date);
  const exception = await prisma.classException.findUnique({
    where: {
      classId_date: {
        classId,
        date: dateNormalized,
      },
    },
  });
  return !!exception;
}

export const getAttendances = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, studentId, startDate, endDate } = req.query;

    const where: any = {};

    if (classId) {
      where.classId = classId as string;
    }

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = normalizeDate(startDate as string);
      }
      if (endDate) {
        where.date.lte = getEndOfDay(endDate as string);
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: attendances.map((att: any) => ({
        id: att.id,
        classId: att.classId,
        studentId: att.studentId,
        date: att.date,
        status: att.status,
        className: att.Class.name,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!attendance) {
      throw createError('Frequência não encontrada', 404);
    }

    res.json({
      success: true,
      data: {
        id: attendance.id,
        classId: attendance.classId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        className: attendance.Class.name,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    // Validar permissões
    if (!canManageAttendance(req.user.role)) {
      throw createError('Você não tem permissão para criar presenças', 403);
    }

    const { classId, studentId, date, status } = req.body;

    if (!classId || !studentId || !date || !status) {
      throw createError('classId, studentId, date e status são obrigatórios', 400);
    }

    if (!['PRESENT', 'ABSENT'].includes(status.toUpperCase())) {
      throw createError('Status deve ser PRESENT ou ABSENT', 400);
    }

    const attendanceDate = normalizeDate(date);

    // Validar se a data é passada
    if (!isPastDate(attendanceDate)) {
      throw createError('Apenas datas passadas podem ser selecionadas para presenças', 400);
    }

    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        ClassStudent: {
          where: { studentId },
          select: { id: true },
        },
      },
    });

    if (!classItem) {
      throw createError('Classe não encontrada', 404);
    }

    // Verificar se o aluno pertence à turma
    if (classItem.ClassStudent.length === 0) {
      throw createError('O aluno não está matriculado nesta turma', 400);
    }

    // Validar se a data é um dia de aula válido
    if (!isValidClassDate(attendanceDate, classItem)) {
      throw createError('A data selecionada não corresponde a um dia de aula válido desta turma', 400);
    }

    // Verificar se não há exceção para essa data
    if (await hasException(classId, attendanceDate)) {
      throw createError('Não é possível registrar presença em uma data com aula cancelada', 400);
    }

    // Verificar se professor é dono da turma (se for professor)
    if (req.user.role.toUpperCase() === 'TEACHER' && classItem.teacherId !== req.user.id) {
      throw createError('Você não tem permissão para criar presenças nesta turma', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    const attendance = await prisma.attendance.create({
      data: {
        classId,
        studentId,
        date: attendanceDate,
        status: status.toUpperCase() as 'PRESENT' | 'ABSENT',
      },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: attendance.id,
        classId: attendance.classId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        className: attendance.Class.name,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return next(createError('Já existe uma frequência registrada para esta data, classe e estudante', 409));
    }
    handlePrismaError(error, 'Erro ao criar frequência', next);
  }
};

export const updateAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    // Validar permissões
    if (!canManageAttendance(req.user.role)) {
      throw createError('Você não tem permissão para editar presenças', 403);
    }

    const { id } = req.params;
    const { date, status } = req.body;

    // Buscar presença existente para validações
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        Class: {
          include: {
            ClassStudent: {
              where: { studentId: req.body.studentId || undefined },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingAttendance) {
      throw createError('Frequência não encontrada', 404);
    }

    // Verificar se teacher é dono da turma (se for teacher)
    if (req.user.role.toUpperCase() === 'TEACHER' && existingAttendance.Class.teacherId !== req.user.id) {
      throw createError('Você não tem permissão para editar presenças nesta turma', 403);
    }

    const updateData: any = {};

    if (date) {
      const attendanceDate = normalizeDate(date);

      // Validar se a data é passada
      if (!isPastDate(attendanceDate)) {
        throw createError('Apenas datas passadas podem ser selecionadas para presenças', 400);
      }

      // Validar se a data é um dia de aula válido
      if (!isValidClassDate(attendanceDate, existingAttendance.Class)) {
        throw createError('A data selecionada não corresponde a um dia de aula válido desta turma', 400);
      }

      // Verificar se não há exceção para essa data
      if (await hasException(existingAttendance.classId, attendanceDate)) {
        throw createError('Não é possível registrar presença em uma data com aula cancelada', 400);
      }

      updateData.date = attendanceDate;
    }

    if (status) {
      if (!['PRESENT', 'ABSENT'].includes(status.toUpperCase())) {
        throw createError('Status deve ser PRESENT ou ABSENT', 400);
      }
      updateData.status = status.toUpperCase();
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: attendance.id,
        classId: attendance.classId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        className: attendance.Class.name,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    });
  } catch (error) {
    handlePrismaError(error, 'Frequência não encontrada', next);
  }
};

export const deleteAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    // Validar permissões
    if (!canManageAttendance(req.user.role)) {
      throw createError('Você não tem permissão para excluir presenças', 403);
    }

    const { id } = req.params;

    // Buscar presença para validar permissões
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        Class: {
          select: {
            id: true,
            teacherId: true,
          },
        },
      },
    });

    if (!existingAttendance) {
      throw createError('Frequência não encontrada', 404);
    }

    // Verificar se teacher é dono da turma (se for teacher)
    if (req.user.role.toUpperCase() === 'TEACHER' && existingAttendance.Class.teacherId !== req.user.id) {
      throw createError('Você não tem permissão para excluir presenças desta turma', 403);
    }

    await prisma.attendance.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    handlePrismaError(error, 'Frequência não encontrada', next);
  }
};

/**
 * Cria múltiplas presenças em lote para uma turma e data
 */
export const createBulkAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    // Validar permissões
    if (!canManageAttendance(req.user.role)) {
      throw createError('Você não tem permissão para criar presenças', 403);
    }

    const { classId, date, attendances } = req.body;

    if (!classId || !date || !attendances || !Array.isArray(attendances)) {
      throw createError('classId, date e attendances (array) são obrigatórios', 400);
    }

    const attendanceDate = normalizeDate(date);

    // Validar se a data é passada
    if (!isPastDate(attendanceDate)) {
      throw createError('Apenas datas passadas podem ser selecionadas para presenças', 400);
    }

    // Buscar turma com alunos matriculados
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        ClassStudent: {
          select: {
            studentId: true,
          },
        },
      },
    });

    if (!classItem) {
      throw createError('Classe não encontrada', 404);
    }

    // Verificar se teacher é dono da turma (se for teacher)
    if (req.user.role.toUpperCase() === 'TEACHER' && classItem.teacherId !== req.user.id) {
      throw createError('Você não tem permissão para criar presenças nesta turma', 403);
    }

    // Validar se a data é um dia de aula válido
    if (!isValidClassDate(attendanceDate, classItem)) {
      throw createError('A data selecionada não corresponde a um dia de aula válido desta turma', 400);
    }

    // Verificar se não há exceção para essa data
    if (await hasException(classId, attendanceDate)) {
      throw createError('Não é possível registrar presença em uma data com aula cancelada', 400);
    }

    // Criar set de alunos matriculados para validação rápida
    const enrolledStudentIds = new Set(classItem.ClassStudent.map((cs) => cs.studentId));

    // Validar e normalizar dados de presenças
    const attendanceData = attendances.map((att: any) => {
      if (!att.studentId || !att.status) {
        throw createError('Cada presença deve ter studentId e status', 400);
      }

      if (!['PRESENT', 'ABSENT'].includes(att.status.toUpperCase())) {
        throw createError('Status deve ser PRESENT ou ABSENT', 400);
      }

      // Verificar se o aluno pertence à turma
      if (!enrolledStudentIds.has(att.studentId)) {
        throw createError(`O aluno ${att.studentId} não está matriculado nesta turma`, 400);
      }

      return {
        classId,
        studentId: String(att.studentId),
        date: attendanceDate,
        status: att.status.toUpperCase() as 'PRESENT' | 'ABSENT',
      };
    });

    // Criar ou atualizar presenças em transação usando upsert
    const result = await prisma.$transaction(
      attendanceData.map((data) =>
        prisma.attendance.upsert({
          where: {
            classId_studentId_date: {
              classId: data.classId,
              studentId: data.studentId,
              date: data.date,
            },
          } as any,
          update: {
            status: data.status,
          },
          create: data,
          include: {
            Class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      data: result.map((att) => ({
        id: att.id,
        classId: att.classId,
        studentId: att.studentId,
        date: att.date,
        status: att.status,
        className: att.Class.name,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
      })),
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return next(createError('Já existe uma frequência registrada para esta data, classe e estudante', 409));
    }
    handlePrismaError(error, 'Erro ao criar presenças em lote', next);
  }
};




