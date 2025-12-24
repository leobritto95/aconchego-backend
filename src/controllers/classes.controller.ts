import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { handlePrismaError, isPrismaError } from '../utils/prismaError';
import {
  validateRecurringDays,
  validateScheduleTimes,
} from '../utils/recurrenceUtils';
import { getPaginationParams, getPaginationResult } from '../utils/pagination';

export const getClasses = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        Attendance: true,
        ClassStudent: true,
      },
    });

    res.json({
      success: true,
      data: classes.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        description: cls.description,
        teacherId: cls.teacherId,
        style: cls.style,
        active: cls.active,
        recurringDays: cls.recurringDays,
        scheduleTimes: cls.scheduleTimes,
        startDate: cls.startDate,
        endDate: cls.endDate,
        attendanceCount: cls.Attendance.length,
        studentsCount: cls.ClassStudent.length,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getClassById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const classItem = await prisma.class.findUnique({
      where: { id },
      include: {
        Attendance: {
          orderBy: { date: 'desc' },
        },
        ClassStudent: true,
      },
    });

    if (!classItem) {
      throw createError('Classe não encontrada', 404);
    }

    // Buscar dados dos estudantes
    const studentIds = classItem.ClassStudent.map((cs) => cs.studentId);
    const students = studentIds.length > 0 
      ? await Promise.all(
          studentIds.map((id) =>
            prisma.user.findUnique({
              where: { id },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            })
          )
        ).then((results) => results.filter((s) => s !== null))
      : [];

    const studentsMap = new Map(students.map((s) => [s.id, s]));

    res.json({
      success: true,
      data: {
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        teacherId: classItem.teacherId,
        style: classItem.style,
        active: classItem.active,
        recurringDays: classItem.recurringDays,
        scheduleTimes: classItem.scheduleTimes,
        startDate: classItem.startDate,
        endDate: classItem.endDate,
        attendance: classItem.Attendance.map((att) => ({
          id: att.id,
          studentId: att.studentId,
          date: att.date,
          status: att.status,
        })),
        students: classItem.ClassStudent.map((cs) => {
          const student = studentsMap.get(cs.studentId);
          return {
            id: cs.id,
            studentId: cs.studentId,
            student: student ? {
              id: student.id,
              name: student.name,
              email: student.email,
              role: student.role.toLowerCase(),
            } : null,
            registeredAt: cs.createdAt,
          };
        }),
        createdAt: classItem.createdAt,
        updatedAt: classItem.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      teacherId,
      style,
      active,
      recurringDays,
      scheduleTimes,
      startDate,
      endDate,
    } = req.body;

    if (!name || !description || !teacherId) {
      throw createError('Nome, descrição e teacherId são obrigatórios', 400);
    }

    // Validar campos de recorrência (sempre obrigatórios agora)
    if (!recurringDays || !validateRecurringDays(recurringDays)) {
      throw createError(
        'Dias da semana inválidos. Use números de 0 (domingo) a 6 (sábado)',
        400
      );
    }
    if (!scheduleTimes || !validateScheduleTimes(scheduleTimes, recurringDays)) {
      throw createError(
        'scheduleTimes inválido. Deve ser um objeto com horários (startTime/endTime no formato HH:MM) para cada dia recorrente',
        400
      );
    }
    if (!startDate) {
      throw createError('Data de início é obrigatória', 400);
    }

    const classItem = await prisma.class.create({
      data: {
        name,
        description,
        teacherId,
        style,
        active: active !== undefined ? active : true,
        recurringDays,
        scheduleTimes,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        teacherId: classItem.teacherId,
        style: classItem.style,
        active: classItem.active,
        recurringDays: classItem.recurringDays,
        scheduleTimes: classItem.scheduleTimes,
        startDate: classItem.startDate,
        endDate: classItem.endDate,
        createdAt: classItem.createdAt,
        updatedAt: classItem.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      style,
      description,
      teacherId,
      active,
      recurringDays,
      scheduleTimes,
      startDate,
      endDate,
    } = req.body;

    // Buscar classe atual para validar scheduleTimes se necessário
    const currentClass = await prisma.class.findUnique({
      where: { id },
      select: { recurringDays: true },
    });

    if (!currentClass) {
      throw createError('Classe não encontrada', 404);
    }

    // Validar campos de recorrência se fornecidos
    const finalRecurringDays = recurringDays !== undefined ? recurringDays : currentClass.recurringDays;
    
    if (recurringDays !== undefined && !validateRecurringDays(recurringDays)) {
      throw createError('Dias da semana inválidos', 400);
    }

    if (scheduleTimes !== undefined && !validateScheduleTimes(scheduleTimes, finalRecurringDays)) {
      throw createError(
        'scheduleTimes inválido. Deve ser um objeto com horários (startTime/endTime no formato HH:MM) para cada dia recorrente',
        400
      );
    }

    // Construir objeto de atualização
    const updateData: any = {
      ...(name && { name }),
      ...(style !== undefined && { style }),
      ...(description !== undefined && { description }),
      ...(teacherId !== undefined && { teacherId }),
      ...(active !== undefined && { active }),
      ...(recurringDays !== undefined && { recurringDays }),
      ...(scheduleTimes !== undefined && { scheduleTimes }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    };

    const classItem = await prisma.class.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        teacherId: classItem.teacherId,
        style: classItem.style,
        active: classItem.active,
        recurringDays: classItem.recurringDays,
        scheduleTimes: classItem.scheduleTimes,
        startDate: classItem.startDate,
        endDate: classItem.endDate,
        createdAt: classItem.createdAt,
        updatedAt: classItem.updatedAt,
      },
    });
  } catch (error) {
    handlePrismaError(error, 'Classe não encontrada', next);
  }
};

export const deleteClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deletedClass = await prisma.class.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: {
        id: deletedClass.id,
        name: deletedClass.name,
        description: deletedClass.description,
        teacherId: deletedClass.teacherId,
        style: deletedClass.style,
        createdAt: deletedClass.createdAt,
        updatedAt: deletedClass.updatedAt,
      },
    });
  } catch (error) {
    handlePrismaError(error, 'Classe não encontrada', next);
  }
};

export const registerStudentToClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      throw createError('studentId é obrigatório', 400);
    }

    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw createError('Classe não encontrada', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    if (user.role !== 'STUDENT') {
      throw createError('Usuário deve ser um estudante', 400);
    }

    const classStudent = await prisma.classStudent.create({
      data: {
        classId,
        studentId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: classStudent.id,
        classId: classStudent.classId,
        studentId: classStudent.studentId,
        createdAt: classStudent.createdAt,
        updatedAt: classStudent.updatedAt,
      },
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return next(createError('Estudante já está registrado nesta classe', 409));
    }
    handlePrismaError(error, 'Erro ao registrar estudante', next);
  }
};

export const removeStudentFromClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: classId, studentId } = req.params;

    if (!studentId) {
      throw createError('studentId é obrigatório', 400);
    }

    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw createError('Classe não encontrada', 404);
    }

    const classStudent = await prisma.classStudent.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    if (!classStudent) {
      throw createError('Estudante não está registrado nesta classe', 404);
    }

    await prisma.classStudent.delete({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Estudante removido da classe com sucesso',
      },
    });
  } catch (error) {
    handlePrismaError(error, 'Erro ao remover estudante da classe', next);
  }
};

export const getAvailableStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: classId } = req.params;
    const { page, limit, skip } = getPaginationParams(req);

    // Verificar se a classe existe
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });

    if (!classExists) {
      throw createError('Classe não encontrada', 404);
    }

    // Buscar IDs dos alunos já matriculados na turma
    const enrolledStudents = await prisma.classStudent.findMany({
      where: { classId },
      select: { studentId: true },
    });

    const enrolledStudentIds = enrolledStudents.map((es) => es.studentId);

    // Construir query para buscar alunos não matriculados
    const where: any = {
      role: 'STUDENT',
      id: {
        notIn: enrolledStudentIds.length > 0 ? enrolledStudentIds : [],
      },
    };

    // Adicionar busca por nome ou email se fornecido
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search as string, mode: 'insensitive' } },
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = getPaginationResult(total, page, limit);

    res.json({
      success: true,
      data: {
        data: students.map((student) => ({
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role.toLowerCase(),
        })),
        ...pagination,
      },
    });
  } catch (error) {
    handlePrismaError(error, 'Erro ao buscar alunos disponíveis', next);
  }
};
